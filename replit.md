# Acorn - AI Planning Platform

An AI-powered software planning platform that helps teams plan projects through structured phases, requirement gathering, feasibility studies, system design, and more.

## Project Structure

- **frontend/** - React + Vite + TypeScript SPA running on port 5000
- **backend/** - FastAPI Python backend running on port 8000

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (dev server on port 5000)
- Tailwind CSS
- React Router DOM
- Zustand (state management)
- ReactFlow (diagram editor)
- Axios for API calls

### Backend
- FastAPI (Python)
- PostgreSQL via AsyncPG
- JWT authentication
- Google Gemini AI (primary LLM provider)
- Redis (optional caching)

## Workflows

- **Start application** - Runs `cd frontend && npm run dev` on port 5000 (webview)
- **Backend** - Runs `cd backend && uvicorn main:app --host localhost --port 8000 --reload` (console)

## Database

Uses Replit's built-in PostgreSQL database. The backend auto-creates all tables on startup via `database.py:ensure_tables_exist()`.

Key tables: `users`, `projects`, `artifacts`, `requirements`, `tasks`, `ai_runs`, `workspace_invites`, `refresh_tokens`

## Configuration

- `backend/config.py` - All app settings via Pydantic Settings (reads from env vars)
- `frontend/vite.config.ts` - Vite config with proxy to backend at `/api`
- `DATABASE_URL` env var is set automatically by Replit

## API Structure

All backend routes are under `/api/`. The frontend proxies `/api` requests to `http://localhost:8000`.

Key route groups: auth, projects, generation, requirements, tasks, diagrams, users, billing, export

## AI Integration

Uses Google Gemini as primary AI provider:
- `gemini-2.5-pro` for complex tasks
- `gemini-2.0-flash` for fast tasks
- API key stored in `config.py` (should be moved to env var for production)
