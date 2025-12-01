"""Developer sandbox service."""

import asyncio
import tempfile
from pathlib import Path
from typing import Dict, Tuple

from fastapi import HTTPException, status

from models.sandbox import SandboxRunRequest, SandboxRunResponse


class SandboxService:
    """Executes short-lived scripts in isolated subprocesses."""

    SUPPORTED: Dict[str, Tuple[str, ...]] = {
        "python": ("python3", "-u"),
        "py": ("python3", "-u"),
        "javascript": ("node",),
        "node": ("node",),
    }

    async def run(self, payload: SandboxRunRequest) -> SandboxRunResponse:
        """Execute code for supported runtimes."""
        normalized = payload.language.strip().lower()
        if normalized not in self.SUPPORTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Runtime '{payload.language}' not supported yet",
            )

        runner = self.SUPPORTED[normalized]
        suffix = ".py" if "python" in normalized or normalized == "py" else ".js"
        with tempfile.NamedTemporaryFile("w+", suffix=suffix, delete=False) as tmp:
            tmp.write(payload.code)
            tmp.flush()
            script_path = Path(tmp.name)

        try:
            process = await asyncio.create_subprocess_exec(
                *runner,
                str(script_path),
                stdin=asyncio.subprocess.PIPE if payload.input_text else None,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        except FileNotFoundError as exc:
            script_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Runtime '{runner[0]}' is not installed on the server",
            ) from exc

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(
                    input=payload.input_text.encode("utf-8") if payload.input_text else None
                ),
                timeout=10,
            )
        except asyncio.TimeoutError:
            process.kill()
            raise HTTPException(
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
                detail="Sandbox execution timed out after 10s",
            )
        finally:
            try:
                script_path.unlink(missing_ok=True)
            except OSError:
                pass

        return SandboxRunResponse(
            language=normalized,
            stdout=stdout.decode("utf-8", errors="ignore"),
            stderr=stderr.decode("utf-8", errors="ignore"),
            exit_code=process.returncode,
            duration_ms=0,  # filled by router
        )
