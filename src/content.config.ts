import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Tenant configs — markdown files with YAML frontmatter.
 * Pattern excludes _template.md files.
 * e.g. tenants/gym/john.md → id: "gym/john"
 */
const tenants = defineCollection({
  loader: glob({
    pattern: ["**/*.md", "!**/_template.md"],
    base: "./tenants",
  }),
  schema: z.object({
    name: z.string(),
    active: z.boolean(),
    schedule: z.object({
      monday: z.boolean(),
      tuesday: z.boolean(),
      wednesday: z.boolean(),
      thursday: z.boolean(),
      friday: z.boolean(),
      saturday: z.boolean(),
      sunday: z.boolean(),
    }),
  }),
});

/**
 * Category templates — the _template.md files.
 * e.g. tenants/gym/_template.md → id: "gym/_template"
 */
const templates = defineCollection({
  loader: glob({ pattern: "**/_template.md", base: "./tenants" }),
  schema: z.object({
    category: z.string(),
  }),
});

/**
 * Generated specs — all JSON files in generated/.
 * e.g. generated/gym/john/latest.json → id: "gym/john/latest"
 * e.g. generated/gym/john/2026-02-21.json → id: "gym/john/2026-02-21"
 */
const specs = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./generated" }),
  schema: z.object({
    root: z.string(),
    elements: z.record(z.any()),
    state: z.record(z.any()).optional(),
  }),
});

export const collections = { tenants, templates, specs };
