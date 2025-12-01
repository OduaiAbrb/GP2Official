"""Phase flow generation service."""

from typing import Dict, Tuple
import logging

from config import settings
from emergentintegrations.llm.chat import LlmChat, UserMessage
from repositories.project_repository import ProjectRepository
from models.project import default_phase_status
from repositories.artifact_repository import ArtifactRepository

logger = logging.getLogger(__name__)

PHASE_ORDER = [
    "planning",
    "feasibility_study",
    "requirements_gathering",
    "validation",
    "design",
    "development",
    "tasks",
    "cost_benefit",
    "risks",
    "summary",
]

PHASE_TITLES = {
    "planning": "Planning",
    "feasibility_study": "Feasibility Study",
    "requirements_gathering": "Requirements Gathering",
    "validation": "Validation",
    "design": "Design",
    "development": "Development",
    "tasks": "Tasks",
    "cost_benefit": "Costs & Benefits",
    "risks": "Risks & Mitigations",
    "summary": "Summary",
}


class PhaseFlowService:
    """Manage sequential phase generation and storage."""

    def __init__(self):
        self.provider = settings.llm_provider
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model_name
        self.project_repo = ProjectRepository()
        self.artifact_repo = ArtifactRepository()

    async def get_status(self, project_id: str, organization: str) -> Dict[str, str]:
        project = await self.project_repo.get_by_id(project_id, organization)
        if not project:
            raise ValueError("Project not found")
        return project.phase_status

    async def unlock_all(self, project_id: str, organization: str) -> Dict[str, str]:
        project = await self.project_repo.get_by_id(project_id, organization)
        if not project:
            raise ValueError("Project not found")
        updated = {phase: "ready" for phase in PHASE_ORDER}
        project = await self.project_repo.update_phase_status(project_id, organization, updated)
        return project.phase_status

    async def generate_phase(self, project_id: str, organization: str, phase: str, prompt: str) -> Tuple[Dict[str, str], Dict]:
        phase = phase.lower()
        if phase not in PHASE_ORDER:
            raise ValueError("Invalid phase")

        project = await self.project_repo.get_by_id(project_id, organization)
        if not project:
            raise ValueError("Project not found")

        # Normalize status to ensure every phase is present and planning is always startable
        normalized_status = default_phase_status()
        normalized_status.update(project.phase_status or {})
        status = dict(normalized_status)
        current_state = status.get(phase)
        if phase == "planning" and current_state == "locked":
            current_state = "ready"
            status[phase] = "ready"
        if current_state == "completed":
            # Allow regenerating completed phases by resetting to ready
            current_state = "ready"
            status[phase] = "ready"
        if current_state not in {"ready", "in_progress"}:
            raise PermissionError("This phase is locked. Complete previous phases first.")

        status[phase] = "in_progress"
        await self.project_repo.update_phase_status(project_id, organization, status)

        content = await self._run_phase_prompt(project.name, phase, prompt)

        artifact_type = f"PHASE_{phase.upper()}"
        metadata = {"phase": phase}
        artifact = await self.artifact_repo.upsert_artifact(
            project_id,
            artifact_type,
            f"{PHASE_TITLES[phase]} Output",
            {"markdown": content},
            metadata=metadata,
        )

        status[phase] = "completed"
        next_index = PHASE_ORDER.index(phase) + 1
        if next_index < len(PHASE_ORDER):
            next_phase = PHASE_ORDER[next_index]
            if status.get(next_phase) == "locked":
                status[next_phase] = "ready"
        updated_project = await self.project_repo.update_phase_status(project_id, organization, status)

        return updated_project.phase_status, {
            "artifact_id": artifact.id,
            "content": artifact.content_json,
            "metadata": artifact.metadata,
        }

    async def _run_phase_prompt(self, project_name: str, phase: str, user_prompt: str) -> str:
        llm_requires_key = self.provider not in {"stub", "mock"}
        if llm_requires_key and not self.api_key:
            logger.warning("LLM API key missing; returning placeholder content")
            return f"# {PHASE_TITLES[phase]}\n\nNo LLM configured. User prompt:\n{user_prompt}"

        system_message = (
            "You are Athena, an expert AI program manager inside the Acorn platform. "
            "You help users through sequential software planning phases. "
            "Provide concise, actionable outputs tailored to the requested phase."
        )
        phase_instructions = {
            "planning": (
                "Craft the Planning Brief: summarize the problem, vision, guardrails, business goals, "
                "key stakeholders, and success metrics. Highlight risks/assumptions and the next decision gates."
            ),
            "feasibility_study": (
                "Produce a comprehensive Feasibility Study: analyze market opportunity, technical feasibility, "
                "economic viability, operational readiness, legal/compliance considerations, and provide a go/no-go recommendation."
            ),
            "requirements_gathering": (
                "Design the Requirements Document: personas, user stories, functional requirements, non-functional requirements, "
                "acceptance criteria, and priority scores. Trace how findings map to downstream tasks."
            ),
            "validation": (
                "Provide the Validation Checklist: stakeholder sign-off criteria, prototype validation steps, risk confirmation, "
                "acceptance criteria verification, and traceability matrix for requirements."
            ),
            "design": (
                "Deliver the Design Document: system architecture overview, component diagrams, data models, "
                "API specifications, UX wireframe descriptions, and integration touchpoints."
            ),
            "development": (
                "Regenerate a complete Development Plan using all available project context (planning, feasibility, "
                "requirements, validation, and design outputs). Use this exact section layout so the UI can parse it: \n"
                "\n## Tech Stack\n"
                "- Group technologies by area (Frontend, Backend, Database, Infrastructure, Tooling).\n"
                "- For each item, use the format `Name: short description`.\n"
                "\n## Flow\n"
                "- Provide 5–10 high-level steps showing the request/response flow end-to-end.\n"
                "- Use a simple bulleted or numbered list with the format `Step name: short description`.\n"
                "- Keep each step on a single line so it can be turned into a diagram node.\n"
                "\n## Folder Structure\n"
                "```\n"
                "<tree-style directory structure for the project, using indents and ├── / └── where helpful>\n"
                "```\n"
                "\n## Components (optional)\n"
                "- If helpful, list key controllers, services, repositories, models, and frontend components.\n"
                "- Use bullets with the format `ComponentName: short responsibility description`.\n"
                "\nKeep the response concise and in clean Markdown so it maps cleanly onto the Stack, Flow, and Folder Structure tabs."
            ),
            "tasks": (
                "Author the Execution Map: break work into epics, stories, and tasks with time estimates. "
                "Define dependencies, milestones, and owner assignments for Gantt visualization."
            ),
            "cost_benefit": (
                "Produce a concise Cost & Benefit analysis using the latest project context (requirements, tasks, and any custom items). "
                "Summarize the main cost drivers, estimated benefits, and ROI. Highlight budget hotspots and high-ROI opportunities. "
                "If the user provided a scenario (team size, role mix, custom ROI, or what-if prompt), reflect that scenario explicitly in the analysis."
            ),
            "risks": (
                "Compile a clear, actionable Risk Register for the project in Markdown. Use this exact structure: \n"
                "\n# Risk Overview\n"
                "Provide 2–3 bullet points summarizing overall risk posture (e.g., main themes, confidence level).\n"
                "\n## Risk Register\n"
                "Create a Markdown table with columns: `Risk`, `Impact`, `Likelihood`, `Mitigation`, `Owner`.\n"
                "- Include at least 8–12 distinct risks covering delivery, technical, security, data, UX, organizational, and dependency risks.\n"
                "- Use simple values like High/Medium/Low for Impact and Likelihood.\n"
                "\n## Before vs After Mitigation\n"
                "Create a small comparison table that shows how the overall risk posture changes if mitigations are applied, e.g.:\n"
                "| Aspect | Before | After |\n"
                "|--------|--------|-------|\n"
                "| Delivery risk | High | Medium |\n"
                "| Technical risk | High | Medium |\n"
                "| ... | ... | ... |\n"
                "\n## Recommended Actions (Checklist)\n"
                "List 5–10 concrete next actions as a Markdown checklist (using - [ ]), each referencing one or more risks and owners.\n"
                "Keep the entire response in clean Markdown so the UI can render tables and sections side-by-side."
            ),
            "summary": (
                "Compile the Project Summary: key achievements, final metrics, lessons learned, "
                "outstanding risks, recommendations for future work, and stakeholder acknowledgments."
            ),
        }
        user_prompt = user_prompt.strip() or "Use available project context."
        phase_text = phase_instructions.get(phase, "")
        prompt = (
            f"Project: {project_name}\n"
            f"Phase: {PHASE_TITLES[phase]}\n"
            f"System expectations: {phase_text}\n"
            f"User request: {user_prompt}\n\n"
            "Produce a structured Markdown response with headings, bullet lists, and clear action items."
        )

        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"phase_{phase}",
            system_message=system_message,
        ).with_model(self.provider, self.model)

        try:
            response = await chat.send_message(UserMessage(text=prompt))
            return response
        except Exception as exc:  # pragma: no cover
            logger.error("Failed to generate phase output: %s", exc)
            return f"# {PHASE_TITLES[phase]}\n\nWe encountered an error generating this phase. Please try again later."
