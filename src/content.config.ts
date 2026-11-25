// Content rules. A build stops with a clear message when a content file breaks them.
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

/** Load a YAML list file and remember each item's position, so pages keep the file's order. */
const list = (path: string) => file(path, {
  parser: (text) => (parse(text) as Record<string, unknown>[]).map((item, position) => ({ ...item, position })),
});
const position = z.number().int();

const link = z.object({
  text: z.string().default(''),
  url: z.string(),
});

const research = defineCollection({
  loader: list('src/content/research.yaml'),
  schema: z.object({
    position,
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    description: z.string(),
    topics: z.array(z.string()).default([]),
    illustration: z.string(),
    illustration_alt: z.string().default(''),
    match_pattern: z.string().default(''),
  }),
});

const people = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/people' }),
  schema: z.object({
    name: z.string(),
    group: z.enum(['director', 'graduate', 'alumni-graduate', 'alumni-undergraduate']),
    order: z.number().default(1000),
    image: z.string().default(''),
    email: z.string().default(''),
    details: z.array(z.string()).default([]),
    profile: z.array(z.object({
      title: z.string(),
      items: z.array(z.string()).default([]),
      links: z.array(link).default([]),
      item_links: z.array(z.array(link)).default([]),
    })).default([]),
  }),
});

const news = defineCollection({
  loader: list('src/content/news.yaml'),
  schema: z.object({
    position,
    id: z.string(),
    date: z.coerce.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM, for example 2026-09'),
    category: z.enum(['awards', 'papers', 'updates']),
    original_category: z.string().default(''),
    text: z.string(),
  }),
});

const publications = defineCollection({
  loader: list('src/content/publications.yaml'),
  schema: z.object({
    position,
    id: z.string(),
    category: z.enum(['journal', 'conference', 'patent-software', 'thesis', 'magazine-book']),
    status: z.enum(['published', 'accepted', 'under-review', 'in-preparation']),
    year: z.number().int().nullable().default(null),
    text: z.string(),
    links: z.array(link).default([]),
  }),
});

const projects = defineCollection({
  loader: list('src/content/projects.yaml'),
  schema: z.object({
    position,
    id: z.string(),
    status: z.enum(['current', 'past']),
    affiliation: z.string().default(''),
    text: z.string(),
    links: z.array(link).default([]),
  }),
});

const courses = defineCollection({
  loader: list('src/content/courses.yaml'),
  schema: z.object({
    position,
    id: z.string().regex(/^(spring|fall)-\d{4}$/, 'Use <season>-<year>, for example fall-2026'),
    label: z.string(),
    year: z.number().int(),
    season: z.enum(['spring', 'fall']),
    items: z.array(z.string()).default([]),
  }),
});

const supporters = defineCollection({
  loader: list('src/content/supporters.yaml'),
  schema: z.object({
    position,
    id: z.string(),
    name: z.string(),
    image: z.string().default(''),
  }),
});

const settings = defineCollection({
  loader: file('src/content/settings.yaml'),
  schema: z.object({
    email: z.string(),
    address: z.string(),
    map_url: z.string(),
  }),
});

export const collections = { research, people, news, publications, projects, courses, supporters, settings };
