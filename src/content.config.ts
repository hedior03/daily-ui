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
