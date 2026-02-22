# Daily UI

A multi-tenant system that uses Claude Code + GitHub Actions to generate daily **Astro MDX** life-tracking specs, builds them into a static Astro site, and deploys to GitHub Pages. The generated UIs serve as a **client-side life tracking system** — interactive dashboards for gym routines, nutrition, habits, etc. — with state managed via **Nanostores** and persisted to `localStorage`.

## 🎯 Architecture

This project moved from a verbose JSON-based rendering system to a native MDX architecture. This provides:
- **Reduced AI Tokens**: MDX is ~75% more compact than the previous JSON spec.
- **Human Readability**: Generated files in `generated/` are easy to read and manually edit.
- **Scoped Theming**: Each category (e.g., `gym`) has its own design system overrides via CSS variables.
- **Type Safety**: Astro Content Collections provide a robust layer for querying and rendering.

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) installed locally
- Claude Pro or Max subscription (for `claude setup-token`)
- GitHub repository with Pages enabled

### Local Development
```bash
# Install dependencies
bun install

# Generate today's workouts for active tenants
bun run generate

# Start dev server
bun run dev

# Build for production
bun run build
```

## 🏗️ Project Structure

```
daily-ui/
├── src/
│   ├── content.config.ts          # Content Collections definition
│   ├── pages/[category]/[tenant].astro # Main rendering page
│   ├── components/gym/            # Domain-specific components
│   │   ├── WorkoutSection.astro
│   │   ├── ExerciseCard.astro
│   │   ├── SectionCheck.tsx       # React + Nanostores (persistence)
│   │   └── ...
│   └── styles/global.css          # Scoped themes (.theme-gym)
├── tenants/                       # Tenant personas (Markdown)
│   └── gym/
│       ├── _template.md           # Category prompt instructions
│       └── john.md                # Tenant goals & schedule
├── generated/                     # AI-generated MDX files
│   └── gym/john/2026-02-21.mdx
└── engine/
    ├── prompts/system.md          # AI instructions for MDX/JSX
    └── generate.ts                # Bun-based generation script
```

## 🛠️ Components (Gym Domain)

- `<WorkoutSection title="Header">`: Semantic grouping for exercises.
- `<ExerciseCard name="Squat" sets={3} reps={5} />`: Glanceable metric cards.
- `<SectionCheck id="warmup" label="Done" storageKey="..." client:load />`: Persistent checkbox.
- `<FormCue label="Tip">`: Highlighted training cues.
- `<MuscleGroups groups={["Back", "Legs"]} />`: Visual status badges.

## 🤖 AI Generation Pipeline

1. **engine/generate.ts** scans `tenants/` for active personas scheduled for today.
2. It assembles a prompt using the **System Prompt**, the **Category Template**, and the **Tenant Persona**.
3. It invokes the **Claude CLI** to generate a native MDX file.
4. The file is saved to `generated/{category}/{tenant}/{date}.mdx`.
5. Astro's **Content Collections** index these files for the static build.

## 🔐 GitHub Actions Setup

1. **Generate OAuth Token**: Run `claude setup-token` locally and copy the token.
2. **Add GitHub Secret**: Name it `CLAUDE_CODE_OAUTH_TOKEN`.
3. **Enable GitHub Pages**: Set source to **GitHub Actions**.
4. **Deploy**: The `daily-generate` workflow runs daily at 5 AM UTC, commits the new MDX files, and triggers a redeploy.

## 🎨 Scoped Theming

Themes are controlled by a CSS class on the page wrapper (e.g., `<div class="theme-gym">`). Overrides are defined in `src/styles/global.css`:

```css
.theme-gym {
  --color-primary: #22c55e; /* Green for health/gym */
  --radius: 0.75rem;
  --color-card: #0c0c0e;
}
```

## 📝 License
MIT
