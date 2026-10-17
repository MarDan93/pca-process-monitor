"""Fail-closed settings for a single-owner hosted application."""
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit


@dataclass(frozen=True)
class Settings:
    mode: str = "local-development"
    public_origin: str = ""
    username: str = "owner"
    password: str = field(default="", repr=False)
    auth_secret: str = field(default="", repr=False)
    database: str = ""
    session_seconds: int = 43200

    @property
    def hosted(self):
        return self.mode == "hosted"

    def validate(self):
        if self.mode not in ("local-development", "hosted"):
            raise ValueError("MOULD_RUNTIME must be local-development or hosted.")
        if self.hosted:
            origin = urlsplit(self.public_origin)
            if origin.scheme != "https" or not origin.hostname or origin.username or origin.password or origin.path or origin.query or origin.fragment:
                raise ValueError("Hosted mode requires an HTTPS public origin without a path.")
            if not re.fullmatch(r"[A-Za-z0-9._-]{1,64}", self.username):
                raise ValueError("Use a valid owner username.")
            if not 16 <= len(self.password) <= 512 or len(self.auth_secret) < 32:
                raise ValueError("Hosted mode requires an owner password of 16+ characters and a session secret of 32+ characters.")
            if not self.database or not Path(self.database).is_absolute():
                raise ValueError("Hosted mode requires an absolute database path on a persistent volume.")
        return self

    @classmethod
    def from_environment(cls):
        return cls(mode=os.environ.get("MOULD_RUNTIME", "local-development"),
                   public_origin=os.environ.get("MOULD_PUBLIC_ORIGIN", os.environ.get("RENDER_EXTERNAL_URL", "")).rstrip("/"),
                   username=os.environ.get("MOULD_ADMIN_USER", "owner"),
                   password=os.environ.get("MOULD_ADMIN_PASSWORD", ""),
                   auth_secret=os.environ.get("MOULD_AUTH_SECRET", ""),
                   database=os.environ.get("MOULD_WORKSPACE_DB", "")).validate()
