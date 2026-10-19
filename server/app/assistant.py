"""Opt-in server CPU inference with fixed executable, timeout and typed proposals."""
import asyncio
import json
import os
import shutil
import threading
from pathlib import Path
from typing import Annotated, Literal

from pydantic import Field, ValidationError

from .process import ProcessScenario
from .schemas import StrictModel
from .store import DomainError

ROOT = Path(__file__).resolve().parents[2]
MODEL = "onnx-community/Qwen2.5-0.5B-Instruct"
REVISION = "22942cb7d7ba4cc81bb4673549ca4d4614469b5e"
SLOT = threading.Semaphore(1)


class AssistantRequest(StrictModel):
    base_revision: Annotated[int, Field(ge=0)]
    message: Annotated[str, Field(min_length=1, max_length=2000)]
    language: Literal["en", "it", "fr", "es"] = "en"
    mode: Literal["chat", "commercial", "process"] = "chat"


def status():
    enabled = os.environ.get("MOULD_SERVER_AI") == "1"
    ready = (ROOT / ".cache/ai/models" / MODEL / REVISION / "onnx/model_q4.onnx").is_file()
    return {"enabled": enabled, "ready": enabled and ready and shutil.which("node") is not None,
            "model": MODEL, "model_revision": REVISION, "runtime": "server-cpu"}


def validated_result(text, request, project):
    result = {"reply": text, "process": None, "commercial": None, "base_revision": project["revision"],
              "source": {"kind": "ai", "request": request.message, "model": MODEL, "model_revision": REVISION}}
    if request.mode == "chat":
        return result
    try:
        cleaned = text.strip()
        if cleaned.startswith('```'):
            cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()
        proposal = json.loads(cleaned)
        if set(proposal) != {"reply", "changes"} or not isinstance(proposal["reply"], str) or not isinstance(proposal["changes"], dict):
            raise ValueError("Invalid proposal shape.")
        result["reply"] = proposal["reply"][:2000]
        if request.mode == "process":
            if not project["process"]:
                raise ValueError("Load and approve the process example or configure a scenario first.")
            patch = proposal["changes"]
            if not patch or any(k not in ProcessScenario.model_fields or k in ("name", "basis", "material") for k in patch):
                raise ValueError("Unsupported process field or empty proposal.")
            # No model coercion of strings, NaN, booleans, or unknown keys.
            result["process"] = ProcessScenario.model_validate(project["process"] | patch).model_dump()
        else:
            changes = proposal["changes"]
            if any(k != "brief" and v for k, v in changes.items()):
                raise ValueError("Only commercial changes are supported in this mode.")
            from .schemas import CommercialPatch
            patch = changes.get("brief", {})
            mapping = {"unit_cost_target_eur": "unit_cost_target", "selling_price_eur": "selling_price", "mould_budget_eur": "mould_budget"}
            if any(k in patch for k in mapping):
                if project["commercial"]["currency"] not in (None, "EUR"):
                    raise ValueError("AI amount proposals use EUR. Use properties for other currencies.")
                patch = {mapping.get(k, k): v for k, v in patch.items()} | {"currency": "EUR"}
            result["commercial"] = CommercialPatch.model_validate(patch).model_dump(exclude_unset=True, mode="json")
    except (ValueError, TypeError, ValidationError) as error:
        # The model answer remains visible; malformed proposals never become executable.
        result["process"] = result["commercial"] = None
        result["validation_error"] = str(error)[:600]
    return result


async def generate(request, project, disconnected, run=None):
    if not status()["ready"]:
        raise DomainError(503, "Server AI is not prepared. Run python scripts/setup_codespaces.py --with-ai.")
    if not SLOT.acquire(blocking=False):
        raise DomainError(429, "The CPU assistant is busy. Retry when its current request finishes.")
    process = None
    try:
        fields = {k: ({"enum": v["enum"]} if "enum" in v else {"type": v["type"]}) for k, v in ProcessScenario.model_json_schema()["properties"].items() if k not in ("name", "basis", "material")}
        payload = {"mode": request.mode, "message": request.message, "language": request.language, "fields": fields,
                   "context": {"brief": project["commercial"], "part": {}, "geometry": {}, "process": project["process"],
                               "latest_run": {"summary": run["summary"], "stale": run["project_revision"] != project["revision"]} if run else None,
                               "capabilities": "Commercial fields and configured L0 process settings only; no CAD or polymer physics operations."}}
        process = await asyncio.create_subprocess_exec(shutil.which("node"), str(ROOT / "prototype/server-ai.mjs"),
            cwd=ROOT, stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        task = asyncio.create_task(process.communicate(json.dumps(payload).encode()))
        deadline = asyncio.get_running_loop().time() + 150
        while not task.done():
            await asyncio.wait({task}, timeout=.25)
            if await disconnected():
                raise DomainError(499, "AI request cancelled.")
            if asyncio.get_running_loop().time() > deadline:
                raise DomainError(504, "CPU inference timed out. Try a shorter request.")
        output, _error = await task
        if process.returncode or len(output) > 32768:
            raise DomainError(503, "CPU inference failed. Check the pinned model cache and Node runtime.")
        response = json.loads(output)
        return validated_result(response["text"], request, project)
    finally:
        try:
            if process is not None and process.returncode is None:
                try:
                    process.kill()
                except ProcessLookupError:
                    pass
                await process.wait()
                if 'task' in locals():
                    await task
        finally:
            SLOT.release()
