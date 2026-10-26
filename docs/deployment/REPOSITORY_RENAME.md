# Prepared rename: pca-process-monitor → fabrivra

**Prepared, not executed**, following the owner's current instruction. Do not create a replacement repository, copy commits by reinitialising Git, delete branches, force-push or merge `main` as part of a rename.

## Verified before implementation, 26 October 2026

- Source: `MarDan93/pca-process-monitor`, GitHub repository ID **1262022691**, default branch `main`, public source repository, authenticated owner has admin rights.
- `GET /repos/MarDan93/fabrivra` returned **404** using working owner authentication. This is point-in-time availability evidence, not a reservation or guarantee.
- Published `trial/codespaces-process` base: **dd1f5b883acd4e00a1e2eb8b48b9c809242d9fbd**. `main` remains **7a945ffaf6fd1ccce9ca5f9ca32432821c3f9b9a**; demo and deploy branches remain retained.
- All pre-V2 local dirty/untracked source was preserved in local `archive/pre-v2-experiment-2026-10-26` at **0c2c00c45046f1d65919bb02197e67009308e029**, a retained stash and a verified full Git bundle outside the checkout. That unpublished experiment is not merged or automatically published. Private SQLite online backup, integrity check and restore/asset hash checks were performed; the supplied runner database had no customer projects. This says nothing about data in an inaccessible external Codespace.
- Preservation location on this runner: `/workspace/fabrivra-preservation/2026-10-26/` (private permissions). Do not add database, credentials, stash source or the preservation bundle to a public repository.

## Concrete future execution checklist

1. Review this V2 trial and all local/remote branch refs. Fetch safely, save `git show-ref`, create/verify a private `git bundle create … --all`, run `python scripts/backup_workspace.py`, export essential projects and securely retain the existing credentials. Git does not contain the private SQLite database.
2. Verify target name availability and repository admin rights again. Record source repository ID, branch SHAs, issues/PR counts, releases, settings/integrations and current Codespaces origins before the change. Official rename documentation was egress-blocked during this task; retrieve current guidance before execution.
3. Rename **the existing repository** in GitHub Settings → General → Repository name. A future explicit execution command is shown below for review; it has **not** been run:

   ```sh
   gh repo rename fabrivra --repo MarDan93/pca-process-monitor
   ```

4. Check the repository ID is still **1262022691**, every recorded branch/tag SHA remains present, issues/PRs/releases remain, and `main` was not merged. Update fetch URLs in each checkout (not their data directories), for example:

   ```sh
   git remote set-url origin https://github.com/MarDan93/fabrivra.git
   git ls-remote --heads --tags origin
   ```

5. Update README/trial links, CI badges, onboarding repository identity and integrations that still use the old path. Do not assume every Pages/Actions/package/webhook/OAuth integration follows redirects. Keep a record of redirects and verify current GitHub behaviour.
6. Existing `.cache/workspace/projects.sqlite3`, model caches and `.cache/codespaces/owner-credentials.json` stay with their checkout. Do not rename/move a live checkout blindly or re-create its database. Scripts resolve their root from their own path; legacy `MOULD_*` environment/preference keys intentionally remain compatible. An existing Codespace's forwarded hostname comes from `CODESPACE_NAME`, not a guessed new repository name.
7. Recheck private port 8000, exact origin/login/CSRF, save/reopen, system comparison, backup/restore and the native-model proposal. Revalidate any future OAuth callback eligibility after the actual deployment identity is known.

This increment prepares the migration and publishes only the authorised source trial. It changes neither repository visibility nor billing, identity, branch protection or external infrastructure.
