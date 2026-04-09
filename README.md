# Headless WP Starter

Headless WordPress (CMS) + Next.js (frontend) starter template. Clone, run four commands, and you have a full content management system with a modern frontend, CI/CD, monitoring, and backups — ready to deploy to production.

## Architecture

```
Browser ──→ Caddy (reverse proxy, auto-HTTPS)
               ├── web.example.com  ──→ Next.js (SSR) ───┐
               ├── cms.example.com  ──→ WordPress ───────┤
               │                         ├── ACF Pro     │
               │                         ├── WPGraphQL ←─┘ (internal GraphQL)
               │                         └── CMS Core
               │                               │
               │                            MariaDB
               │
               └── grafana.example.com ──→ Grafana
                                            ├── Loki (logs)
                                            └── Prometheus (metrics)
```

Next.js fetches content from WordPress via GraphQL over the internal Docker network. WordPress is not exposed to the public — Cloudflare Access protects admin endpoints, only uploads are public.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| CMS | WordPress 6.9, ACF Pro, WPGraphQL |
| Database | MariaDB 11 |
| Reverse proxy | Caddy 2 (auto-HTTPS) |
| Monitoring | Grafana + Loki + Prometheus + Alloy |
| Backups | Automated DB dumps + uploads sync to Cloudflare R2 |
| CI/CD | GitHub Actions → ghcr.io → VPS deploy via SSH |
| Code quality | Biome (lint + format), Lefthook (pre-commit hooks), TypeScript |
| Testing | Vitest |

## What's included

- **Zero-config dev setup** — `pnpm wp:up` and you're running
- **Content slices** — flexible page builder with ACF (rich text, images, galleries, quotes, embeds, infoboxes)
- **GraphQL API** — auto-generated types with codegen
- **Docker-based deployment** — immutable images, health checks, automatic rollback support
- **CI/CD pipeline** — push to main auto-deploys to dev, manual promote to prod with smoke tests
- **Monitoring out of the box** — Grafana dashboards for logs and infrastructure metrics
- **Automated backups** — 6-hour DB snapshots + media sync to R2, with retention policy
- **Security** — Cloudflare Access on CMS, `DISALLOW_FILE_MODS`, SVG sanitization
- **Sample content** — 10 posts, 2 pages, categories, menus (dev only) for instant demo

## Quick start

```sh
pnpm install        # Install frontend dependencies
pnpm wp:setup-acf   # Download ACF Pro (you'll be prompted for your license key)
pnpm wp:up          # Start MariaDB + WordPress (http://localhost:8080)
pnpm wp:init        # Install WordPress, activate plugins, seed sample content
pnpm dev            # Start Next.js dev server (http://localhost:3000)
```

No `.env` file needed — all defaults work out of the box. WordPress credentials: **admin** / **admin**.

### Prerequisites

- Docker & Docker Compose
- Node.js 22+
- pnpm (`corepack enable`)
- **[ACF Pro](https://www.advancedcustomfields.com/pro/)** license — the content slices system (flexible content, gallery, options pages) requires ACF Pro. The free version is not compatible. Run `pnpm wp:setup-acf` to download the plugin with your license key — the script commits it to your repo so CI builds include it automatically.

### WordPress commands

| Command | Description |
|---|---|
| `pnpm wp:up` | Start services (with auto-rebuild) |
| `pnpm wp:init` | Install WordPress, activate plugins, seed sample content |
| `pnpm wp:down` | Stop services |
| `pnpm wp:logs` | Tail WordPress logs |
| `pnpm wp:destroy` | Stop services and delete all volumes (fresh start) |
| `pnpm wp:restore` | Download latest DB + uploads from R2 and restore locally (run `--help` for setup) |

### Useful links

| Service       | URL                              |
|---------------|----------------------------------|
| Frontend      | http://localhost:3000             |
| WordPress     | http://localhost:8080/wp-admin    |
| GraphQL       | http://localhost:8080/graphql     |

## Production

Copy `.env.example` to `.env` and fill in the required values (`GHCR_OWNER`, domains, passwords). See the [new environment runbook](docs/runbook-new-environment.md) for the full setup guide.

### Deploying

Trigger deploys from GitHub Actions (repo → **Actions** tab) or via CLI:

```sh
# Dev — builds images and deploys automatically:
gh workflow run deploy.yml

# Production — deploys a specific commit (images must already be built):
gh workflow run deploy-prod.yml -f sha=<commit-sha>
```

Pushes to `main` that change `apps/wordpress/` or `apps/web/` trigger a dev deploy automatically.

### Docs

- [Operations guide](docs/operations.md) — deploy, rollback, backups, logs
- [New environment runbook](docs/runbook-new-environment.md) — provision a VPS from scratch
