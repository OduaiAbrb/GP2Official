"""Conversational overlay assistant service."""

from typing import Optional, List
from emergentintegrations.llm.chat import LlmChat, UserMessage
from repositories.project_repository import ProjectRepository
from repositories.artifact_repository import ArtifactRepository
from repositories.requirement_repository import RequirementRepository
from repositories.task_repository import TaskRepository
from config import settings


class ContextAssistantService:
    """Provide contextual responses for conversational overlay."""

    def __init__(self) -> None:
        self.project_repo = ProjectRepository()
        self.artifact_repo = ArtifactRepository()
        self.requirement_repo = RequirementRepository()
        self.task_repo = TaskRepository()
        self.provider = settings.llm_provider
        self.model = settings.llm_model_name
        self.api_key = settings.llm_api_key

    async def chat(
        self,
        project_id: str,
        organization: str,
        prompt: str,
        phase_id: Optional[str] = None,
    ) -> str:
        project = await self.project_repo.get_by_id(project_id, organization)
        if not project:
            raise ValueError("Project not found")

        artifacts = await self.artifact_repo.list_by_project(project_id)
        phase_artifacts = self._filter_phase_artifacts(artifacts, phase_id)
        requirements = await self.requirement_repo.list_by_project(project_id)
        tasks = await self.task_repo.list_by_project(project_id)

        context = self._build_context(project, phase_artifacts, requirements, tasks)

        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"assistant_{project_id}",
            system_message=(
                "You are an embedded project planning coach. "
                "Answer questions using the provided project context. "
                "Cite which phase/artifact you referenced. "
                "If information is missing, explain what additional inputs are needed."
            ),
        ).with_model(self.provider, self.model)

        response = await chat.send_message(UserMessage(text=f"{context}\n\nUser question: {prompt.strip()}"))
        return response

    def _filter_phase_artifacts(self, artifacts, phase_id: Optional[str]):
        if phase_id:
            target = f"PHASE_{phase_id.upper()}"
            return [a for a in artifacts if a.type == target]
        return [a for a in artifacts if a.type and a.type.startswith("PHASE_")]

    def _build_context(self, project, artifacts, requirements, tasks) -> str:
        sections: List[str] = []
        sections.append(f"Project: {project.name}\nType: {project.template_type}\nStatus: {project.status}")
        if project.description:
            sections.append(f"Description: {project.description}")
        if project.brief_text:
            sections.append(f"Brief:\n{project.brief_text}")

        if artifacts:
            latest = artifacts[:3]
            artifact_snippets = "\n\n".join(
                f"{art.title}:\n{(art.content_json or {}).get('markdown', '')[:800]}"
                for art in latest
            )
            sections.append(f"Latest phase outputs:\n{artifact_snippets}")

        if requirements:
            top_reqs = requirements[:10]
            req_lines = "\n".join(f"- {req.title}: {req.description}" for req in top_reqs)
            sections.append(f"Key Requirements:\n{req_lines}")

        if tasks:
            planned = [t for t in tasks if (t.status or '').lower() != 'completed']
            if planned:
                task_lines = "\n".join(f"- {t.title} ({t.status})" for t in planned[:10])
                sections.append(f"Upcoming Tasks:\n{task_lines}")

        return "\n\n".join(sections)
