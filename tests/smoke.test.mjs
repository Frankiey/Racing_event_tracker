/**
 * Smoke tests for RaceTrack static site.
 * Runs `astro build` then checks the generated HTML for expected content.
 *
 * Usage: node tests/smoke.test.mjs
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');

let passed = 0;
let failed = 0;

function extractJsonScript(html, scriptId) {
  const pattern = new RegExp(`<script[^>]+id="${scriptId}"[^>]*>([\\s\\S]*?)<\\/script>`);
  const match = html.match(pattern);
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

// --- Step 1: Build ---
console.log('\n🔨 Running astro build...');
try {
  execSync('npx astro build', { cwd: ROOT, stdio: 'pipe', timeout: 30000 });
  assert(true, 'Build succeeded');
} catch (e) {
  console.error(e.stderr?.toString());
  assert(false, 'Build succeeded');
  process.exit(1);
}

// --- Step 2: Check output files exist ---
console.log('\n📁 Checking output files...');
const expectedFiles = [
  'index.html',
  'calendar/index.html',
  'status/index.html',
  'watchlist/index.html',
  'recap/index.html',
  'series/f1/index.html',
];

for (const file of expectedFiles) {
  const fullPath = resolve(DIST, file);
  assert(existsSync(fullPath), `${file} exists`);
}

// --- Step 3: Dashboard checks ---
console.log('\n🏠 Dashboard (index.html)...');
const indexHtml = readFileSync(resolve(DIST, 'index.html'), 'utf-8');

assert(indexHtml.includes('RaceTrack'), 'Contains site title');
assert(indexHtml.includes('data-countdown'), 'Contains countdown timer');
assert(indexHtml.includes('series-filter'), 'Contains series filter');
assert(indexHtml.includes('data-series='), 'Contains event cards with data-series');

// Check F1 is specifically present on the dashboard
assert(indexHtml.includes('data-series="f1"'), 'Dashboard contains F1 events (data-series="f1")');

// Check multiple series are represented (not just one)
const dashboardSeries = new Set(indexHtml.match(/data-series="(\w+)"/g)?.map(m => m.match(/"(\w+)"/)[1]) ?? []);
assert(dashboardSeries.size >= 4, `Dashboard shows ${dashboardSeries.size} different series (expected ≥4)`);

// Check nav links use base path
assert(indexHtml.includes('/Racing_event_tracker/calendar'), 'Nav links use base path for calendar');
assert(indexHtml.includes('/Racing_event_tracker/'), 'Nav links use base path for home');

// Check dashboard-events-data JSON is valid and sorted by dateStart
const dashboardEvents = extractJsonScript(indexHtml, 'dashboard-events-data') ?? [];
assert(Array.isArray(dashboardEvents) && dashboardEvents.length > 0, `dashboard-events-data is valid JSON with ${dashboardEvents.length} events`);
if (dashboardEvents.length >= 2) {
  const sorted = dashboardEvents.every((ev, i) => i === 0 || ev.dateStart >= dashboardEvents[i - 1].dateStart);
  assert(sorted, 'dashboard-events-data events are sorted ascending by dateStart');
}

// --- Step 4: Calendar checks ---
console.log('\n📅 Calendar (/calendar)...');
const calendarHtml = readFileSync(resolve(DIST, 'calendar/index.html'), 'utf-8');
const calendarEvents = extractJsonScript(calendarHtml, 'all-events-data') ?? [];

assert(calendarHtml.includes('2026 Calendar'), 'Contains calendar title');
assert(calendarHtml.includes('id="cal-filter"'), 'Contains calendar filter container');
assert(calendarHtml.includes('id="cal-grid"'), 'Contains calendar grid');
assert(calendarHtml.includes('Season Activity'), 'Contains season activity heatmap');

assert(Array.isArray(calendarEvents) && calendarEvents.length >= 100, `Calendar has ${calendarEvents.length} events (expected ≥100)`);

const calendarSeriesSet = new Set(calendarEvents.map(event => event.seriesId));
assert(calendarSeriesSet.size >= 6, `Calendar shows ${calendarSeriesSet.size} series (expected ≥6)`);

assert(calendarHtml.includes('Mon') && calendarHtml.includes('Sun'), 'Has weekday headers');

// --- Step 5: Status page checks ---
console.log('\n📺 Status (/status)...');
const statusHtml = readFileSync(resolve(DIST, 'status/index.html'), 'utf-8');

assert(statusHtml.includes('RaceTrack'), 'Contains title');
assert(statusHtml.includes('id="kiosk-countdown"'), 'Contains kiosk countdown');
assert(statusHtml.includes('Coming Up'), 'Contains upcoming events section');
assert(!statusHtml.includes('series-filter'), 'Does NOT contain series filter (kiosk mode)');

// --- Step 6: No broken placeholder times visible ---
console.log('\n⏰ Data integrity...');
assert(!indexHtml.includes('datetime="1900-01-01'), 'Dashboard has no rendered 1900 placeholder times');
assert(!statusHtml.includes('data-session-start="1900-01-01'), 'Status has no rendered 1900 placeholder times');

// --- Step 7: Series page checks ---
console.log('\n🏁 Series pages...');
const f1SeriesHtml = readFileSync(resolve(DIST, 'series/f1/index.html'), 'utf-8');
const f1SeriesEvents = extractJsonScript(f1SeriesHtml, 'series-events-data') ?? [];

assert(f1SeriesHtml.includes('Formula 1') || f1SeriesHtml.includes('F1'), 'F1 series page contains F1 title');
assert(Array.isArray(f1SeriesEvents) && f1SeriesEvents.length > 0, `F1 series page has ${f1SeriesEvents.length} events (expected >0)`);
assert(f1SeriesEvents.every(ev => ev.seriesId === 'f1'), 'F1 series page only contains F1 events');

// --- Summary ---
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
