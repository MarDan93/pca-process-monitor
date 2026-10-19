# Managed web application — single-owner pilot

**Earlier deployment option:** this guide records the Render preparation. The current requested trial is [GitHub Codespaces with process simulation and server CPU AI](CODESPACES.md). The Render image below keeps browser inference; it does not include the new optional Node server inference runtime/model cache. No Render service has been activated.

The user-facing product runs **only in a web browser**, with the current Python backend and server-persisted projects/assets/revisions. It is the current application, not a separate static demonstration or an installable desktop package. Local commands in developer guides remain engineering tools only.

## Proposed service

The repository includes a Render Blueprint at [`render.yaml`](../../render.yaml) and a digest-pinned multi-stage [`Dockerfile`](../../Dockerfile). It selects one **Starter web service**, Frankfurt, and a **1 GiB persistent disk** mounted at `/var/data`. The database and original mesh bytes are stored at `/var/data/projects.sqlite3`, separate from the replaceable image. One worker owns SQLite; horizontal scaling is not configured. AI remains the actual existing browser worker; weights are downloaded separately on explicit model load, not installed as an application or run by a paid API.

**Billing is not activated by these files or by publishing the source branch.** Starter and its persistent disk are chargeable Render resources. Review Render's current service/disk prices in the creation screen before confirming; no current price or free permanent server is promised. The free ephemeral-filesystem service is not used for persistent projects. No paid resource, billing account, personal account or cloud service has been created by the agent.

## Owner activation — browser only

Prepared source branch: `deploy/web-pilot` in `MarDan93/pca-process-monitor`.

1. Open [the prepared Render deployment](https://render.com/deploy?repo=https://github.com/MarDan93/pca-process-monitor&branch=deploy/web-pilot). Create/sign in to your own Render account; GitHub sign-in is available. Authorise access only to the intended repository if requested.
2. Confirm that the Blueprint uses **`deploy/web-pilot`**, one Starter web service, Frankfurt, and the **1 GiB persistent disk**. Review the displayed recurring charges and activate only if acceptable. No local Python, Node.js or Docker is required for the owner.
3. Render builds the image, mounts the disk and provides an **HTTPS `.onrender.com` address**. Open that actual service address when the deploy is healthy. The deployment button above is an activation link, not a running application address.
4. Sign in with username **`owner`**. Render generates `MOULD_ADMIN_PASSWORD` and `MOULD_AUTH_SECRET` as private environment values. Reveal the password in your own Render service's Environment panel; do not put it in chat, source code, URLs or build logs. You may replace the password with your own 16+ character secret there and redeploy. Keep the session secret private and stable.
5. Create a generic project, enter commercial requirements, approve a preview, import an OBJ/STL with explicit units, switch modules and reopen the project. Verify real persistence after a redeploy, then continue improving this same hosted application.

An account must be connected by the owner; GitHub repository authentication does not create or authorise a Render account. Until that external prerequisite and the provider's deployment checks pass, **there is no live application URL**. No invented URL is presented as a running service.

## Configuration

| Variable | Source / requirement |
| --- | --- |
| `MOULD_RUNTIME` | `hosted`; missing hosted credentials/origin/database cause startup failure |
| `MOULD_WORKSPACE_DB` | `/var/data/projects.sqlite3`; the mounted disk is required |
| `MOULD_ADMIN_USER` | `owner`; single-owner pilot, no public registration |
| `MOULD_ADMIN_PASSWORD` | Provider-generated secret; minimum 16 characters |
| `MOULD_AUTH_SECRET` | Provider-generated secret; minimum 32 characters |
| `RENDER_EXTERNAL_URL` | Render-provided HTTPS service origin, used automatically |
| `MOULD_PUBLIC_ORIGIN` | Optional exact HTTPS origin for an explicitly configured custom domain; no path |
| `PORT` | Provider-provided port; defaults to 8000 in the image |

The container initialiser adjusts the mounted directory's ownership and **drops to UID/GID 10001 before starting the application**. It only accepts a database under `/var/data`; application source/static assets remain root-owned. Static frontend files contain no owner password or session secret. The image excludes local databases, virtual environments, node_modules and model weights. Browser runtime notices remain included.

Hosted mode enforces exact Host/origin checks, server-side SQLite sessions, Secure/HttpOnly/SameSite cookies, session-derived write tokens, login rate/concurrency limits and protected project/asset/tool routes. Sessions survive image replacement on the same volume; logout, expiry and credential/secret rotation revoke access. Validation responses do not echo submitted passwords/project inputs. The local development mode remains loopback-only and cannot be enabled by request parameters.

The pilot has one owner and the existing bounded imports/operations, not production multi-user identity, a security certification or an independently verified recovery service. Configure operator backups/recovery before relying on private industrial records; a persistent disk is not a verified backup. Keep the original scientific/model/licence gates visible. Future app changes remain on the roadmap; hosting does not implement missing mould/process/robot engines.

## Developer verification (not required on the owner's computer)

```sh
PYTHONPATH=server .venv-app/bin/python -m unittest discover -s server/tests -v
cd web && npm run build && npm run test:browser
cd ..
python scripts/build_hosted.py
python scripts/test_hosted_container.py
```

The source image build preserves package hashes, pinned base image digests and TLS verification. The optional cloud build helper passes the existing egress proxy, maps only its configured hostname through the environment's own DNS, and mounts the environment's public CA as a temporary BuildKit secret when needed. It does not copy trust/private files into the runtime image or disable certificate checks. See [verification evidence](../verification/HOSTED_2026-10-17.md).
