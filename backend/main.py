"""ASGI entrypoint for Uvicorn."""

from server import app  # re-export for uvicorn main:app

__all__ = ("app",)
