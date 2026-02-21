# Daily UI

A multi-tenant system that uses Claude Code + GitHub Actions to generate daily json-render UI specs, builds them into a static Astro site, and deploys to GitHub Pages. The generated UIs serve as a **client-side life tracking system** — interactive dashboards for gym routines, nutrition, habits, etc. — with state managed entirely in the browser via json-render's `StateProvider` and persisted to `localStorage`.

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed locally
- Claude Pro or Max subscription (for `claude setup-token`)
- GitHub repository with Pages enabled

### Local Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview build
bun run preview
```

### Project Structure

```
daily-ui/
├── src/
│   ├── content.config.ts          # Content Collections (tenants, templates, specs)
│   ├── pages/
│   │   ├── index.astro            # Dashboard
│   │   └── [category]/[tenant].astro  # Tenant spec viewer
│   ├── components/
│   │   └── SpecRenderer.tsx       # React island with state persistence
│   └── lib/
│       ├── catalog.ts             # json-render component catalog
│       └── registry.tsx           # React component registry
├── tenants/                       # Tenant configs (markdown + frontmatter)
│   └── gym/
│       ├── _template.md           # Category prompt template
│       └── john.md                # Sample tenant
├── generated/                     # AI-generated specs (committed by CI)
│   └── gym/john/latest.json
└── engine/
    ├── prompts/system.md          # Base system prompt
    └── generate.sh                # Generation script
```

## Adding Tenants

### 1. Create a category template

Create `tenants/{category}/_template.md`:

```markdown
---
category: gym
---

# Gym Routine Generator

Generate a workout routine for today as a json-render spec.

## Component Guidelines
- Card for each section (Warmup, Main Lifts, Accessories, Cooldown)
- Table for exercise details
- Checkbox for marking exercises completed
```

### 2. Create a tenant config

Create `tenants/{category}/{name}.md`:

```markdown
---
name: John
active: true
schedule:
  monday: true
  tuesday: false
  wednesday: true
  thursday: false
  friday: true
  saturday: true
  sunday: false
---

# Persona

## Goals
- Build muscle, focus on upper body
- Improve deadlift (current PR: 140kg)

## Constraints
- Shoulder impingement — avoid heavy overhead pressing
- Sessions 45-60 min max
```

### 3. Generate locally (optional)

```bash
bash engine/generate.sh
```

This creates `generated/{category}/{tenant}/YYYY-MM-DD.json` and `latest.json`.

## GitHub Actions Setup

### 1. Generate OAuth Token (one-time)

Run locally while logged into Claude:

```bash
claude setup-token
```

This outputs a long-lived OAuth token for CI/CD.

### 2. Add GitHub Secret

1. Go to **Settings > Secrets and variables > Actions**
2. Click **New repository secret**
3. Name: `CLAUDE_CODE_OAUTH_TOKEN`
4. Value: paste the token from step 1
5. Click **Add secret**

### 3. Enable GitHub Pages

1. Go to **Settings > Pages**
2. Source: **GitHub Actions**

### 4. Configure Astro base path

Update `astro.config.mjs`:

```js
export default defineConfig({
  site: 'https://<your-username>.github.io',
  base: '/daily-ui',
  // ...
});
```

### 5. Push to GitHub

The workflows will:
- **Daily Generate** (5 AM UTC): Run `engine/generate.sh` for active tenants scheduled today
- **Deploy**: Build Astro + deploy to GitHub Pages on push

## How It Works

1. **Tenants** are defined in markdown files with YAML frontmatter (name, active, schedule) + persona body
2. **Templates** define what to generate per category (e.g., gym routines, nutrition plans)
3. **GitHub Actions** runs `engine/generate.sh` daily at 5 AM UTC
4. **Claude Code CLI** generates json-render specs via the system prompt + category template + tenant persona
5. **Astro** builds static pages from the generated specs via Content Collections
6. **SpecRenderer** hydrates as a React island with `client:load`, persisting state to `localStorage`

## Token Expiry

When the `CLAUDE_CODE_OAUTH_TOKEN` expires, the workflow will fail with an auth error. Regenerate:

```bash
claude setup-token
```

Then update the GitHub secret with the new token.

## Tech Stack

- **Astro** — Static site framework
- **React 19** — Island hydration
- **Bun** — Package manager + runtime
- **Tailwind 4** — Styling
- **json-render** — Generative UI framework (Vercel Labs)
  - `@json-render/core` — Catalog, schema, spec validation
  - `@json-render/react` — Renderer, state providers
  - `@json-render/shadcn` — 16 pre-built shadcn/ui components
- **Claude Code** — AI generation via CLI
- **GitHub Actions** — Daily cron + deploy automation

## License

MIT
