/**
 * Changelog parsing primitives shared by the release scripts.
 *
 * @jscutlery/semver writes each package's CHANGELOG.md as a list of version
 * entries, newest first, each with optional "### Features", "### Bug Fixes",
 * "### Chores", and "### Dependency Updates" sub-sections. These helpers turn
 * that text into structured data; they never mutate it.
 *
 * Written as TypeScript executed natively via Node's type stripping (Node 24+).
 */

export interface ChangelogEntry {
  version: string;
  date: string;
  headerLine: string;
  body: string;
}

export interface DependencyUpdate {
  name: string;
  version: string;
}

export interface OwnChanges {
  Features: string[];
  'Bug Fixes': string[];
  other: string[];
}

const VERSION_HEADER_RE =
  /^## \[(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\]\([^)]*\)(?:\s*\(([^)]*)\))?/;

// The shape of a bare "### Dependency Updates" bullet. Exported because the
// enrichment transform rewrites these lines and relies on the same definition.
export const DEP_LINE_RE =
  /^[-*]\s+`([^`]+)`\s+updated to version\s+`([^`]+)`\s*$/;

// Split a CHANGELOG into version entries, newest first.
export function parseEntries(text: string): ChangelogEntry[] {
  const chunks = text.split(/^(?=## \[)/m);
  const entries: ChangelogEntry[] = [];
  for (const chunk of chunks) {
    const match = chunk.match(VERSION_HEADER_RE);
    if (!match) continue;
    const newlineIndex = chunk.indexOf('\n');
    const headerLine =
      newlineIndex === -1 ? chunk : chunk.slice(0, newlineIndex);
    const body = newlineIndex === -1 ? '' : chunk.slice(newlineIndex + 1);
    entries.push({ version: match[1], date: match[2] || '', headerLine, body });
  }
  return entries;
}

// Return the text under a "### <title>" sub-section, or null when absent.
function extractSection(body: string, title: string): string | null {
  const lines = body.split('\n');
  let found = false;
  let capturing = false;
  const out: string[] = [];
  for (const line of lines) {
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      capturing = heading[1] === title;
      if (capturing) found = true;
      continue;
    }
    if (capturing) out.push(line);
  }
  return found ? out.join('\n') : null;
}

// Parse the "### Dependency Updates" bullets into { name, version } pairs.
export function parseDependencyUpdates(body: string): DependencyUpdate[] {
  const section = extractSection(body, 'Dependency Updates');
  if (section === null) return [];
  const updates: DependencyUpdate[] = [];
  for (const line of section.split('\n')) {
    const match = line.match(DEP_LINE_RE);
    if (match) updates.push({ name: match[1], version: match[2] });
  }
  return updates;
}

// Normalize a bullet to a leading "- " marker and strip trailing whitespace.
export function normalizeBullet(line: string): string {
  return line.replace(/^[-*]\s+/, '- ').replace(/\s+$/, '');
}

// Collect a version entry's own changes, ignoring its Dependency Updates block.
export function parseOwnChanges(body: string): OwnChanges {
  const result: OwnChanges = { Features: [], 'Bug Fixes': [], other: [] };
  let current = 'other';
  for (const line of body.split('\n')) {
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1];
      continue;
    }
    if (current === 'Dependency Updates') continue;
    if (!/^[-*]\s+/.test(line)) continue;
    const bullet = normalizeBullet(line);
    if (current === 'Features') result.Features.push(bullet);
    else if (current === 'Bug Fixes') result['Bug Fixes'].push(bullet);
    // Any other visible section (Chores, Refactors, or loose pre-heading
    // bullets) is still an own change. Dependency Updates was skipped above.
    else result.other.push(bullet);
  }
  return result;
}
