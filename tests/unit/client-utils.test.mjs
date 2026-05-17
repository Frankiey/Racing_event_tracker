/**
 * Unit tests for src/lib/client-utils.ts, src/lib/time.ts, and src/lib/sessions.ts.
 * Uses Node's built-in test runner (node:test) — no extra dependencies.
 *
 * Run:
 *   node --experimental-strip-types \
 *        --loader ./tests/unit/ts-loader.mjs \
 *        --test tests/unit/client-utils.test.mjs
 *
 * Note: sleepVerdict tests use a fixed timezone (TZ=UTC) to avoid local-offset
 * sensitivity. The npm test:unit script sets TZ=UTC.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ── Imports ─────────────────────────────────────────────────────────────────
import { countryFlag, isPastEvent, isPlaceholderTime } from '../../src/lib/time.ts';
import { getSessionDurationMinutes } from '../../src/lib/sessions.ts';
import { isSessionLive, getLiveSession, sleepVerdict } from '../../src/lib/client-utils.ts';

// ── isPlaceholderTime ────────────────────────────────────────────────────────

describe('isPlaceholderTime', () => {
  test('returns true for year-1900 timestamps', () => {
    assert.equal(isPlaceholderTime('1900-01-01T00:00:00Z'), true);
    assert.equal(isPlaceholderTime('1900-12-31T23:59:59Z'), true);
  });

  test('returns false for a normal UTC timestamp', () => {
    assert.equal(isPlaceholderTime('2026-06-01T14:00:00Z'), false);
  });

  test('returns true for empty string', () => {
    assert.equal(isPlaceholderTime(''), true);
  });
});

// ── countryFlag ──────────────────────────────────────────────────────────────

describe('countryFlag', () => {
  test('returns flag emoji for valid alpha-2 codes', () => {
    assert.equal(countryFlag('NL'), '🇳🇱');
    assert.equal(countryFlag('GB'), '🇬🇧');
    assert.equal(countryFlag('IT'), '🇮🇹');
  });

  test('returns empty string for alpha-3 codes', () => {
    assert.equal(countryFlag('NLD'), '');
    assert.equal(countryFlag('GBR'), '');
    assert.equal(countryFlag('USA'), '');
  });

  test('returns empty string for empty or falsy input', () => {
    assert.equal(countryFlag(''), '');
    assert.equal(countryFlag(null), '');
    assert.equal(countryFlag(undefined), '');
  });

  test('handles lowercase input (normalised to uppercase)', () => {
    assert.equal(countryFlag('nl'), '🇳🇱');
  });
});

// ── isPastEvent ──────────────────────────────────────────────────────────────

describe('isPastEvent', () => {
  test('returns true for an event with a far-past dateEnd and no sessions', () => {
    assert.equal(isPastEvent('2020-01-01'), true);
  });

  test('returns false for an event with a far-future dateEnd and no sessions', () => {
    assert.equal(isPastEvent('2099-12-31'), false);
  });

  test('uses latest session startTimeUTC when sessions are provided', () => {
    const pastSessions = [
      { type: 'Race', startTimeUTC: '2020-01-05T14:00:00Z' },
    ];
    assert.equal(isPastEvent('2099-12-31', pastSessions), true, 'last session in past → past');

    const futureSessions = [
      { type: 'Race', startTimeUTC: '2099-01-01T14:00:00Z' },
    ];
    assert.equal(isPastEvent('2020-01-01', futureSessions), false, 'last session in future → not past');
  });

  test('ignores placeholder session times when computing last session', () => {
    // Only a placeholder session → falls back to dateEnd
    const sessions = [
      { type: 'Qualifying', startTimeUTC: '1900-01-01T00:00:00Z' },
    ];
    assert.equal(isPastEvent('2020-01-01', sessions), true, 'placeholder + old dateEnd → past');
    assert.equal(isPastEvent('2099-12-31', sessions), false, 'placeholder + future dateEnd → not past');
  });
});

// ── getSessionDurationMinutes ────────────────────────────────────────────────

describe('getSessionDurationMinutes', () => {
  test('returns a positive number for all known session types', () => {
    const types = [
      'Race', 'Sprint', 'Qualifying', 'FP1', 'FP2', 'FP3', 'Practice',
      'MotoGP Race', 'NASCAR Race', 'Race 1', 'Race 2', 'Superpole Race',
    ];
    for (const type of types) {
      const dur = getSessionDurationMinutes(type);
      assert.ok(dur > 0, `Expected positive duration for "${type}", got ${dur}`);
    }
  });

  test('returns the default duration for unknown session types', () => {
    const dur = getSessionDurationMinutes('Unknown Session');
    assert.ok(dur > 0, 'Unknown session type should return a positive default duration');
  });

  test('Race is 120 minutes', () => {
    assert.equal(getSessionDurationMinutes('Race'), 120);
  });

  test('Sprint is shorter than Race', () => {
    assert.ok(
      getSessionDurationMinutes('Sprint') < getSessionDurationMinutes('Race'),
      'Sprint should be shorter than Race',
    );
  });
});

// ── isSessionLive ────────────────────────────────────────────────────────────

describe('isSessionLive', () => {
  test('returns false for a session that ended in the far past', () => {
    const session = { type: 'Race', startTimeUTC: '2020-01-01T14:00:00Z' };
    assert.equal(isSessionLive(session), false);
  });

  test('returns false for a session starting in the far future', () => {
    const session = { type: 'Race', startTimeUTC: '2099-01-01T14:00:00Z' };
    assert.equal(isSessionLive(session), false);
  });

  test('returns false for a placeholder time', () => {
    const session = { type: 'Race', startTimeUTC: '1900-01-01T00:00:00Z' };
    assert.equal(isSessionLive(session), false);
  });
});

// ── getLiveSession ───────────────────────────────────────────────────────────

describe('getLiveSession', () => {
  test('returns null when no session is live', () => {
    const sessions = [
      { type: 'FP1', startTimeUTC: '2020-01-01T10:00:00Z' },
      { type: 'Race', startTimeUTC: '2020-01-03T14:00:00Z' },
    ];
    assert.equal(getLiveSession(sessions), null);
  });

  test('returns null for empty sessions', () => {
    assert.equal(getLiveSession([]), null);
  });
});

// ── sleepVerdict ─────────────────────────────────────────────────────────────
// sleepVerdict uses new Date(utc).getHours() which returns the LOCAL hour.
// These tests assume TZ=UTC (set by the test runner script).

describe('sleepVerdict', () => {
  test('prime time: 12:00 UTC is prime time in UTC', () => {
    const result = sleepVerdict('2026-06-01T12:00:00Z');
    assert.equal(result.label, 'Prime time');
    assert.equal(result.emoji, '✅');
    assert.ok(result.cssClass.includes('emerald'));
  });

  test('late night: 23:00 UTC is late night in UTC', () => {
    const result = sleepVerdict('2026-06-01T23:00:00Z');
    assert.equal(result.label, 'Late night');
    assert.equal(result.emoji, '⚠️');
    assert.ok(result.cssClass.includes('amber'));
  });

  test('rough one: 02:00 UTC is rough one in UTC', () => {
    const result = sleepVerdict('2026-06-01T02:00:00Z');
    assert.equal(result.label, 'Rough one');
    assert.equal(result.emoji, '😴');
    assert.ok(result.cssClass.includes('rose'));
  });

  test('always returns an object with emoji, label, and cssClass', () => {
    const times = [
      '2026-06-01T00:00:00Z',
      '2026-06-01T06:00:00Z',
      '2026-06-01T14:00:00Z',
      '2026-06-01T22:30:00Z',
    ];
    for (const utc of times) {
      const result = sleepVerdict(utc);
      assert.ok(typeof result.emoji === 'string' && result.emoji.length > 0, `emoji present for ${utc}`);
      assert.ok(typeof result.label === 'string' && result.label.length > 0, `label present for ${utc}`);
      assert.ok(typeof result.cssClass === 'string' && result.cssClass.length > 0, `cssClass present for ${utc}`);
    }
  });
});
