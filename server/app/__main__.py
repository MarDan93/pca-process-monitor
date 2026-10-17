"""Cloud process entry point; one worker owns the SQLite-backed pilot."""
import os
import uvicorn
from .settings import Settings

settings = Settings.from_environment()
uvicorn.run("app.main:app", host="0.0.0.0" if settings.hosted else "127.0.0.1", port=int(os.environ.get("PORT", "8000")), workers=1, proxy_headers=False)
