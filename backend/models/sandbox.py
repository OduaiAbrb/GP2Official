"""Sandbox execution models."""

from typing import Literal, Optional
from pydantic import BaseModel, Field


SupportedLanguage = Literal["python", "javascript", "node", "py", "js", "typescript"]


class SandboxRunRequest(BaseModel):
    """Incoming payload for sandbox execution."""

    language: str = Field(..., description="Requested runtime (python, javascript, etc.)")
    code: str = Field(..., min_length=1, max_length=8000)
    input_text: Optional[str] = Field(
        None, description="Optional stdin passed to the script"
    )


class SandboxRunResponse(BaseModel):
    """Execution results."""

    language: str
    stdout: str
    stderr: str
    duration_ms: int
    exit_code: int
