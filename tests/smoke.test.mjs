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
  'reminders/index.html',
  'status/index.html',
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
assert(indexHtml.includes('aria-label="Set reminders"'), 'Contains reminder bell buttons on event cards');

// Check multiple series are represented (not just one)
const dashboardSeries = new Set(indexHtml.match(/data-series="(\w+)"/g)?.map(m => m.match(/"(\w+)"/)[1]) ?? []);
assert(dashboardSeries.size >= 4, `Dashboard shows ${dashboardSeries.size} different series (expected ≥4)`);

// Check nav links use base path
assert(indexHtml.includes('/Racing_event_tracker/calendar'), 'Nav links use base path for calendar');
assert(indexHtml.includes('/Racing_event_tracker/'), 'Nav links use base path for home');

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

// --- Step 5: Reminders checks ---
console.log('\n🔔 Reminders (/reminders)...');
const remindersHtml = readFileSync(resolve(DIST, 'reminders/index.html'), 'utf-8');

assert(remindersHtml.includes('My Reminders'), 'Contains reminders page title');
assert(remindersHtml.includes('id="reminders-empty"'), 'Contains reminders empty state');
assert(remindersHtml.includes('bell icon next to favorites'), 'Explains how to find reminder controls');

// --- Step 6: Status page checks ---
console.log('\n📺 Status (/status)...');
const statusHtml = readFileSync(resolve(DIST, 'status/index.html'), 'utf-8');

assert(statusHtml.includes('RaceTrack'), 'Contains title');
assert(statusHtml.includes('id="kiosk-countdown"'), 'Contains kiosk countdown');
assert(statusHtml.includes('Coming Up'), 'Contains upcoming events section');
assert(!statusHtml.includes('series-filter'), 'Does NOT contain series filter (kiosk mode)');

// --- Step 7: No broken placeholder times visible ---
console.log('\n⏰ Data integrity...');
assert(!indexHtml.includes('datetime="1900-01-01'), 'Dashboard has no rendered 1900 placeholder times');
assert(!statusHtml.includes('data-session-start="1900-01-01'), 'Status has no rendered 1900 placeholder times');

// --- Summary ---
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
