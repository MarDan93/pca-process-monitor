"""Single-owner, server-side sessions for a protected web pilot."""
import hashlib
import hmac
import secrets
import threading
import time
from collections import deque

from .store import DomainError

COOKIE = "__Host-mould-session"


class Authentication:
    def __init__(self, store, settings, clock=time.time):
        self.store, self.settings, self.clock = store, settings, clock
        self.salt = secrets.token_bytes(16)
        self.password_hash = self._hash(settings.password)
        self.lock = threading.Lock()
        self.hash_slots = threading.Semaphore(2)
        self.attempts = {}
        self.global_attempts = deque()
        fingerprint = hmac.new(settings.auth_secret.encode(), (settings.username + ":" + settings.password).encode(), hashlib.sha256).hexdigest()
        with store.connection(True) as db:
            db.executescript("""
            CREATE TABLE IF NOT EXISTS auth_config(id INTEGER PRIMARY KEY CHECK(id=1), fingerprint TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS auth_sessions(token_hash TEXT PRIMARY KEY, principal TEXT NOT NULL, expires REAL NOT NULL);
            """)
            previous = db.execute("SELECT fingerprint FROM auth_config WHERE id=1").fetchone()
            if previous is None or not secrets.compare_digest(previous[0], fingerprint):
                db.execute("DELETE FROM auth_sessions")
                db.execute("INSERT OR REPLACE INTO auth_config VALUES(1,?)", (fingerprint,))
            db.execute("DELETE FROM auth_sessions WHERE expires<=?", (clock(),))

    def _hash(self, value):
        return hashlib.scrypt(value.encode(), salt=self.salt, n=16384, r=8, p=1)

    @staticmethod
    def _token_hash(token):
        return hashlib.sha256(token.encode()).hexdigest()

    def _rate_limit(self, client):
        now = self.clock()
        with self.lock:
            self.attempts = {key: [t for t in values if t > now - 900] for key, values in self.attempts.items() if any(t > now - 900 for t in values)}
            while self.global_attempts and self.global_attempts[0] <= now - 60:
                self.global_attempts.popleft()
            key = self._token_hash(client)
            recent = self.attempts.get(key, [])
            if len(recent) >= 5 or len(self.global_attempts) >= 30 or (key not in self.attempts and len(self.attempts) >= 128):
                raise DomainError(429, "Too many sign-in attempts. Please wait before trying again.")
            self.attempts[key] = recent + [now]
            self.global_attempts.append(now)

    def login(self, username, password, client):
        self._rate_limit(client)
        if not self.hash_slots.acquire(blocking=False):
            raise DomainError(429, "Sign-in is busy. Please retry shortly.")
        try:
            password_valid = secrets.compare_digest(self._hash(password), self.password_hash)
            username_valid = secrets.compare_digest(username.encode(), self.settings.username.encode())
        finally:
            self.hash_slots.release()
        if not (password_valid and username_valid):
            raise DomainError(401, "Invalid username or password.")
        with self.lock:
            self.attempts.pop(self._token_hash(client), None)
        token = secrets.token_urlsafe(32)
        with self.store.connection(True) as db:
            db.execute("DELETE FROM auth_sessions WHERE expires<=?", (self.clock(),))
            if db.execute("SELECT count(*) FROM auth_sessions").fetchone()[0] >= 50:
                raise DomainError(429, "Too many active sessions. Sign out of another browser first.")
            db.execute("INSERT INTO auth_sessions VALUES(?,?,?)", (self._token_hash(token), self.store.principal, self.clock() + self.settings.session_seconds))
        return token

    def principal(self, token):
        if not token or len(token) > 200:
            return None
        with self.store.connection() as db:
            row = db.execute("SELECT principal FROM auth_sessions WHERE token_hash=? AND expires>?", (self._token_hash(token), self.clock())).fetchone()
        return row[0] if row else None

    def csrf(self, token):
        return hmac.new(self.settings.auth_secret.encode(), ("csrf:" + token).encode(), hashlib.sha256).hexdigest()

    def logout(self, token):
        with self.store.connection(True) as db:
            db.execute("DELETE FROM auth_sessions WHERE token_hash=?", (self._token_hash(token),))
