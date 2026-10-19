# Try the application in GitHub Codespaces

Current trial branch: **`trial/codespaces-process`**. No local installation is required. This is the current server-backed workspace plus a first configured process engine, not the full future engineering platform.

## Open and sign in

1. Open [Create a Codespace for this trial](https://github.com/codespaces/new?repo=1262022691&ref=trial%2Fcodespaces-process). Sign in to your own GitHub account. Verify the branch is `trial/codespaces-process` and choose the smallest two-core machine. Review your remaining Codespaces compute/storage allowance and spending settings; the app cannot guarantee free usage beyond GitHub's quotas.
2. Create the Codespace. Its dev container installs Python/Node, locked application dependencies, builds the frontend and downloads/verifies the approximately **786 MB** pinned CPU model. First preparation takes longer than later starts. Watch **View → Output → Dev Containers** if preparation is still running.
3. The app starts automatically and the trial guide opens in the editor. Open **Ports → 8000 → Open in Browser**. GitHub defaults forwarded ports to **Private**; verify and keep that visibility. This forwarded HTTPS address is the application; the creation link above is not a running service.
4. In the Codespaces Explorer, open `.cache/codespaces/owner-credentials.json`. Copy only the `password` value and sign in to the app as **`owner`**. These private generated credentials remain in the Codespace and survive app restarts. Do not commit, share or paste them into an issue/chat. The application uses its own protected server session in addition to GitHub's private forwarded port.

If an automatic step failed, run these commands in the Codespaces terminal:

```sh
python scripts/setup_codespaces.py --with-ai
python scripts/start_codespaces.py
```

The startup log is `.cache/codespaces/workspace.log`. Node 24 and Python 3.12 are provisioned by `.devcontainer/devcontainer.json`. Setup/start commands were exercised in this development environment, and the actual launcher was tested under synthetic Codespaces variables. GitHub's external provisioning/forwarding is **not yet verified**: the current integration receives HTTP 403 for the Codespaces API. The owner must create the Codespace from their account.

## Updating an existing Codespace after a sign-in origin error

Run these commands one at a time from the repository root in the Codespaces terminal. Stop if a command reports an error; do not discard local source changes to force an update.

```sh
git pull --ff-only
npm --prefix web run build
python scripts/start_codespaces.py --restart
```

The restart preserves generated credentials and the project database. It stops only the recorded PID after checking its exact command and checkout directory; unrelated processes are left untouched. Open the HTTPS address printed by the launcher and reload the app. `python scripts/start_codespaces.py --url` prints that address without reading or printing credentials. Login remains `owner` with the same private password.

Codespaces can rewrite the browser's `Origin` header to its loopback forwarding target. The launcher now enables an explicit Codespaces-only compatibility path, bound to the exact current forwarded HTTPS hostname. A rewritten loopback origin is accepted only with both that exact `X-Forwarded-Host` and the browser's `Sec-Fetch-Site: same-origin`. Ordinary hosted deployments retain their existing exact-origin policy. Foreign/sibling origins, other ports, cross-site/same-site or missing fetch metadata, missing forwarded host, CSRF-token failures and unauthenticated private API requests remain rejected. There is no wildcard Codespaces allowlist or general CORS bypass.

The login page detects a different configured address and provides a link to the secure workspace. A remaining login mismatch reports expected/received origins without exposing credentials, so proxy differences can be diagnosed precisely. See [fix evidence](../verification/CODESPACES_ORIGIN_FIX_2026-10-19.md).

## First observable process run

1. Choose **New project**, enter any product/project name, and create it. Commercial and product values start unknown.
2. Optionally import an OBJ/STL with explicit units or choose **Reference flange**. The reference is an original synthetic visual fixture. Geometry is not used to infer shot mass or physical mouldability.
3. Choose **Process** on the left. In Properties choose **Load synthetic example**, then **Preview changes → Approve and apply**. The example uses arbitrary demonstration times; its 20-second drying stage is not a material qualification recommendation.
4. Choose **Run process**. The illustrative cell, timeline and material inventory now sample one stored L0 run. Use **Play**, pause, **Next event**, the time slider and playback speed. Select timeline bars to inspect their timestamps.
5. The initial configured example produces **10 parts in 126 seconds**, with two cavities over five cycles. The first deposit is at 46 seconds. At 58 seconds the first two parts have exited the belt. Runner mass is accounted for separately.
6. In the right copilot choose **Process** and use **Try: cooling 12 s, three cycles**, then send. The actual pinned model runs on the Codespace CPU, with no model download/inference on your PC. Inspect **Preview changes**, approve, then choose **Run process** again. The old result is marked outdated until recalculation. The tested proposal produces **6 parts in 104 seconds**.
7. Change **Required orientation at belt** to 180° while the mould remains at 0°, approve and run: the scenario is blocked because the configured XYZ robot has no rotary axis. Reset to the supported matching orientation to continue.
8. Reduce available granules, or increase robot-return time/decrease belt speed, to observe starvation or resource waiting. Save/reopen is automatic; the latest run can be downloaded as JSON. There are bounded trial limits: 100 cycles, 8 cavities, 30 saved runs per project.

The examples above are a repeatable software check, not experimental process validation. The model is small and can return invalid or inaccurate proposals. Invalid fields/types are rejected; accepted suggestions still require technical review and explicit approval. You can configure and run the process without AI.

## What this increment computes

- Optional batch drying, shot feeding with delay/rate and hopper capacity, configured plasticising/injection/holding/cooling and press movements.
- Next-shot screw recovery overlapping cooling; press/robot sharing, robot return, belt batch spacing and waiting.
- Discrete material balances across raw/conditioned/hopper/melt/mould/robot/belt/output/runner compartments. No negative supplied inventory or shot without configured available mass.
- Cavity/part IDs, configured unchanged yaw orientation, linear XYZ transfer and belt travel, shared-clock animation/seek, run duration, injection intervals and configured output rate.
- Immutable input/run snapshots, asset references, input hash, source/revision, outdated-result indication and latest-result restoration after app restart.

The cell envelopes and paths are illustrative. Actual strokes, mould/robot collisions, acceleration, clamp/shot compatibility, undercuts, mould construction and cooling circuits are not checked. The displayed mesh uses original declared millimetre dimensions but is recentered for illustration; cell envelopes are not fitted or validated against it. No moisture, melt temperature, pressure/flow field, shrinkage, quality or production-cost solution is computed. There is no STEP/photo-to-tooling implementation or integrated PCA/PLS in this increment.

## Persistence, limits and stopping

Projects, assets and runs use `.cache/workspace/projects.sqlite3` in the Codespace's persistent workspace. They survive app stop/start and were checked across service replacement. Deleting the Codespace deletes its local data; Git does not back up ignored databases or credentials. A persistent workspace is not a tested independent backup service. Download important run JSON; backup/restore of complete projects remains separate work.

Stop the Codespace from GitHub when finished. Stopping the app or closing the browser tab alone does not stop Codespaces compute billing, and retained storage still counts. Keep within both GitHub compute and storage allowances if a zero-cost trial is required. No GPU or external paid AI API is requested. Heavy later solvers need separate sizing and approval of any paid resources.

## Developer checks

```sh
PYTHONPATH=server .venv-app/bin/python -m unittest discover -s server/tests -v
cd web
npm run build
npm run test:browser -- --process
npm run test:browser -- --server-ai
cd ..
.venv-app/bin/python scripts/test_codespaces.py
```

The last command owns temporary credentials/database and launched processes on port 8000, exercises the real startup/authenticated AI/process/restart path, and cleans them up. It fails without stopping unrelated services when port 8000 is already occupied. It does not create a GitHub resource or establish external forwarding readiness. [Verification record](../verification/PROCESS_CODESPACES_2026-10-19.md).
