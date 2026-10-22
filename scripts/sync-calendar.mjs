import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'assets/data/events.ics');
const url = process.env.CALENDAR_ICS_URL;

if (!url) {
  console.log('CALENDAR_ICS_URL is not configured; keeping the tracked calendar unchanged.');
  process.exit(0);
}

const response = await fetch(url, { headers: { accept: 'text/calendar,text/plain;q=0.9' } });
if (!response.ok) throw new Error(`Calendar download failed: ${response.status} ${response.statusText}`);
const remote = (await response.text()).replace(/\r?\n/g, '\r\n').trim() + '\r\n';
if (!remote.includes('BEGIN:VCALENDAR') || !remote.includes('BEGIN:VEVENT')) throw new Error('Downloaded file is not a usable ICS calendar.');

const local = fs.readFileSync(destination, 'utf8');
const events = (ics) => [...ics.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT\r?\n?/g)].map((match) => `BEGIN:VEVENT\r\n${match[1].replace(/\r?\n/g, '\r\n')}END:VEVENT\r\n`);
const uid = (event) => event.match(/^UID:(.+)$/m)?.[1]?.trim();
const custom = (event) => event.split(/\r?\n/).filter((line) => /^X-CONTRAST-/i.test(line));
const localByUid = new Map(events(local).map((event) => [uid(event), event]).filter(([id]) => id));

let merged = remote.replace(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT\r?\n?/g, (whole) => {
  const id = uid(whole);
  const preserved = localByUid.get(id);
  if (!preserved) return whole;
  const existing = new Set(whole.split(/\r?\n/));
  const additions = custom(preserved).filter((line) => !existing.has(line));
  return whole.replace(/END:VEVENT\r?\n?$/, `${additions.length ? `${additions.join('\r\n')}\r\n` : ''}END:VEVENT\r\n`);
});

// Keep manually maintained closures even when the remote calendar does not know them.
for (const event of events(local)) {
  if (/^X-CONTRAST-CLOSURE:TRUE$/mi.test(event) && !merged.includes(`UID:${uid(event)}`)) {
    merged = merged.replace(/END:VCALENDAR\r?\n?$/, `${event}END:VCALENDAR\r\n`);
  }
}
fs.writeFileSync(destination, merged);
console.log(`Synced calendar to ${path.relative(root, destination)} while preserving Contrast-specific metadata.`);
