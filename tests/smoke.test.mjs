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

// Check multiple series are represented (not just one)
const dashboardSeries = new Set(indexHtml.match(/data-series="(\w+)"/g)?.map(m => m.match(/"(\w+)"/)[1]) ?? []);
assert(dashboardSeries.size >= 4, `Dashboard shows ${dashboardSeries.size} different series (expected ≥4)`);

// Check nav links use base path
assert(indexHtml.includes('/Racing_event_tracker/calendar'), 'Nav links use base path for calendar');
assert(indexHtml.includes('/Racing_event_tracker/'), 'Nav links use base path for home');

// --- Step 4: Calendar checks ---
console.log('\n📅 Calendar (/calendar)...');
const calendarHtml = readFileSync(resolve(DIST, 'calendar/index.html'), 'utf-8');

assert(calendarHtml.includes('2026 Calendar'), 'Contains calendar title');
assert(calendarHtml.includes('series-filter'), 'Contains series filter');

const calendarSeries = calendarHtml.match(/data-series="(\w+)"/g) ?? [];
assert(calendarSeries.length >= 100, `Calendar has ${calendarSeries.length} events (expected ≥100)`);

const calendarSeriesSet = new Set(calendarSeries.map(m => m.match(/"(\w+)"/)[1]));
assert(calendarSeriesSet.size >= 6, `Calendar shows ${calendarSeriesSet.size} series (expected ≥6)`);

// Check month headers exist
assert(calendarHtml.includes('March 2026') || calendarHtml.includes('April 2026'), 'Has month section headers');

// --- Step 5: Status page checks ---
console.log('\n📺 Status (/status)...');
const statusHtml = readFileSync(resolve(DIST, 'status/index.html'), 'utf-8');

assert(statusHtml.includes('RaceTrack'), 'Contains title');
assert(statusHtml.includes('data-countdown'), 'Contains countdown');
assert(!statusHtml.includes('series-filter'), 'Does NOT contain series filter (kiosk mode)');

// --- Step 6: No broken placeholder times visible ---
console.log('\n⏰ Data integrity...');
assert(!indexHtml.includes('1900-01-01'), 'Dashboard has no 1900 placeholder dates');
assert(!statusHtml.includes('1900-01-01'), 'Status has no 1900 placeholder dates');

// --- Summary ---
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
