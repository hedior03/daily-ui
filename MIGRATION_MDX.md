# Migration Plan: Native Astro MDX + Bun Generation

This document is the technical specification for moving from `json-render` to a native Astro MDX architecture. This shift optimizes for human-readability, AI generation speed, and design system flexibility.

## 🎯 Core Architectural Principles

1.  **MDX as the Source of Truth**: Workouts are authored in MDX. Standard Markdown handles content (headings, tables, bold text); JSX handles interactive components.
2.  **Direct Component Usage**: No JSON middle-man. The MDX file imports and uses components directly: `<ExerciseCard />`, `<SectionCheck />`, etc.
3.  **Scoped Theming**: Categories (e.g., `gym`) are scoped by a single CSS class (`.theme-gym`) that overrides global CSS variables.
4.  **Isolated Persistence**: Persistence is handled at the component level using `nanostores`. Keys are scoped by `tenant:date:id`.
5.  **Type-Safe Collections**: Astro Content Collections provide the querying layer, replacing the custom JSON API.

---

## 🏗️ Technical Specification

### 1. Content Collections (`src/content.config.ts`)
We will use the Astro 5.0 `glob` loader to manage the `generated/` directory.

```typescript
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const workouts = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./generated" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tenant: z.string(),
    duration: z.string().optional(),
    muscleGroups: z.array(z.string()).optional(),
    splitDay: z.string().optional(),
  })
});

export const collections = { workouts };
```

### 2. Scoped Theming (`src/styles/global.css`)
We will move away from global overrides to class-based scoping.

```css
/* Base Theme (Default) */
@theme {
  --color-primary: #fafafa;
  --radius: 0.5rem;
}

/* Gym Theme Overrides */
.theme-gym {
  --color-primary: #22c55e; /* Green */
  --color-primary-foreground: #052e16;
  --radius: 0.75rem; /* Rounder cards */
  --color-card: #0c0c0e;
  --color-border: #1a1a1c;
}
```

### 3. Domain Components (`src/components/gym/`)

#### `ExerciseCard.astro` (Static)
Replaces exercise tables with a glanceable card.
- **Props**: `name`, `sets`, `reps`, `rest`, `rpe`, `duration`, `id`.
- **Logic**: If `id` is present, render a small arrow button (CTA) that will eventually link to `/exercises/[id]`.
- **Layout**: Name on top, metrics row on bottom with subtle separators.

#### `SectionCheck.tsx` (React Island)
Handles persistence using `@nanostores/persistent`.
- **Props**: `id`, `label`, `storageKey`.
- **Logic**: 
  ```tsx
  const storageKey = `daily-ui:${props.storageKey}:${props.id}`;
  const isChecked = persistentAtom<boolean>(storageKey, false);
  ```

#### `WorkoutSection.astro` (Static)
A semantic wrapper for content grouping.
- **Props**: `title`.
- **Logic**: Renders a `Card` containing an `h3` heading and a `Stack` for its children.

---

### 4. The Generation Pipeline (`engine/generate.ts`)

The new Bun-based script replaces the brittle Bash script.

**Workflow**:
1.  **Environment Check**: Verify `CLAUDE_CODE_OAUTH_TOKEN` and `claude` CLI availability.
2.  **Tenant Discovery**: Scan `tenants/*/*.md`.
3.  **Config Parsing**: Use `yaml` to parse frontmatter. Check `active: true` and the `schedule` against `new Date()`.
4.  **Prompt Assembly**:
    - System Prompt: Instructions on MDX format and component props.
    - User Prompt: Tenant persona + category template + today's date/day.
5.  **AI Invocation**: `await Bun.spawn(["claude", "-p", fullPrompt, "--output-format", "markdown"])`.
6.  **Post-Processing**:
    - Prepend the standard component imports.
    - Prepend the frontmatter block.
    - Ensure clean blank lines between JSX tags and Markdown.
7.  **Atomic Write**: Save to `generated/{category}/{tenant}/{date}.mdx`.

---

### 5. Deployment Logic (`.github/workflows/deploy.yml`)

The deployment workflow will now trigger on:
1.  Pushes to `main`.
2.  Explicit `workflow_dispatch` calls from the `daily-generate` workflow.
3.  Path changes in `tenants/**`, `generated/**`, and `src/**`.

---

## 🧹 Implementation To-Do List

- [ ] **Infrastructure**: Install `mdx`, `nanostores`, `yaml`.
- [ ] **Styles**: Setup `.theme-gym` and remove `@json-render` source hack.
- [ ] **Components**: Implement the 5 gym-domain components.
- [ ] **Pages**: Refactor `[tenant].astro` to use `getCollection('workouts')`.
- [ ] **Script**: Implement `engine/generate.ts` and update `package.json` scripts.
- [ ] **Data**: Manually convert `2026-02-21.json` to `.mdx` for testing.
- [ ] **Cleanup**: Delete all `@json-render` references and old API folders.
