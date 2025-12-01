"""Developer sandbox routes."""

import time
from fastapi import APIRouter, Depends

from models.sandbox import SandboxRunRequest, SandboxRunResponse
from models.user import User
from routes.auth import get_current_user
from services.sandbox_service import SandboxService

router = APIRouter()
sandbox_service = SandboxService()


@router.post("/run", response_model=SandboxRunResponse)
async def run_snippet(
    payload: SandboxRunRequest,
    current_user: User = Depends(get_current_user),
) -> SandboxRunResponse:
    """Execute a short script for the authenticated user."""
    start = time.perf_counter()
    result = await sandbox_service.run(payload)
    elapsed = int((time.perf_counter() - start) * 1000)
    return SandboxRunResponse(
        language=result.language,
        stdout=result.stdout,
        stderr=result.stderr,
        duration_ms=elapsed,
        exit_code=result.exit_code,
    )
