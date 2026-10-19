# Codespaces sign-in origin compatibility — 19 October 2026

The owner reached the hosted login page but received `Cross-origin writes are disabled`. The supplied browser HTTPS URL and the running process's `MOULD_PUBLIC_ORIGIN` matched exactly; `MOULD_RUNTIME` was `hosted`. No password/token was requested. This rules out a simple configured-address mismatch; the original exact-origin check rejects a rewritten or missing request Origin. No direct access to the owner's private Codespace is available.

Public upstream reports corroborate Codespaces forwarding matching Origin headers to loopback: [Symfony demo Codespaces tracking](https://github.com/symfony/demo/issues/1542), [Next.js forwarded-host/localhost-origin report](https://github.com/developersdigest/llm-answer-engine/issues/8). These are research evidence, not observation of this owner's actual request headers. No upstream code was copied.

## Change

The launcher sets `MOULD_CODESPACES_PROXY=1`. Settings fail closed unless hosted mode, the Codespace name and the exact `https://NAME-8000.app.github.dev` origin agree. In this explicit mode only, a matching loopback forwarding Origin requires both the exact forwarded hostname and browser `Sec-Fetch-Site: same-origin`. Arbitrary HTTP clients can forge headers but still require owner credentials/session/write token; browser cross-origin pages cannot set Sec-Fetch metadata. General hosting behaviour is unchanged. There is no wildcard origin acceptance or removal of CSRF/session checks.

Public auth status now identifies the configured HTTPS address. The UI offers that address instead of a login form on a mismatched page; remaining login-origin errors report only expected/received origins, never passwords or session secrets. The launcher prints the canonical address, supports read-only `--url`, and supports `--restart` guarded by exact PID command/directory checks. Restart preserves the existing private credential file and SQLite state.

## Executed checks

- **24 backend tests passed**, including rewritten-origin login and protected writes, exact-host/fetch-metadata requirements, rejection of sibling/foreign origins, missing/cross-site/same-site metadata, other ports and ordinary-hosting aliases. Correct credentials cannot bypass an invalid origin; sessions cannot bypass the write token.
- TypeScript/production build and the existing Chromium core workflow passed after the UI/auth-status change.
- The actual launcher, real HTTP login/CSRF, real CPU AI/process flow and safe `--restart` passed under a synthetic Codespaces environment with rewritten Origin/forwarded-host/fetch-metadata headers. Existing session, password, project and run survived restart; logout revoked access. The fixture's configured 10-part/126-second and 6-part/104-second results remain unchanged.
- A separate check confirmed the restart refuses to terminate an unrelated recorded PID. Canonical address generation was checked against a synthetic Codespace identity.
- The app's external behaviour in the owner's Codespace after update is **pending owner retry**, not claimed passed. If the forwarder omits or changes required metadata, the login remains blocked and its diagnostics must guide further investigation rather than widening origins blindly.

No dependencies, model pins, user passwords or databases changed. The existing native dependency/model review limitations remain unchanged. Main is not merged; the fix is published on the existing trial branch.
