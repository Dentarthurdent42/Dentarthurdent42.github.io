# Near-instant project demo updates

The homepage embeds live copies of each project from `projects/<name>/`. Those
copies are refreshed by the [`sync-projects`](../.github/workflows/sync-projects.yml)
workflow in this repo, which:

- runs daily on a schedule (baseline freshness),
- can be run manually (`workflow_dispatch`), and
- **runs on demand** when it receives a `repository_dispatch` event of type
  `sync-projects`.

The third trigger is what makes updates near-instant: each source repo pings
this repo on every push, and the sync runs within seconds.

## One-time setup in each source repo

Do this once for **physical-metric-space** and once for **RotorVision**.

### 1. Create a token that can write to this site repo

A cross-repo `repository_dispatch` call needs a token with write access to
`Dentarthurdent42/Dentarthurdent42.github.io` (a source repo's built-in
`GITHUB_TOKEN` only has access to that source repo, so it can't reach here).

**Recommended — fine-grained personal access token:**

1. GitHub → Settings → Developer settings → Fine-grained tokens → *Generate new token*.
2. **Resource owner:** Dentarthurdent42.
3. **Repository access:** Only select repositories → `Dentarthurdent42.github.io`.
4. **Permissions:** Repository permissions → **Contents: Read and write**.
5. Generate and copy the token.

(A classic PAT with the `repo` scope also works but is broader than needed.)

### 2. Save the token as a secret in the source repo

In the source repo: Settings → Secrets and variables → Actions → *New repository
secret*.

- **Name:** `SITE_DISPATCH_TOKEN`
- **Value:** the token from step 1.

### 3. Add the trigger workflow to the source repo

Copy [`source-repo-trigger.yml`](./source-repo-trigger.yml) into the source repo
at `.github/workflows/notify-site.yml` and commit it to the default branch.

## Verify

1. Push any change to the source repo's default branch (or run its **Notify
   portfolio site** workflow manually).
2. In this repo's Actions tab, confirm **Sync project demos** starts shortly
   after.
3. If the project's files changed, the run commits "Sync embedded project demos
   from source repos" and the homepage embed reflects it after the Pages build.

## Notes

- The same `SITE_DISPATCH_TOKEN` value can be reused across both source repos.
- If a token is ever leaked or rotated, update the secret in each source repo.
- The daily schedule remains as a safety net even if a dispatch is missed.
