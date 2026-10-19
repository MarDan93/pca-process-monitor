"""Developer runtime and an explicit, protected single-owner hosted mode."""
import os
import secrets
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .auth import Authentication, COOKIE
from .schemas import ApprovalRequest, AssetRequest, ExecuteRequest, LoginRequest, NewProject, PreviewRequest, UndoRequest
from .settings import Settings
from .store import DomainError, Store
from .process import ProcessPreviewRequest, RunRequest, example
from . import assistant

ROOT = Path(__file__).resolve().parents[2]


class BodyLimit:
    """Bound streamed bodies, including requests without Content-Length."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        limit = 18 * 1024 * 1024 if scope["path"].endswith("/assets") else 32768
        total = 0
        messages = []
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            total += len(message.get("body", b""))
            if total > limit:
                return await JSONResponse({"detail": "Request body exceeds the endpoint limit."}, 413)(scope, receive, send)
            messages.append(message)
            if not message.get("more_body", False):
                break
        async def bounded_receive():
            return messages.pop(0) if messages else await receive()
        await self.app(scope, bounded_receive, send)


def create_app(database=None, principal="local-developer", testing=False, settings=None):
    settings = (settings or Settings()).validate()
    principal = "owner:" + settings.username if settings.hosted else principal
    app = FastAPI(title="Mould Studio workspace", version="0.2.0", docs_url=None, redoc_url=None, openapi_url=None)
    app.state.store = Store(database or settings.database or ROOT / ".cache/workspace/projects.sqlite3", principal)
    auth = Authentication(app.state.store, settings) if settings.hosted else None
    app.state.auth, app.state.settings = auth, settings
    app.state.csrf = secrets.token_urlsafe(32)
    app.add_middleware(BodyLimit)
    from urllib.parse import urlsplit
    hosts = ["localhost", "127.0.0.1", "[::1]"] + (["testserver"] if testing else [])
    if settings.hosted:
        hosts.append(urlsplit(settings.public_origin).hostname)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=hosts)

    @app.middleware("http")
    async def access_boundary(request: Request, call_next):
        peer = request.client.host if request.client else ""
        if not settings.hosted and peer not in ({"127.0.0.1", "::1"} | ({"testclient"} if testing else set())):
            return JSONResponse({"detail": "This build accepts loopback clients only."}, 403)
        raw_cookie = request.cookies.get(COOKIE, "")
        if settings.hosted and request.url.path.startswith("/api/"):
            public = request.url.path in ("/api/health", "/api/auth/status", "/api/auth/login")
            if not public and auth.principal(raw_cookie) != principal:
                return JSONResponse({"detail": "Sign in to open your workspace."}, 401, headers={"Cache-Control": "no-store"})
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            origin = request.headers.get("origin")
            expected_origin = settings.public_origin if settings.hosted else f"{request.url.scheme}://{request.url.netloc}"
            allowed = settings.accepts_origin(origin, request.headers) if settings.hosted else not origin or origin == expected_origin
            if not allowed:
                if settings.hosted and request.url.path == "/api/auth/login":
                    return JSONResponse({"detail": "The sign-in request address differs from the configured workspace address.", "code": "workspace_origin_mismatch", "public_origin": settings.public_origin, "received_origin": origin}, 403)
                return JSONResponse({"detail": "Cross-origin writes are disabled."}, 403)
            token = request.headers.get("x-workspace-token", "")
            expected_token = auth.csrf(raw_cookie) if settings.hosted else app.state.csrf
            login = settings.hosted and request.url.path == "/api/auth/login"
            if not login and not secrets.compare_digest(token, expected_token):
                return JSONResponse({"detail": "Refresh the workspace session before writing."}, 403)
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Content-Security-Policy"] = "frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
        if settings.hosted:
            response.headers["Strict-Transport-Security"] = "max-age=31536000"
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.exception_handler(DomainError)
    async def domain_error(_request, error):
        return JSONResponse({"detail": error.message}, error.status)

    store = app.state.store

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, error):
        if request.url.path == "/api/auth/login":
            return JSONResponse({"detail": "Invalid sign-in request."}, 422)
        # Do not echo submitted project data or passwords in validation responses.
        return JSONResponse({"detail": [{"loc": list(e["loc"]), "msg": e["msg"]} for e in error.errors()]}, 422)

    @app.get("/api/auth/status")
    def auth_status(request: Request):
        return {"required": settings.hosted, "authenticated": not settings.hosted or auth.principal(request.cookies.get(COOKIE, "")) == principal, "public_origin": settings.public_origin if settings.hosted else None}

    @app.post("/api/auth/login")
    def login(request: Request, body: LoginRequest):
        if not settings.hosted:
            raise DomainError(404, "Sign-in is only available in hosted mode.")
        token = auth.login(body.username, body.password.get_secret_value(), request.client.host if request.client else "unknown")
        response = JSONResponse({"authenticated": True})
        response.set_cookie(COOKIE, token, max_age=settings.session_seconds, secure=True, httponly=True, samesite="strict", path="/")
        return response

    @app.post("/api/auth/logout")
    def logout(request: Request):
        if settings.hosted:
            auth.logout(request.cookies.get(COOKIE, ""))
        response = JSONResponse({"authenticated": False})
        response.delete_cookie(COOKIE, secure=True, httponly=True, samesite="strict", path="/")
        return response

    @app.get("/api/session")
    def session(request: Request):
        return {"mode": settings.mode, "principal": principal, "write_token": auth.csrf(request.cookies.get(COOKIE, "")) if settings.hosted else app.state.csrf, "ai_assets_local": not settings.hosted and (ROOT / ".cache/ai/static/ai-assets").is_dir()}

    @app.get("/api/health")
    def health():
        return {"status": "ok", "mode": settings.mode, "storage": "sqlite", "schema": 1, "codespaces_proxy": settings.codespaces_proxy}

    @app.get("/api/process/example")
    def process_example():
        return example().model_dump()

    @app.post("/api/projects/{project_id}/process/preview")
    def preview_process(project_id: str, request: ProcessPreviewRequest):
        return store.preview_process(project_id, request)

    @app.post("/api/projects/{project_id}/process/runs")
    def run_process(project_id: str, request: RunRequest):
        return store.run_process(project_id, request.base_revision)

    @app.get("/api/projects/{project_id}/process/latest")
    def latest_run(project_id: str):
        return store.latest_run(project_id)

    @app.get("/api/assistant/status")
    def assistant_status():
        return assistant.status()

    @app.post("/api/projects/{project_id}/assistant")
    async def generate_assistant(project_id: str, body: assistant.AssistantRequest, request: Request):
        project = store.get(project_id)
        store._current(project, body.base_revision)
        result = await assistant.generate(body, project, request.is_disconnected, store.latest_run(project_id))
        store._current(store.get(project_id), body.base_revision)
        return result

    @app.get("/api/projects")
    def projects():
        return store.list()

    @app.post("/api/projects", status_code=201)
    def create_project(request: NewProject):
        return store.create(request.name)

    @app.get("/api/projects/{project_id}")
    def get_project(project_id: str):
        return store.get(project_id)

    @app.get("/api/projects/{project_id}/revisions")
    def revisions(project_id: str):
        return store.history(project_id)

    @app.post("/api/projects/{project_id}/operations/preview")
    def preview(project_id: str, request: PreviewRequest):
        return store.preview(project_id, request)

    @app.post("/api/projects/{project_id}/operations/{operation_id}/approve")
    def approve(project_id: str, operation_id: str, request: ApprovalRequest):
        return store.approve(project_id, operation_id, request.digest)

    @app.post("/api/projects/{project_id}/operations/{operation_id}/execute")
    def execute(project_id: str, operation_id: str, request: ExecuteRequest):
        return store.execute(project_id, operation_id, request)

    @app.post("/api/projects/{project_id}/operations/{operation_id}/undo")
    def undo(project_id: str, operation_id: str, request: UndoRequest):
        return store.undo(project_id, operation_id, request)

    @app.post("/api/projects/{project_id}/assets", status_code=201)
    def add_asset(project_id: str, request: AssetRequest):
        return store.add_asset(project_id, request)

    @app.get("/api/projects/{project_id}/assets/{asset_id}")
    def asset(project_id: str, asset_id: str):
        return Response(store.asset(project_id, asset_id), media_type="application/octet-stream", headers={"Content-Disposition": "attachment"})

    for route, folder in (("/ai-assets", ".cache/ai/static/ai-assets"), ("/ai-runtime", ".cache/ai/static/ai-runtime")):
        if not settings.hosted and (ROOT / folder).is_dir():
            app.mount(route, StaticFiles(directory=ROOT / folder))
    if (ROOT / "web/dist").is_dir():
        app.mount("/", StaticFiles(directory=ROOT / "web/dist", html=True))
    return app


app = create_app(settings=Settings.from_environment())
