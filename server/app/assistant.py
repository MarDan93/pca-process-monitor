"""Opt-in server CPU inference with fixed executable, timeout and typed proposals."""
import asyncio
import json
import os
import re
import shutil
import threading
from pathlib import Path
from typing import Annotated, Literal

from pydantic import Field, ValidationError

from .process import ProcessScenario
from .schemas import StrictModel
from .store import DomainError

ROOT = Path(__file__).resolve().parents[2]
MODELS = json.loads((Path(__file__).parent / "model-manifest.json").read_text())

def model_config():
    return MODELS.get(os.environ.get("MOULD_AI_PROFILE", "compact"), MODELS["compact"])

MODEL = MODELS["compact"]["model"]
REVISION = MODELS["compact"]["revision"]
SLOT = threading.Semaphore(1)


class ChatMessage(StrictModel):
    role: Literal["user", "assistant"]
    content: Annotated[str, Field(min_length=1, max_length=3000)]


class AssistantRequest(StrictModel):
    history: Annotated[list[ChatMessage], Field(max_length=6)] = []
    base_revision: Annotated[int, Field(ge=0)]
    message: Annotated[str, Field(min_length=1, max_length=2000)]
    language: Literal["en", "it", "fr", "es"] = "en"
    mode: Literal["chat", "commercial", "process", "system"] = "chat"
    scenario_id: str | None = Field(default=None,max_length=36)


def status():
    enabled = os.environ.get("MOULD_SERVER_AI") == "1"
    config = model_config()
    valid_profile = os.environ.get("MOULD_AI_PROFILE", "compact") in MODELS
    weight = ROOT / ".cache/ai/models" / config["model"] / config["revision"] / "onnx/model_q4.onnx"
    ready = weight.is_file() and weight.stat().st_size == config["bytes"]
    return {"enabled": enabled, "ready": enabled and ready and valid_profile and shutil.which("node") is not None,
            "model": config["model"], "model_revision": config["revision"], "runtime": "server-cpu", "conversation": "grounded_workflow", "profile": os.environ.get("MOULD_AI_PROFILE", "compact")}


def validated_result(text, request, project):
    result = {"reply": text, "process": None, "commercial": None, "system":None,"scenario_id":request.scenario_id, "base_revision": project["revision"],
              "source": {"kind": "ai", "request": request.message, "model": model_config()["model"], "model_revision": model_config()["revision"]}}
    if request.mode == "chat":
        from .advisor import workflow_reply
        result["reply"], guided = workflow_reply(text, request.language, project)
        result["response_mode"] = "guided_workflow" if guided else "ai_routed_workflow"
        return result
    try:
        cleaned = text.strip()
        if cleaned.startswith('```'):
            cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()
        proposal = json.loads(cleaned)
        if set(proposal) != {"reply", "changes"} or not isinstance(proposal["reply"], str) or not isinstance(proposal["changes"], dict):
            raise ValueError("Invalid proposal shape.")
        # Do not expose free model prose as engineering/commercial facts.
        result["reply"] = {"en": "Review the proposed fields before saving.", "it": "Verifica i campi proposti prima di salvare.",
                           "fr": "Vérifiez les champs proposés avant d’enregistrer.", "es": "Revisa los campos propuestos antes de guardar."}[request.language]
        changes = proposal["changes"] if request.mode in ("process","system") else proposal["changes"].get("brief", {})
        ground_explicit_changes(changes, request.message)
        if request.mode == "system":
            scenario=next((s for s in (project.get('production_system') or {}).get('scenarios',[]) if s['id']==request.scenario_id),None)
            if scenario is None:raise ValueError('Choose a saved production-system scenario before proposing changes.')
            patch=proposal['changes']
            if not patch or any(key not in SYSTEM_FIELDS for key in patch):raise ValueError('Unsupported production-system field or empty proposal.')
            import copy
            from .system.schemas import ProductionSystemScenario
            cfg=copy.deepcopy(scenario['configuration'])
            for key,value in patch.items():
                if key.casefold() not in request.message.casefold():raise ValueError('Mention the exact system field to avoid ambiguous assignments.')
                group,field=SYSTEM_FIELDS[key];cfg[group][field]=value
            result['system']=ProductionSystemScenario.model_validate(cfg).model_dump(mode='json')
        elif request.mode == "process":
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
                if project["commercial"]["currency"] is None and not re.search(r"eur|euro|€", request.message.casefold()):
                    raise ValueError("Confirm the currency before proposing amounts.")
                if project["commercial"]["currency"] not in (None, "EUR"):
                    raise ValueError("AI amount proposals use EUR. Use properties for other currencies.")
                patch = {mapping.get(k, k): v for k, v in patch.items()} | {"currency": "EUR"}
            result["commercial"] = CommercialPatch.model_validate(patch).model_dump(exclude_unset=True, mode="json")
    except (ValueError, TypeError, ValidationError) as error:
        # Neither invented facts nor malformed proposals become executable/visible.
        result["reply"] = {"en": "I could not extract a supported, explicitly stated update. Specify the field and value, or use the properties panel.",
                           "it": "Non ho estratto un aggiornamento supportato ed esplicito. Specifica campo e valore oppure usa il pannello proprietà.",
                           "fr": "Aucune modification explicite prise en charge n’a été extraite. Précisez champ et valeur ou utilisez les propriétés.",
                           "es": "No he extraído una actualización explícita admitida. Indica campo y valor o usa las propiedades."}[request.language]
        result["system"]=result["process"] = result["commercial"] = None
        result["validation_error"] = str(error)[:600]
    return result


def ground_explicit_changes(patch, message):
    """Conservative extraction gate. The LLM may not introduce absent numbers/names.

    This is evidence of explicit mention, not a guarantee of correct field mapping.
    Human preview remains required; ambiguous volume periods are never inferred.
    """
    from decimal import Decimal, InvalidOperation
    if not isinstance(patch, dict):
        raise ValueError("Changes must be an object.")
    normalized = message.casefold()
    numbers = set()
    for token in re.findall(r'(?<![\w])\d+(?:[.,]\d+)*', message):
        candidates = [token, token.replace(',', ''), token.replace('.', '').replace(',', '.')]
        for value in candidates:
            try:
                numbers.add(Decimal(value))
            except InvalidOperation:
                pass
    for key, value in patch.items():
        if value is None:
            if not any(word in normalized for word in ('clear', 'remove', 'cancella', 'azzera', 'efface', 'supprim', 'borra', 'elimina')):
                raise ValueError('Clearing a field needs an explicit request.')
        elif isinstance(value, (int, float)) and not isinstance(value, bool) or key in ('unit_cost_target_eur', 'selling_price_eur', 'mould_budget_eur'):
            try:
                mentioned = Decimal(str(value)) in numbers
            except InvalidOperation:
                mentioned = False
            if not mentioned:
                raise ValueError('A proposed number was not explicitly provided.')
        elif isinstance(value, bool):
            enable = ('enable', 'attiva', 'abilita', 'active', 'activa')
            disable = ('disable', 'disattiva', 'disabilita', 'désactive', 'desactiva')
            if key != 'dryer_enabled' or not any(re.search(r'(?<!\w)' + re.escape(w) + r'(?!\w)', normalized) for w in (enable if value else disable)):
                raise ValueError('Changing an enable flag needs an explicit request.')
        elif isinstance(value, str) and value.casefold() not in normalized:
            # The commercial-unit enum may be translated by the model.
            unit_words = {'part': ('pezzi', 'pezzo', 'pièce', 'pieza'), 'kit': ('kit',), 'assembly': ('assieme', 'assiemi', 'ensemble', 'conjunto')}
            if key != 'commercial_unit' or not any(w in normalized for w in unit_words.get(value, ())):
                raise ValueError('A proposed name or category was not explicitly provided.')
        if key == 'annual_volume' and not re.search(r'annual|year|anno|annui|annuo|année|año', normalized):
            raise ValueError('Confirm annual versus total quantity before setting annual volume.')


SYSTEM_FIELDS={
    'cavities':('recipe','cavities'),'cycles':('recipe','cycles'),'cooling_s':('recipe','cooling_s'),
    'robot_pick_s':('recipe','robot_pick_s'),'robot_transfer_s':('recipe','robot_transfer_s'),'robot_return_s':('recipe','robot_return_s'),
    'eoat_slots':('robot','eoat_slots'),'reindex_s':('robot','reindex_s'),
    'capacity_parts':('conveyor','capacity_parts'),
    'parts_per_container':('packaging','parts_per_container'),'handling_s_per_part':('packaging','handling_s_per_part'),'container_change_s':('packaging','container_change_s')}

async def generate(request, project, disconnected, run=None):
    if not status()["ready"]:
        raise DomainError(503, "Server AI is not prepared. Run python scripts/setup_codespaces.py --with-ai.")
    if not SLOT.acquire(blocking=False):
        raise DomainError(429, "The CPU assistant is busy. Retry when its current request finishes.")
    process = None
    try:
        fields = {k: ({"enum": v["enum"]} if "enum" in v else {"type": v["type"]}) for k, v in ProcessScenario.model_json_schema()["properties"].items() if k not in ("name", "basis", "material")}
        if request.mode=='system':fields={k:{'type':'number','section':v[0]} for k,v in SYSTEM_FIELDS.items()}
        payload = {"history": [m.model_dump() for m in request.history], "mode": request.mode, "message": request.message, "language": request.language, "fields": fields,
                   "context": {"brief": project["commercial"], "part": {}, "geometry": {"asset": project["asset"]}, "process": project["process"],"production_system":{"scenario_names":[s["configuration"]["name"] for s in (project.get("production_system") or {}).get("scenarios",[])]},
                               "layout": {k: project["engineering"][k] for k in ('spec', 'checks', 'machine', 'material')} if project.get('engineering') else None,
                               "latest_run": {"summary": run["summary"], "stale": run["project_revision"] != project["revision"]} if run else None,
                               "capabilities": "Commercial and approved system L0 settings only. Central system includes packaging/backpressure; mould is a subsystem. No CAD, physics, CAE or forecasts."}}
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
