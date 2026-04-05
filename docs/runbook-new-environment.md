# Runbook: New Environment Setup

Step-by-step guide to provision a new environment (dev or production) from scratch.

**Prerequisites:**
- Cloudflare account with domain configured
- Hetzner Cloud account
- GitHub repo access with admin permissions

---

## 0. SSH Key

Generate a dedicated key pair for the deploy user (skip if you already have one):

```sh
ssh-keygen -t ed25519 -C "deploy" -f ~/.ssh/deploy
```

This creates `~/.ssh/deploy` (private) and `~/.ssh/deploy.pub` (public). You'll need:
- The **public key** for `infra/cloud-init.yml` (step 1)
- The **private key** for the GitHub Environment secret `SSH_KEY` (step 5)

---

## 1. Hetzner VPS

- [ ] Create VPS: **CX22** (2 vCPU, 4GB RAM), **Ashburn** datacenter, **Rocky Linux 10**
- [ ] Edit `infra/cloud-init.yml`: replace `<paste-your-ssh-public-key-here>` with your SSH public key
- [ ] Paste the edited contents in the **Cloud config / User Data** field
- [ ] Note the **public IP address**
- [ ] Wait for cloud-init to complete: `ssh -i ~/.ssh/<deploy-key> deploy@<IP> "sudo cloud-init status --wait"`
- [ ] Verify: `docker --version` and `docker compose version` work
- [ ] Install firewalld if needed: `sudo dnf install -y firewalld && sudo systemctl enable --now firewalld`
- [ ] Verify firewall: `sudo firewall-cmd --list-services` shows only `ssh http https`

## 2. Cloudflare DNS

- [ ] Create A record for frontend domain → VPS IP (proxied / orange cloud)
- [ ] Create A record for CMS domain → VPS IP (proxied / orange cloud)
- [ ] Create A record for Grafana domain → VPS IP (proxied / orange cloud)
- [ ] Verify: `dig +short <frontend-domain>` resolves (may show Cloudflare IPs if proxied)

## 3. Cloudflare Access (Zero Trust)

- [ ] Create Access Application for the CMS domain
- [ ] Create Access Application for the Grafana domain
- [ ] Configure authentication policy (Google, email OTP, etc.)
- [ ] Add authorized users/emails
- [ ] Add **Bypass** policy for CMS domain: URI Path starts with `/wp-content/uploads/` (so images are publicly accessible). Move it **above** the authentication policy.
- [ ] Verify: accessing the CMS domain shows Cloudflare Access login screen
- [ ] Verify: accessing the Grafana domain shows Cloudflare Access login screen
- [ ] Verify: images at `https://<cms-domain>/wp-content/uploads/...` load without login

## 4. Cloudflare R2

- [ ] Create bucket for this environment (e.g. `my-backup-dev` or `my-backup-prod`)
- [ ] Generate API token with **Object Read & Write** permissions scoped to the bucket
- [ ] Note: **Access Key ID**, **Secret Access Key**, **Endpoint URL**
- [ ] Test connectivity after `.env` is configured (step 7): `ssh deploy@<IP> "bash -s" < infra/backup/test-r2.sh`

## 5. GitHub Environment + Secrets

- [ ] Go to repo Settings → Environments → **New environment**
- [ ] Name: `dev` or `production`
- [ ] For production: add **Required reviewers** (optional but recommended)
- [ ] Add environment secrets:

| Secret | Value |
|---|---|
| `VPS_HOST` | VPS public IP |
| `SSH_KEY` | Contents of the deploy SSH private key |
| `WEB_DOMAIN` | Frontend domain (for smoke tests in prod workflow) |
| `CMS_DOMAIN` | CMS domain (for smoke tests in prod workflow) |

## 6. VPS — ghcr.io Login

- [ ] Create or reuse a GitHub PAT (classic) with `read:packages` scope
- [ ] SSH into VPS: `ssh -i ~/.ssh/<deploy-key> deploy@<IP>`
- [ ] Login: `echo "<PAT>" | docker login ghcr.io -u <github-user> --password-stdin`

## 7. VPS — .env File

- [ ] Create `/opt/app/.env` based on `.env.example`
- [ ] Fill in all values:

```env
# Project
COMPOSE_PROJECT_NAME=<project-name>
GHCR_OWNER=<your-github-username>

# Database
DB_ROOT_PASSWORD=<generate-secure-password>
DB_NAME=wordpress
DB_USER=wordpress
DB_PASSWORD=<generate-secure-password>

# Domains
WEB_DOMAIN=<frontend-domain>
CMS_DOMAIN=<cms-domain>

# WordPress admin
WP_TITLE=<site-title>
WP_ADMIN_USER=<admin-username>
WP_ADMIN_PASSWORD=<generate-secure-password>
WP_ADMIN_EMAIL=<admin-email>

# Grafana
GRAFANA_DOMAIN=<grafana-domain>
GRAFANA_PASSWORD=<generate-secure-password>

# Cloudflare R2
R2_ACCESS_KEY=<from-step-4>
R2_SECRET_KEY=<from-step-4>
R2_ENDPOINT=<from-step-4>
R2_BUCKET=<bucket-name-from-step-4>
```

## 8. First Deploy

The first deploy must be triggered manually so that images are built and pushed to GHCR:

```sh
# For dev — builds images + deploys:
gh workflow run deploy.yml

# For prod — requires images already built for the given SHA:
gh workflow run deploy-prod.yml -f sha=<commit-sha>
```

- [ ] Trigger the workflow (dev or prod)
- [ ] Wait for it to complete: `gh run watch`
- [ ] Verify all containers are healthy: `ssh deploy@<IP> "cd /opt/app && docker compose -f docker-compose.prod.yml ps"`

## 9. Post-deploy Verification

- [ ] Frontend loads at `https://<frontend-domain>`
- [ ] WordPress admin accessible at `https://<cms-domain>/wp-admin` (behind Cloudflare Access)
- [ ] GraphQL endpoint responds: `curl https://<cms-domain>/graphql -H "Content-Type: application/json" -d '{"query":"{ generalSettings { title } }"}'`
- [ ] Theme "headless" is active
- [ ] Plugins active: WPGraphQL, WPGraphQL for ACF, ACF Pro, CMS Core
- [ ] Permalinks set to `/%postname%/`

## 10. Monitoring

- [ ] Grafana loads at `https://<grafana-domain>` (login with `admin` / GRAFANA_PASSWORD)
- [ ] Dashboard "Service Logs" shows logs from all services
- [ ] Dashboard "Infrastructure" shows host CPU, RAM, disk gauges
- [ ] Create UptimeRobot monitor for `https://<frontend-domain>` (optional)
- [ ] Configure alert contacts (email, Telegram, Slack)

## 11. Test Backup

- [ ] Trigger manual backup: `ssh deploy@<IP> "docker exec <project>-backup-1 /usr/local/bin/backup.sh"`
- [ ] Verify backup appears in R2 bucket
- [ ] Verify uploads synced to R2 (if any media uploaded)
