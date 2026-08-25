/**
 * Unit tests for src/lib/kiosk/state.ts — specifically the midnight-boundary
 * rollover behaviour: does next-event selection and live/weekend mode
 * correctly pick up day 2's events once the clock crosses midnight, rather
 * than holding a stale pointer to day 1?
 *
 * Uses Node's built-in test runner (node:test) — no extra dependencies.
 *
 * Run:
 *   node --experimental-strip-types \
 *        --loader ./tests/unit/ts-loader.mjs \
 *        --test tests/unit/kiosk-state.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { getKioskMode, getNextKioskEvent, updateRotationState } from '../../src/lib/kiosk/state.ts';

// ── Fixture: two events straddling a midnight boundary ──────────────────────
// Day 1 (2026-06-13): a short qualifying session late in the day (23:00 UTC,
// 20min duration per session-taxonomy.json). Its live window (start -> end +
// KIOSK_GRACE_MS 30min) closes at 23:50 UTC — well before midnight, so the
// midnight-crossing assertions below aren't muddied by the live-grace window
// itself spilling into day 2.
// Day 2 (2026-06-14): the next event, starting mid-morning (10:00 UTC).
const orderFn = () => 0;

function buildEvents() {
  return [
    {
      id: 'day1-event',
      seriesId: 'f1',
      eventName: 'Day One Grand Prix',
      round: 1,
      circuit: { name: 'Circuit A', city: 'City A', country: 'Country A', countryCode: 'AA' },
      dateStart: '2026-06-13',
      dateEnd: '2026-06-13',
      sessions: [
        { type: 'Q1', startTimeUTC: '2026-06-13T23:00:00Z' },
      ],
    },
    {
      id: 'day2-event',
      seriesId: 'f1',
      eventName: 'Day Two Grand Prix',
      round: 2,
      circuit: { name: 'Circuit B', city: 'City B', country: 'Country B', countryCode: 'BB' },
      dateStart: '2026-06-14',
      dateEnd: '2026-06-14',
      sessions: [
        { type: 'Race', startTimeUTC: '2026-06-14T10:00:00Z' },
      ],
    },
  ];
}

// ── getNextKioskEvent across the boundary ────────────────────────────────────

describe('getNextKioskEvent — midnight boundary', () => {
  test('just before day 1 session starts: next event is day 1', () => {
    const events = buildEvents();
    const now = new Date('2026-06-13T22:59:00Z').getTime();
    const next = getNextKioskEvent(events, now);
    assert.equal(next?.id, 'day1-event');
  });

  test('just after day 1 session starts (still day 1 clock-wise): next event rolls to day 2', () => {
    const events = buildEvents();
    // Day 1's only session (23:00) has now started, but we're still technically
    // within day 1's calendar date (23:55). Next event must already be day 2 —
    // no stale pointer to the now-passed day 1 event.
    const now = new Date('2026-06-13T23:55:00Z').getTime();
    const next = getNextKioskEvent(events, now);
    assert.equal(next?.id, 'day2-event');
  });

  test('just after midnight (00:01 day 2): next event is day 2, not a stale day-1 pointer', () => {
    const events = buildEvents();
    const now = new Date('2026-06-14T00:01:00Z').getTime();
    const next = getNextKioskEvent(events, now);
    assert.equal(next?.id, 'day2-event');
  });

  test('after day 2 session also passes: no next event remains', () => {
    const events = buildEvents();
    const now = new Date('2026-06-14T10:01:00Z').getTime();
    const next = getNextKioskEvent(events, now);
    assert.equal(next, null);
  });
});

// ── getKioskMode across the boundary ─────────────────────────────────────────

describe('getKioskMode — midnight boundary', () => {
  test('before day 1 session starts: mode is weekend, event is day 1 (not yet live)', () => {
    const events = buildEvents();
    const now = new Date('2026-06-13T22:59:00Z').getTime();
    const result = getKioskMode(events, now, orderFn);
    assert.equal(result.mode, 'weekend');
    assert.equal(result.event?.id, 'day1-event');
  });

  test('during day 1 live session: mode is live, event is day 1', () => {
    const events = buildEvents();
    const now = new Date('2026-06-13T23:10:00Z').getTime(); // within Q1 (20min) + grace window
    const result = getKioskMode(events, now, orderFn);
    assert.equal(result.mode, 'live');
    assert.equal(result.event?.id, 'day1-event');
  });

  test('still day 1 clock-wise but after grace closes (23:55): mode already reflects day 2, not stale day 1', () => {
    const events = buildEvents();
    const now = new Date('2026-06-13T23:55:00Z').getTime();
    const result = getKioskMode(events, now, orderFn);
    assert.notEqual(result.mode, 'live');
    assert.equal(result.event?.id, 'day2-event');
    // Day 2's event is within 7 days → weekend mode, not idle.
    assert.equal(result.mode, 'weekend');
  });

  test('just after midnight (00:01 day 2): mode continues to reflect day 2 event, not a stale day-1 pointer', () => {
    const events = buildEvents();
    const now = new Date('2026-06-14T00:01:00Z').getTime();
    const result = getKioskMode(events, now, orderFn);
    assert.notEqual(result.mode, 'live');
    assert.equal(result.event?.id, 'day2-event');
    assert.equal(result.mode, 'weekend');
  });

  test('once day 2 session goes live: mode is live with day 2 event, no leftover day 1 reference', () => {
    const events = buildEvents();
    const now = new Date('2026-06-14T10:05:00Z').getTime();
    const result = getKioskMode(events, now, orderFn);
    assert.equal(result.mode, 'live');
    assert.equal(result.event?.id, 'day2-event');
    assert.equal(result.alsoLive.length, 0);
  });
});

// ── updateRotationState across the boundary ──────────────────────────────────

describe('updateRotationState — midnight boundary', () => {
  test('rotation pool drops the day-1 event once its session has passed into day 2', () => {
    const events = buildEvents();
    const beforeMidnight = new Date('2026-06-13T22:00:00Z').getTime();
    const initial = updateRotationState({ events: [], index: 0 }, events, beforeMidnight, 5);
    assert.deepEqual(initial.events.map((e) => e.id), ['day1-event', 'day2-event']);

    const afterMidnight = new Date('2026-06-14T00:01:00Z').getTime();
    const rolled = updateRotationState(initial, events, afterMidnight, 5);
    assert.deepEqual(rolled.events.map((e) => e.id), ['day2-event']);
    // First-event identity changed → index resets rather than pointing at a
    // stale/shifted slot.
    assert.equal(rolled.index, 0);
  });
});
