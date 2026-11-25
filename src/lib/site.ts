// Shared data access, labels and text helpers for every page.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Person = CollectionEntry<'people'>['data'] & { id: string };
export type News = CollectionEntry<'news'>['data'];
export type Publication = CollectionEntry<'publications'>['data'];
export type Project = CollectionEntry<'projects'>['data'];
export type Course = CollectionEntry<'courses'>['data'];
export type ResearchArea = CollectionEntry<'research'>['data'];
export type ProfileSection = Person['profile'][number];
export type Link = { text: string; url: string };

export const LAB_INQUIRY_TEXT = 'If you have questions about the lab or our research, please email us.';
export const REPOSITORY_URL = 'https://github.com/imlab-ewha/imlab-ewha.github.io';

export const LABELS: Record<string, string> = {
  journal: 'Journal', conference: 'Conference', 'patent-software': 'Patent & Software',
  thesis: 'Thesis', 'magazine-book': 'Magazine / Book',
  published: 'Published / Registered', accepted: 'Accepted',
  'under-review': 'Under review / Filed', 'in-preparation': 'In preparation',
  awards: 'Awards', papers: 'Paper Acceptance', updates: 'Lab Updates',
  current: 'Current Projects', past: 'Past Projects',
};

export const NAV: [string, string][] = [
  ['research', 'Research Areas'], ['people', 'People'], ['publications', 'Publications'],
  ['projects', 'Projects'], ['news', 'News & Media'], ['courses', 'Courses'],
];

/** Site-root URL for an internal path ('people/' -> '/people/'); external links pass through. */
export function u(target: string): string {
  if (/^(https?:\/\/|mailto:|tel:|#)/.test(target)) return target;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${target.replace(/^\//, '')}`;
}

/** Split authored prose into sentences; never apply to bibliographic records. */
export function sentenceParts(text: string): string[] {
  return text.trim().split(/(?<=[.!?])\s+(?=[A-Z가-힣])/);
}

export function isExternal(url: string): boolean {
  return /^https?:\/\//.test(url);
}

export function webLinks(links: Link[] = []): Link[] {
  return links.filter((entry) => isExternal(entry.url ?? ''));
}

// ---------- Data ----------

export async function getPeople(): Promise<Person[]> {
  const entries = await getCollection('people');
  return entries
    .map((entry) => ({ ...entry.data, id: entry.id }))
    .sort((a, b) => a.order - b.order);
}

export async function getDirector(): Promise<Person> {
  const director = (await getPeople()).find((p) => p.group === 'director');
  if (!director) throw new Error('No person with group "director" in src/content/people');
  return director;
}

/** Newest first; items that share a month keep their order in news.yaml. */
export async function getNews(): Promise<News[]> {
  return (await getList('news')).sort((a, b) => b.date.localeCompare(a.date) || a.position - b.position);
}

/** Items of a YAML list file, in the order they appear in the file. */
export async function getList<C extends 'news' | 'publications' | 'projects' | 'courses' | 'supporters' | 'research'>(name: C) {
  return (await getCollection(name))
    .map((e) => e.data as CollectionEntry<C>['data'])
    .sort((a, b) => a.position - b.position);
}

export async function getContact() {
  const entry = await getEntry('settings', 'contact');
  if (!entry) throw new Error('Missing "contact" in src/content/settings.yaml');
  return entry.data;
}

// ---------- Records ----------

export function projectTitle(project: Project): string {
  const pattern = /^(?:\([^)]*\)\s*)?(?:과제책임자|연구책임자|참여연구원|총괄책임자|부센터장),?\s*/;
  return pattern.test(project.text) ? project.text.replace(pattern, '').split(', ')[0] : project.text;
}

export function publicationSubtype(pub: Publication): string | null {
  if (pub.category !== 'patent-software') return null;
  if (/국내표준|TTAK/.test(pub.text)) return 'Standard';
  if (/C-20\d{2}-/.test(pub.text)) return 'Software';
  return 'Patent';
}

export function matchesArea(area: ResearchArea, text: string): boolean {
  return Boolean(area.match_pattern) && new RegExp(area.match_pattern, 'i').test(text);
}

/** Fall runs from August to February; spring from March to July. */
export function currentSemesterId(today = new Date()): string {
  const month = today.getMonth() + 1;
  const season = month >= 8 || month <= 2 ? 'fall' : 'spring';
  const year = month > 2 ? today.getFullYear() : today.getFullYear() - 1;
  return `${season}-${year}`;
}

export function collectTalks(people: Person[]) {
  const talks: { speaker: string; person: string; text: string }[] = [];
  for (const person of people) {
    for (const section of person.profile) {
      if (section.title.toLowerCase().includes('talk')) {
        talks.push(...section.items.map((text) => ({ speaker: person.name, person: person.id, text })));
      }
    }
  }
  return talks;
}

export function collectPress(projects: Project[], people: Person[]) {
  const press: { title: string; url: string; context: string }[] = [];
  const seen = new Set<string>();
  for (const project of projects) {
    for (const item of project.links) {
      if (item.url && !seen.has(item.url)) {
        seen.add(item.url);
        press.push({ title: projectTitle(project), url: item.url, context: project.affiliation });
      }
    }
  }
  for (const person of people) {
    for (const section of person.profile) {
      if (!['invited talks', 'awards', 'professional services'].includes(section.title.toLowerCase())) continue;
      section.item_links.forEach((links, index) => {
        for (const item of links) {
          if (isExternal(item.url) && !seen.has(item.url)) {
            seen.add(item.url);
            press.push({ title: section.items[index], url: item.url, context: `${person.name} · ${section.title}` });
          }
        }
      });
    }
  }
  return press;
}

/** Split an address into "street" and "city, country" lines for the home page. */
export function addressLines(address: string): string[] {
  const parts = address.split(', ');
  if (parts.length < 3) return [address];
  return [parts.slice(0, -2).join(', '), parts.slice(-2).join(', ')];
}
