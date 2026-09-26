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

import {
  getKioskMode,
  formatKioskDuration,
  getKioskFingerprint,
  getKioskFreshness,
  KIOSK_MAX_FAILURES,
  KIOSK_STALE_MS,
  formatKioskRound,
  getKioskRenderMode,
  getNextKioskEvent,
  getNextKioskTransition,
  isKioskSessionLive,
  updateRotationState,
} from '../../src/lib/kiosk/state.ts';
import { isSessionLiveAt, isSessionPastAt } from '../../src/lib/sessions.ts';

// ── Fixture: two events straddling a midnight boundary ──────────────────────
// Day 1 (2026-06-13): a short qualifying session late in the day (23:00 UTC,
// 20min duration per session-taxonomy.json). Its live window closes at 23:20 UTC
// — well before midnight, so the midnight-crossing assertions below aren't
// muddied by the live window itself spilling into day 2.
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
    const now = new Date('2026-06-13T23:10:00Z').getTime(); // within Q1 (20min)
    const result = getKioskMode(events, now, orderFn);
    assert.equal(result.mode, 'live');
    assert.equal(result.event?.id, 'day1-event');
  });

  test('still day 1 clock-wise but after Q1 ends (23:55): mode already reflects day 2, not stale day 1', () => {
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

// ── Kiosk and main page share ONE liveness definition ────────────────────────
// Regression (g6ir): a finished F2 Feature Race stayed "Live Now" on the kiosk for
// 30 extra minutes while the main page showed it closed, with the F1 race ~40 min away.

function buildAzerbaijanWeekend() {
  const ev = (id, seriesId, dateStart, sessions) => ({
    id, seriesId, eventName: id, round: 1, dateStart, dateEnd: dateStart, sessions,
    circuit: { name: 'Baku', city: 'Baku', country: 'Azerbaijan', countryCode: 'AZ' },
  });
  return [
    ev('f2-baku', 'f2', '2026-09-24', [
      { type: 'Sprint Race', startTimeUTC: '2026-09-25T07:30:00Z' },
      { type: 'Feature Race', startTimeUTC: '2026-09-26T08:00:00Z' }, // 70 min -> ends 09:10
    ]),
    ev('f1-baku', 'f1', '2026-09-24', [
      { type: 'Race', startTimeUTC: '2026-09-26T11:00:00Z' },
    ]),
  ];
}

describe('kiosk liveness matches the main page (no grace)', () => {
  const feature = { type: 'Feature Race', startTimeUTC: '2026-09-26T08:00:00Z' };
  const t = (iso) => new Date(iso).getTime();

  test('isKioskSessionLive agrees with isSessionLiveAt/isSessionPastAt at every boundary', () => {
    const end = t('2026-09-26T09:10:00Z');
    for (const now of [t('2026-09-26T07:59:59Z'), t('2026-09-26T08:00:00Z'), end - 1, end, end + 1, end + 25 * 60_000]) {
      assert.equal(isKioskSessionLive(feature, now), isSessionLiveAt(feature, now), `live @ ${now}`);
      assert.equal(isKioskSessionLive(feature, now), !isSessionPastAt(feature, now) && now >= t(feature.startTimeUTC));
    }
  });

  test('a session that has just ended is not live (no 30-minute grace)', () => {
    assert.equal(isKioskSessionLive(feature, t('2026-09-26T09:10:00Z')), false);
    assert.equal(isKioskSessionLive(feature, t('2026-09-26T09:40:00Z')), false);
  });

  test('placeholder (1900) sessions are never live', () => {
    assert.equal(isKioskSessionLive({ type: 'Race', startTimeUTC: '1900-01-01T00:00:00Z' }, Date.now()), false);
  });

  test('F2 feature finished, F1 race in 40 min: hero is the F1 event in weekend mode', () => {
    const events = buildAzerbaijanWeekend();
    const now = t('2026-09-26T10:20:00Z');
    const result = getKioskMode(events, now, orderFn);
    assert.equal(result.mode, 'weekend');
    assert.equal(result.event?.id, 'f1-baku');
    assert.equal(result.alsoLive.length, 0);
    const rotation = updateRotationState({ events: [], index: 0 }, events, now, 5);
    assert.deepEqual(rotation.events.map((e) => e.id), ['f1-baku']);
  });

  test('while the F2 feature is running it is live; the instant it ends the kiosk flips', () => {
    const events = buildAzerbaijanWeekend();
    const during = getKioskMode(events, t('2026-09-26T09:09:59Z'), orderFn);
    assert.equal(during.mode, 'live');
    assert.equal(during.event?.id, 'f2-baku');
    const after = getKioskMode(events, t('2026-09-26T09:10:00Z'), orderFn);
    assert.equal(after.mode, 'weekend');
    assert.equal(after.event?.id, 'f1-baku');
  });
});

describe('getNextKioskTransition', () => {
  const t = (iso) => new Date(iso).getTime();

  test('returns the live session end when that is the soonest boundary', () => {
    const events = buildAzerbaijanWeekend();
    assert.equal(getNextKioskTransition(events, t('2026-09-26T08:30:00Z')), t('2026-09-26T09:10:00Z'));
  });

  test('returns the next session start when nothing is live', () => {
    const events = buildAzerbaijanWeekend();
    assert.equal(getNextKioskTransition(events, t('2026-09-26T10:20:00Z')), t('2026-09-26T11:00:00Z'));
  });

  test('returns null once everything has ended', () => {
    const events = buildAzerbaijanWeekend();
    assert.equal(getNextKioskTransition(events, t('2026-09-26T14:00:00Z')), null);
  });
});

// ── Render mode follows the event on screen, not the next event (jwt3.16) ─────
describe('getKioskRenderMode', () => {
  const t = (iso) => new Date(iso).getTime();
  const ev = (id, dateStart, sessionStart) => ({
    id, seriesId: 'f1', eventName: id, round: 1, dateStart, dateEnd: dateStart,
    sessions: [{ type: 'Race', startTimeUTC: sessionStart }],
    circuit: { name: 'X', city: 'X', country: 'X', countryCode: 'XX' },
  });
  const now = t('2026-09-26T12:00:00Z');
  const soon = ev('soon', '2026-09-28', '2026-09-28T13:00:00Z');       // 2 days away
  const far = ev('far', '2026-10-26', '2026-10-26T13:00:00Z');         // 30 days away
  const running = ev('running', '2026-09-25', '2026-09-27T13:00:00Z'); // started yesterday, race still to come
  const events = [running, soon, far];

  test('next event 2 days away, rotation on an event 30 days away: rendered mode is idle', () => {
    const auto = getKioskMode([soon, far], now, orderFn);
    assert.equal(auto.mode, 'weekend');
    assert.equal(getKioskRenderMode(auto, far, false, now), 'idle');
    assert.equal(getKioskRenderMode(auto, soon, false, now), 'weekend');
  });

  test('event already in progress (dateStart in the past) counts as weekend', () => {
    const auto = getKioskMode(events, now, orderFn);
    assert.equal(getKioskRenderMode(auto, running, false, now), 'weekend');
  });

  test('live wins, manual selection is always idle, no event is empty', () => {
    const liveNow = t('2026-09-27T13:10:00Z');
    const auto = getKioskMode(events, liveNow, orderFn);
    assert.equal(auto.mode, 'live');
    assert.equal(getKioskRenderMode(auto, auto.event, false, liveNow), 'live');
    assert.equal(getKioskRenderMode(auto, soon, true, liveNow), 'idle');
    assert.equal(getKioskRenderMode(auto, null, false, liveNow), 'empty');
  });
});

describe('formatKioskRound', () => {
  test('uses the season total', () => {
    assert.equal(formatKioskRound(12, 14), 'Round 12 / 14');
  });
  test('drops the total when unknown or smaller than the round', () => {
    assert.equal(formatKioskRound(12, undefined), 'Round 12');
    assert.equal(formatKioskRound(12, 3), 'Round 12');
  });
});

describe('empty state (jwt3.21)', () => {
  const t = (iso) => new Date(iso).getTime();
  const allPast = [
    { id: 'p1', seriesId: 'f1', eventName: 'p1', round: 1, dateStart: '2026-05-01', dateEnd: '2026-05-03',
      sessions: [{ type: 'Race', startTimeUTC: '2026-05-03T13:00:00Z' }],
      circuit: { name: 'X', city: 'X', country: 'X', countryCode: 'XX' } },
  ];
  const now = t('2026-09-26T12:00:00Z');

  test('every session in the past: mode is empty with no event', () => {
    const auto = getKioskMode(allPast, now, orderFn);
    assert.equal(auto.mode, 'empty');
    assert.equal(auto.event, null);
    assert.equal(getKioskRenderMode(auto, auto.event, false, now), 'empty');
  });

  test('no events at all: mode is empty', () => {
    assert.equal(getKioskMode([], now, orderFn).mode, 'empty');
  });

  test('data restored (a future session appears): back to a normal mode without a special reset', () => {
    const restored = [...allPast, { ...allPast[0], id: 'f1', dateStart: '2026-09-27', dateEnd: '2026-09-27',
      sessions: [{ type: 'Race', startTimeUTC: '2026-09-27T13:00:00Z' }] }];
    const auto = getKioskMode(restored, now, orderFn);
    assert.equal(auto.mode, 'weekend');
    assert.equal(auto.event?.id, 'f1');
  });
});

describe('formatKioskDuration', () => {
  const min = 60_000;
  test('formats days, hours and minutes compactly', () => {
    assert.equal(formatKioskDuration(2 * 1440 * min + 4 * 60 * min + 30_000), '2d 4h');
    assert.equal(formatKioskDuration(3 * 60 * min + 5 * min), '3h 05m');
    assert.equal(formatKioskDuration(12 * min + 59_000), '12m');
  });
  test('under a minute and negative values are clamped', () => {
    assert.equal(formatKioskDuration(30_000), '<1m');
    assert.equal(formatKioskDuration(-5 * min), '<1m');
  });
});

describe('data freshness', () => {
  const t = (iso) => new Date(iso).getTime();
  const gen = '2026-09-26T04:17:37Z';

  test('fingerprint is the generated stamp, so a regenerated feed with the same events differs', () => {
    const a = { generated: gen, events: [{ id: 'a' }, { id: 'b' }] };
    const b = { generated: '2026-09-27T04:17:37Z', events: [{ id: 'a' }, { id: 'b' }] };
    assert.notEqual(getKioskFingerprint(a), getKioskFingerprint(b));
    assert.equal(getKioskFingerprint(a), gen);
  });

  test('fingerprint falls back to count + first id without a generated stamp', () => {
    assert.equal(getKioskFingerprint([{ id: 'x' }, { id: 'y' }]), '2-x');
    assert.equal(getKioskFingerprint({ events: [] }), '0-');
  });

  test('fresh within 36h, old beyond it', () => {
    assert.equal(getKioskFreshness(gen, t(gen) + KIOSK_STALE_MS, 0), 'fresh');
    assert.equal(getKioskFreshness(gen, t(gen) + KIOSK_STALE_MS + 1, 0), 'old');
  });

  test('offline after N consecutive failures, clears on recovery', () => {
    const now = t(gen) + 3_600_000;
    assert.equal(getKioskFreshness(gen, now, KIOSK_MAX_FAILURES - 1), 'fresh');
    assert.equal(getKioskFreshness(gen, now, KIOSK_MAX_FAILURES), 'offline');
    assert.equal(getKioskFreshness(gen, now, 0), 'fresh');
  });

  test('missing/invalid generated is not treated as stale', () => {
    assert.equal(getKioskFreshness(undefined, Date.now(), 0), 'fresh');
    assert.equal(getKioskFreshness('nonsense', Date.now(), 0), 'fresh');
  });
});
