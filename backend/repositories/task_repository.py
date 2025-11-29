"""Task repository."""

from typing import List, Optional
from datetime import datetime
from database import get_db
from models.task import Task


class TaskRepository:
    """Data access for task documents."""

    def __init__(self):
        self.collection_name = "tasks"

    async def replace_project_tasks(self, project_id: str, tasks_data: List[dict]) -> List[Task]:
        """Replace all tasks for a project with generated tasks."""
        db = get_db()
        await db[self.collection_name].delete_many({"project_id": project_id})

        docs = []
        for idx, task in enumerate(tasks_data):
            doc = {
                "_id": task.get("_id") or f"task_{str(datetime.utcnow().timestamp()).replace('.', '')}_{idx}",
                "project_id": project_id,
                "requirement_id": task.get("requirement_id"),
                "title": task.get("title", "Task"),
                "description": task.get("description", ""),
                "estimate_hours": float(task.get("estimate_hours", 0)),
                "actual_hours": float(task.get("actual_hours", 0)),
                "start_date": task.get("start_date"),
                "due_date": task.get("due_date"),
                "status": task.get("status", "planned"),
                "priority": task.get("priority", "medium"),
                "dependencies": task.get("dependencies", []) or [],
                "tags": task.get("tags", []) or [],
                "phase": task.get("phase"),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            docs.append(doc)

        if docs:
            await db[self.collection_name].insert_many(docs)

        return [Task(**doc) for doc in docs]

    async def list_by_project(self, project_id: str) -> List[Task]:
        """List tasks for a project."""
        db = get_db()
        cursor = db[self.collection_name].find({"project_id": project_id}).sort("created_at", -1)
        tasks: List[Task] = []
        async for doc in cursor:
            tasks.append(Task(**doc))
        return tasks

    async def get_by_id(self, task_id: str) -> Optional[Task]:
        """Fetch a task by id."""
        db = get_db()
        doc = await db[self.collection_name].find_one({"_id": task_id})
        if doc:
            return Task(**doc)
        return None

    async def update_task(self, task_id: str, updates: dict) -> Optional[Task]:
        """Update a specific task."""
        db = get_db()
        payload = {k: v for k, v in updates.items() if v is not None}
        payload["updated_at"] = datetime.utcnow()
        result = await db[self.collection_name].find_one_and_update(
            {"_id": task_id},
            {"$set": payload},
            return_document=True
        )
        if result:
            return Task(**result)
        return None

    async def create_task(self, project_id: str, data: dict) -> Task:
        """Create a single task."""
        db = get_db()
        task_id = data.get("_id") or f"task_{str(datetime.utcnow().timestamp()).replace('.', '')}"
        doc = {
            "_id": task_id,
            "project_id": project_id,
            "requirement_id": data.get("requirement_id"),
            "title": data.get("title", "Task"),
            "description": data.get("description", ""),
            "estimate_hours": float(data.get("estimate_hours", 0) or 0),
            "actual_hours": float(data.get("actual_hours", 0) or 0),
            "start_date": data.get("start_date"),
            "due_date": data.get("due_date"),
            "status": data.get("status", "planned"),
            "priority": data.get("priority", "medium"),
            "dependencies": data.get("dependencies", []) or [],
            "tags": data.get("tags", []) or [],
            "phase": data.get("phase"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await db[self.collection_name].insert_one(doc)
        return Task(**doc)
