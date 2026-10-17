"""SQLite transactions, immutable snapshots and approval-bound operations."""
import base64
import hashlib
import json
import secrets
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4

from .schemas import CommercialPatch


class DomainError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message


def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)


def digest(value):
    return hashlib.sha256(encoded(value).encode()).hexdigest()


class Store:
    def __init__(self, path, principal="local-developer", clock=time.time):
        self.path, self.principal, self.clock = Path(path), principal, clock
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connection() as db:
            db.executescript("""
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY);
            INSERT OR IGNORE INTO schema_version VALUES(1);
            CREATE TABLE IF NOT EXISTS projects(
                id TEXT PRIMARY KEY, owner TEXT NOT NULL, revision INTEGER NOT NULL,
                state TEXT NOT NULL, created REAL NOT NULL, updated REAL NOT NULL);
            CREATE TABLE IF NOT EXISTS revisions(
                project_id TEXT NOT NULL, revision INTEGER NOT NULL,
                state TEXT NOT NULL, source TEXT NOT NULL, created REAL NOT NULL,
                PRIMARY KEY(project_id, revision));
            CREATE TABLE IF NOT EXISTS operations(
                id TEXT PRIMARY KEY, project_id TEXT NOT NULL, principal TEXT NOT NULL,
                base_revision INTEGER NOT NULL, effects TEXT NOT NULL, source TEXT NOT NULL,
                digest TEXT NOT NULL, expires REAL NOT NULL, token_hash TEXT,
                status TEXT NOT NULL, result TEXT, idempotency TEXT, undo_key TEXT, undo_result TEXT);
            CREATE TABLE IF NOT EXISTS assets(
                id TEXT PRIMARY KEY, project_id TEXT NOT NULL, manifest TEXT NOT NULL, content BLOB NOT NULL);
            """)

    @contextmanager
    def connection(self, write=False):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            db.execute("PRAGMA foreign_keys=ON")
            db.execute("BEGIN IMMEDIATE" if write else "BEGIN")
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def _project(self, db, project_id):
        row = db.execute("SELECT * FROM projects WHERE id=? AND owner=?", (project_id, self.principal)).fetchone()
        if row is None:
            raise DomainError(404, "Project not found.")
        return {"id": row["id"], "revision": row["revision"], **json.loads(row["state"]), "updated_at": row["updated"]}

    def get(self, project_id):
        with self.connection() as db:
            return self._project(db, project_id)

    def list(self):
        with self.connection() as db:
            return [{"id": row["id"], "revision": row["revision"], "name": json.loads(row["state"])["name"]}
                    for row in db.execute("SELECT * FROM projects WHERE owner=? ORDER BY updated DESC", (self.principal,))]

    def create(self, name):
        with self.connection(True) as db:
            if db.execute("SELECT count(*) FROM projects").fetchone()[0] >= 200:
                raise DomainError(409, "Local workspace project limit reached (200).")
            project_id, now = str(uuid4()), self.clock()
            state = {"name": name, "commercial": CommercialPatch().model_dump(), "asset": None}
            db.execute("INSERT INTO projects VALUES(?,?,?,?,?,?)", (project_id, self.principal, 0, encoded(state), now, now))
            db.execute("INSERT INTO revisions VALUES(?,?,?,?,?)", (project_id, 0, encoded(state), encoded({"kind": "create"}), now))
            return self._project(db, project_id)

    def _advance(self, db, project, state, source):
        revision, now = project["revision"] + 1, self.clock()
        db.execute("UPDATE projects SET revision=?, state=?, updated=? WHERE id=?", (revision, encoded(state), now, project["id"]))
        db.execute("INSERT INTO revisions VALUES(?,?,?,?,?)", (project["id"], revision, encoded(state), encoded(source), now))
        return self._project(db, project["id"])

    @staticmethod
    def _current(project, revision):
        if project["revision"] != revision:
            raise DomainError(409, "The project changed. Create a new preview from the latest revision.")

    def preview(self, project_id, request):
        with self.connection(True) as db:
            project = self._project(db, project_id)
            self._current(project, request.base_revision)
            patch = request.changes.model_dump(exclude_unset=True, mode="json")
            money_keys = ("unit_cost_target", "selling_price", "mould_budget")
            commercial = project["commercial"]
            if "currency" in patch and patch["currency"] != commercial["currency"]:
                if any(commercial[k] is not None for k in money_keys) and not all(k in patch for k in money_keys):
                    raise DomainError(422, "Changing currency requires explicitly restating or clearing all amounts. No automatic conversion is performed.")
            merged = commercial | patch
            if any(merged[k] is not None for k in money_keys) and merged["currency"] is None:
                raise DomainError(422, "Choose a currency for monetary values.")
            effects = [{"field": key, "before": commercial[key], "after": value} for key, value in patch.items() if value != commercial[key]]
            if not effects:
                raise DomainError(422, "No changed commercial fields to preview.")
            if db.execute("SELECT count(*) FROM operations WHERE project_id=?", (project_id,)).fetchone()[0] >= 5000:
                raise DomainError(409, "Local operation limit reached (5,000 per project).")
            operation_id, expires = str(uuid4()), self.clock() + 600
            source = request.source.model_dump()
            effect_digest = digest({"project_id": project_id, "principal": self.principal, "base_revision": project["revision"], "effects": effects, "source": source})
            db.execute("INSERT INTO operations(id,project_id,principal,base_revision,effects,source,digest,expires,status) VALUES(?,?,?,?,?,?,?,?,?)",
                       (operation_id, project_id, self.principal, project["revision"], encoded(effects), encoded(source), effect_digest, expires, "preview"))
            return {"id": operation_id, "project_id": project_id, "base_revision": project["revision"], "effects": effects, "source": source, "digest": effect_digest, "expires_at": expires, "status": "preview"}

    def _operation(self, db, project_id, operation_id, supplied_digest=None, check_expiry=True):
        project = self._project(db, project_id)
        op = db.execute("SELECT * FROM operations WHERE id=? AND project_id=? AND principal=?", (operation_id, project_id, self.principal)).fetchone()
        if op is None:
            raise DomainError(404, "Operation not found.")
        if supplied_digest is not None and not secrets.compare_digest(op["digest"], supplied_digest):
            raise DomainError(409, "The approved effects do not match this preview.")
        if check_expiry and self.clock() >= op["expires"]:
            raise DomainError(409, "This approval expired. Create a new preview.")
        return project, op

    def approve(self, project_id, operation_id, effect_digest):
        with self.connection(True) as db:
            project, op = self._operation(db, project_id, operation_id, effect_digest)
            self._current(project, op["base_revision"])
            if op["status"] != "preview":
                raise DomainError(409, "This preview has already been approved or consumed.")
            token = secrets.token_urlsafe(32)
            db.execute("UPDATE operations SET status='approved', token_hash=? WHERE id=?", (hashlib.sha256(token.encode()).hexdigest(), operation_id))
            return {"approval_token": token, "digest": op["digest"]}

    def execute(self, project_id, operation_id, request):
        with self.connection(True) as db:
            project, op = self._operation(db, project_id, operation_id, request.digest, check_expiry=False)
            token_hash = hashlib.sha256(request.approval_token.encode()).hexdigest()
            if not op["token_hash"] or not secrets.compare_digest(token_hash, op["token_hash"]):
                raise DomainError(403, "Approval token does not match this operation.")
            if op["status"] == "executed" and op["idempotency"] == request.idempotency_key:
                return json.loads(op["result"])
            if op["status"] != "approved" or self.clock() >= op["expires"]:
                raise DomainError(409, "Approval is expired or has been consumed.")
            self._current(project, op["base_revision"])
            state = {k: project[k] for k in ("name", "commercial", "asset")}
            state["commercial"] = state["commercial"] | {e["field"]: e["after"] for e in json.loads(op["effects"])}
            result = self._advance(db, project, state, {**json.loads(op["source"]), "operation_id": operation_id, "tool": "update_commercial_requirements"})
            db.execute("UPDATE operations SET status='executed', idempotency=?, result=? WHERE id=?", (request.idempotency_key, encoded(result), operation_id))
            return result

    def undo(self, project_id, operation_id, request):
        with self.connection(True) as db:
            project, op = self._operation(db, project_id, operation_id, check_expiry=False)
            if op["undo_key"] == request.idempotency_key and op["undo_result"]:
                return json.loads(op["undo_result"])
            if op["status"] != "executed":
                raise DomainError(409, "This operation cannot be undone.")
            self._current(project, request.base_revision)
            if project["revision"] != json.loads(op["result"])["revision"]:
                raise DomainError(409, "A later edit exists. Undo cannot overwrite intervening changes.")
            state = {k: project[k] for k in ("name", "commercial", "asset")}
            state["commercial"] = state["commercial"] | {e["field"]: e["before"] for e in json.loads(op["effects"])}
            result = self._advance(db, project, state, {"kind": "undo", "operation_id": operation_id})
            db.execute("UPDATE operations SET status='undone', undo_key=?, undo_result=? WHERE id=?", (request.idempotency_key, encoded(result), operation_id))
            return result

    def history(self, project_id):
        with self.connection() as db:
            self._project(db, project_id)
            return [{"revision": row["revision"], "source": json.loads(row["source"]), "created_at": row["created"]} for row in db.execute("SELECT * FROM revisions WHERE project_id=? ORDER BY revision DESC LIMIT 100", (project_id,))]

    def add_asset(self, project_id, request):
        extension = request.name.rsplit(".", 1)[-1].lower()
        if extension not in ("obj", "stl"):
            raise DomainError(422, "Only OBJ and STL meshes are supported. STEP needs the future CAD kernel.")
        try:
            content = base64.b64decode(request.content_base64, validate=True)
        except ValueError as error:
            raise DomainError(422, "Invalid mesh encoding.") from error
        if not content or len(content) > 12 * 1024 * 1024:
            raise DomainError(413, "Mesh size must be between 1 byte and 12 MiB.")
        with self.connection(True) as db:
            project = self._project(db, project_id)
            self._current(project, request.base_revision)
            count, size = db.execute("SELECT count(*),coalesce(sum(length(content)),0) FROM assets WHERE project_id=?", (project_id,)).fetchone()
            if count >= 20 or size + len(content) > 96 * 1024 * 1024:
                raise DomainError(409, "Local asset limit reached (20 files / 96 MiB per project).")
            asset_id = str(uuid4())
            manifest = {"id": asset_id, "name": request.name, "source_units": request.units, "sha256": hashlib.sha256(content).hexdigest(), "size_bytes": len(content), "kind": "mesh", "source": request.source, "frame": "Original source coordinates retained; display recentred only"}
            db.execute("INSERT INTO assets VALUES(?,?,?,?)", (asset_id, project_id, encoded(manifest), content))
            state = {k: project[k] for k in ("name", "commercial", "asset")} | {"asset": manifest}
            return self._advance(db, project, state, {"kind": "asset_import", "asset_id": asset_id, "source": request.source})

    def asset(self, project_id, asset_id):
        with self.connection() as db:
            self._project(db, project_id)
            row = db.execute("SELECT * FROM assets WHERE project_id=? AND id=?", (project_id, asset_id)).fetchone()
            if row is None:
                raise DomainError(404, "Asset not found.")
            return bytes(row["content"])
