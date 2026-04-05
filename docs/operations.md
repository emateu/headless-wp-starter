# Operations Guide

Day-to-day operational procedures for the CMS infrastructure.

---

## Deploy to production

Production deploys are manual. You choose which commit SHA to deploy.

1. Find the SHA you want to deploy (typically the latest commit on `main` that was already validated in dev):
   ```sh
   git log --oneline -5
   ```

2. Trigger the production deploy workflow:
   ```sh
   gh workflow run deploy-prod.yml --repo <owner>/<repo> -f sha=<commit-sha>
   ```

3. The workflow will:
   - Verify both Docker images (`web` and `cms`) exist in ghcr.io for that SHA
   - Deploy to the production VPS
   - Run smoke tests (frontend HTTP 200, GraphQL, container health)
   - Create a git tag (`YYYY-MM-DD.N`) and GitHub Release with changelog

   > **Note**: Dev auto-deploy handles partial builds (only rebuilds the service that changed). But prod requires **both** images built for the given SHA. If the SHA only has one image (e.g., only web changed), trigger a full rebuild first: `gh workflow run deploy.yml --repo <owner>/<repo>`

4. Monitor the workflow:
   ```sh
   gh run watch --repo <owner>/<repo>
   ```

---

## Hotfix to production

When you need to fix something in prod urgently without waiting for the normal flow.

1. Create and push a hotfix branch from `main`:
   ```sh
   git checkout -b hotfix/description main
   # make the fix
   git commit -m "fix: description"
   git push origin hotfix/description
   ```

2. Wait for the CI to build images (the `Build and Deploy to Dev` workflow runs on push to main, but the build jobs also run for the hotfix since `workflow_dispatch` can trigger them). Alternatively, trigger a build manually:
   ```sh
   gh workflow run deploy.yml --repo <owner>/<repo>
   ```
   > Note: the auto-deploy to dev only runs on push to `main`, but you can use `workflow_dispatch` to build images from the current branch.

3. Deploy the hotfix SHA directly to prod:
   ```sh
   gh workflow run deploy-prod.yml --repo <owner>/<repo> -f sha=<hotfix-commit-sha>
   ```

4. **After prod is stable**, merge the hotfix to main:
   ```sh
   git checkout main
   git merge hotfix/description
   git push origin main
   git branch -d hotfix/description
   ```

> **Important**: always merge the hotfix back to `main`. If you forget, the next dev deploy will overwrite your fix.

---

## Rollback production

If a deploy breaks prod, deploy the previous known-good SHA.

1. Find the last working tag:
   ```sh
   git tag --sort=-creatordate | head -5
   ```

2. Get the SHA for that tag:
   ```sh
   git rev-list -n 1 <tag>
   ```

3. Deploy it:
   ```sh
   gh workflow run deploy-prod.yml --repo <owner>/<repo> -f sha=<previous-sha>
   ```

This deploys the exact same images that were running before. Database changes are NOT rolled back — if the broken deploy included WordPress content changes, those persist.

---

## Update WordPress plugins

Plugins are vendored as zip files in `apps/wordpress/plugins/`.

**Open-source plugins** (WPGraphQL, WPGraphQL for ACF, WP Offload Media Lite):

```sh
./apps/wordpress/plugins/update.sh
git add apps/wordpress/plugins/*.zip
git commit -m "chore: update WordPress plugins"
git push origin main
```

**ACF Pro** (requires a license key):

```sh
pnpm wp:setup-acf   # prompts for your key, downloads and commits automatically
git push origin main
```

This triggers a rebuild of the WordPress image and auto-deploys to dev. Verify in dev before promoting to prod.

---

## Restore from backup

Backups are stored in R2 and run every 6 hours. Each backup includes a MariaDB dump and a sync of WordPress uploads.

### Restore database

1. SSH into the VPS:
   ```sh
   ssh -i ~/.ssh/<deploy-key> deploy@<VPS_IP>
   ```

2. List available backups (local):
   ```sh
   ls -lht /var/lib/docker/volumes/<project>_backup_data/_data/
   ```

3. Or list backups in R2:
   ```sh
   docker exec <project>-backup-1 rclone ls r2:<BUCKET>/db/
   ```

4. Download a specific backup from R2 (if not available locally):
   ```sh
   docker exec <project>-backup-1 rclone copy r2:<BUCKET>/db/<filename>.sql.gz /backups/
   ```

5. Restore the dump:
   ```sh
   docker exec <project>-backup-1 sh -c \
     'gunzip -c /backups/<filename>.sql.gz | mariadb -h db -u $DB_USER -p$DB_PASSWORD $DB_NAME'
   ```

### Restore uploads

If the uploads volume was lost or corrupted:

```sh
docker exec <project>-backup-1 rclone sync r2:<BUCKET>/uploads/ /uploads/
```

This downloads all media files from R2 back to the WordPress uploads volume.

---

## Change a VPS for an environment

When you need to move an environment to a new VPS (e.g. upgrade, migration).

1. Provision the new VPS following the [new environment runbook](runbook-new-environment.md) steps 1, 6, and 7 (Hetzner, ghcr.io login, .env file)

2. Update DNS in Cloudflare to point to the new VPS IP

3. Update the GitHub Environment secrets:
   ```sh
   gh secret set VPS_HOST --repo <owner>/<repo> --env <environment> --body "<new-IP>"
   gh secret set SSH_KEY --repo <owner>/<repo> --env <environment> < ~/.ssh/<key>
   ```

4. Trigger a deploy to push the current state to the new VPS:
   ```sh
   # For dev:
   gh workflow run deploy.yml --repo <owner>/<repo>

   # For prod:
   gh workflow run deploy-prod.yml --repo <owner>/<repo> -f sha=<current-sha>
   ```

5. If you need to migrate data from the old VPS:
   - Run a backup on the old VPS: `docker exec <project>-backup-1 /usr/local/bin/backup.sh`
   - Restore on the new VPS using the restore procedures above

6. Verify everything works, then destroy the old VPS

---

## View logs (Grafana)

Logs from all containers are collected by Alloy and stored in Loki with 7-day retention.

1. Open Grafana at `https://<grafana-domain>`
2. Go to **Dashboards → Service Logs**
3. Use the **service** dropdown to filter by service:
   - `web` — Next.js frontend
   - `wordpress` — WordPress CMS
   - `db` — MariaDB database
   - `caddy` — Reverse proxy
   - `backup` — Backup container
4. Use the **Search** field to filter by text (e.g. `error`, `500`)

For infrastructure metrics (CPU, RAM, disk, network):
- Go to **Dashboards → Infrastructure**

Alternatively, use Grafana's built-in **Drilldown → Logs** for ad-hoc exploration.

---

## SSH into a VPS

```sh
# Dev
ssh -i ~/.ssh/<deploy-key> deploy@<dev-IP>

# Production
ssh -i ~/.ssh/<deploy-key> deploy@<prod-IP>
```

Useful commands once connected:

```sh
cd /opt/app

# Container status
docker compose -f docker-compose.prod.yml ps

# Logs for a service
docker compose -f docker-compose.prod.yml logs <service> --tail 50

# Run WP-CLI
docker compose -f docker-compose.prod.yml exec -T wordpress wp <command> --allow-root

# Trigger a backup manually
docker exec <project>-backup-1 /usr/local/bin/backup.sh

# Check R2 backup contents
docker exec <project>-backup-1 rclone ls r2:<BUCKET>/
```
