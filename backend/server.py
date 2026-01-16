"""FastAPI main application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from database import init_db, close_db
from routes import auth, projects, generation, requirements, tasks, diagrams, ux_flow, phase_flow, sandbox, users, change_log, websocket, ai_pipeline
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    await init_db()
    
    # Initialize Redis cache
    from utils.cache import init_redis
    await init_redis()
    
    yield
    
    # Shutdown
    await close_db()
    
    # Close Redis connection
    from utils.cache import close_redis
    await close_redis()


app = FastAPI(
    title="Acorn - AI Planning Platform",
    description="Plant the seeds of perfect projects with AI-powered software planning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://dazzling-sprinkles-ae0afa.netlify.app",
]
if settings.frontend_origin:
    default_origins.append(settings.frontend_origin)

allowed_origins = [origin for origin in default_origins if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(generation.router, prefix="/api/generation", tags=["AI Generation"])
app.include_router(generation.jobs_router, prefix="/api/generation-jobs", tags=["AI Generation"])
app.include_router(requirements.router, prefix="/api", tags=["Requirements"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(diagrams.router, prefix="/api", tags=["Diagrams"])
app.include_router(ux_flow.router, prefix="/api", tags=["UX Flow"])
app.include_router(phase_flow.router, prefix="/api", tags=["Phases"])
app.include_router(sandbox.router, prefix="/api/sandbox", tags=["Sandbox"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(change_log.router, prefix="/api", tags=["ChangeLog"])
app.include_router(websocket.router, prefix="/api/ws", tags=["WebSocket"])
app.include_router(ai_pipeline.router, prefix="/api/ai", tags=["AI Pipeline"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Acorn Backend", "message": "Growing strong! 🌰"}
