import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  isStringArray,
  readStoredJson,
  removeStoredValue,
  writeStoredJson,
} from '../../src/lib/ui/storage.ts';
import { hydrateLocalTimeElement } from '../../src/lib/ui/time-client.ts';
import {
  formatSelectionLabel,
  getDatesBetween,
  updateCalendarSelection,
} from '../../src/lib/calendar/state.ts';
import {
  buildCalendarDateIndex,
  getEventsOnDate,
} from '../../src/lib/calendar/date-index.ts';
import {
  clearManualSelection,
  createManualSelection,
  getKioskMode,
  resolveKioskEvent,
  updateRotationState,
} from '../../src/lib/kiosk/state.ts';
import {
  findNearestProjectedEvent,
  getFlightRoute,
  renderPassportStats,
  setPassportFlightSeries,
  updatePassportFlightState,
} from '../../src/lib/passport/state.ts';

function installLocalStorageMock() {
  const store = new Map();
  globalThis.localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

const sampleEvents = [
  {
    id: 'f1-aus',
    seriesId: 'f1',
    eventName: 'Australian GP',
    round: 1,
    dateStart: '2026-03-13',
    dateEnd: '2026-03-15',
    sessions: [
      { type: 'FP1', startTimeUTC: '2026-03-13T01:30:00Z' },
      { type: 'Race', startTimeUTC: '2026-03-15T04:00:00Z' },
    ],
  },
  {
    id: 'motogp-qatar',
    seriesId: 'motogp',
    eventName: 'Qatar GP',
    round: 2,
    dateStart: '2026-03-20',
    dateEnd: '2026-03-22',
    sessions: [
      { type: 'Practice', startTimeUTC: '2026-03-20T12:00:00Z' },
      { type: 'MotoGP Race', startTimeUTC: '2026-03-22T18:00:00Z' },
    ],
  },
];

describe('ui/storage foundations', () => {
  test('reads, writes, and removes stored JSON values', () => {
    installLocalStorageMock();
    writeStoredJson('rt-test', ['a', 'b']);
    assert.deepEqual(readStoredJson('rt-test', [], isStringArray), ['a', 'b']);
    removeStoredValue('rt-test');
    assert.deepEqual(readStoredJson('rt-test', ['fallback'], isStringArray), ['fallback']);
  });

  test('falls back when the stored shape is invalid', () => {
    installLocalStorageMock();
    localStorage.setItem('rt-test', JSON.stringify({ nope: true }));
    assert.deepEqual(readStoredJson('rt-test', ['fallback'], isStringArray), ['fallback']);
  });
});

describe('ui/time-client foundations', () => {
  test('hydrates a local-time element using its dataset', () => {
    const element = {
      dataset: { localTime: '2026-06-01T12:30:00Z', format: 'time-short' },
      textContent: '',
    };
    hydrateLocalTimeElement(element);
    assert.match(element.textContent, /^\d{2}:\d{2}$/);
  });
});

describe('calendar state helpers', () => {
  test('builds inclusive date ranges for shift selection', () => {
    assert.deepEqual(getDatesBetween('2026-03-13', '2026-03-15'), [
      '2026-03-13',
      '2026-03-14',
      '2026-03-15',
    ]);
  });

  test('updates selection state for single, ctrl, and shift selection', () => {
    let state = { selectedDates: new Set(), lastSelectedDate: null };
    state = updateCalendarSelection(state, '2026-03-13');
    assert.deepEqual([...state.selectedDates], ['2026-03-13']);

    state = updateCalendarSelection(state, '2026-03-14', { ctrlKey: true, metaKey: false, shiftKey: false });
    assert.deepEqual([...state.selectedDates].sort(), ['2026-03-13', '2026-03-14']);

    state = updateCalendarSelection(state, '2026-03-16', { shiftKey: true, metaKey: false, ctrlKey: false });
    assert.deepEqual([...state.selectedDates], ['2026-03-14', '2026-03-15', '2026-03-16']);
  });

  test('formats multi-date selection labels', () => {
    const label = formatSelectionLabel(['2026-03-13', '2026-03-14']);
    assert.match(label, /^2 days · /);
  });
});

describe('calendar date index helpers', () => {
  test('indexes multi-day events and respects active filters', () => {
    const activeFilters = new Set(['f1']);
    const index = buildCalendarDateIndex(sampleEvents, activeFilters);
    assert.equal(getEventsOnDate(index, '2026-03-14').length, 1);
    assert.equal(getEventsOnDate(index, '2026-03-21').length, 0);
  });
});

describe('kiosk state helpers', () => {
  test('returns live mode when a session is currently live', () => {
    const now = Date.parse('2026-03-15T04:30:00Z');
    const result = getKioskMode(sampleEvents, now, () => 0);
    assert.equal(result.mode, 'live');
    assert.equal(result.event?.id, 'f1-aus');
  });

  test('returns weekend mode for the next event within seven days', () => {
    const now = Date.parse('2026-03-16T00:00:00Z');
    const result = getKioskMode(sampleEvents, now, () => 0);
    assert.equal(result.mode, 'weekend');
    assert.equal(result.event?.id, 'motogp-qatar');
  });

  test('rotation and manual selection resolve to the expected event', () => {
    const now = Date.parse('2026-03-16T00:00:00Z');
    const rotationState = updateRotationState({ events: [], index: 0 }, sampleEvents, now, 5);
    const autoResult = getKioskMode(sampleEvents, now, () => 0);
    const manualState = createManualSelection('motogp-qatar', now, 60_000);
    const resolved = resolveKioskEvent(autoResult, sampleEvents, rotationState, manualState, now + 1_000);
    assert.equal(resolved.isManual, true);
    assert.equal(resolved.event?.id, 'motogp-qatar');

    const cleared = clearManualSelection();
    const autoResolved = resolveKioskEvent(autoResult, sampleEvents, rotationState, cleared, now + 61_000);
    assert.equal(autoResolved.isManual, false);
    assert.equal(autoResolved.event?.id, 'motogp-qatar');
  });
});

describe('passport state helpers', () => {
  test('sorts flight routes by round and updates flight state', () => {
    const unsorted = [
      { ...sampleEvents[1], lat: 1, lng: 2, isPast: false, name: 'Second', circuit: 'Track', country: 'Qatar' },
      { ...sampleEvents[0], lat: 3, lng: 4, isPast: true, name: 'First', circuit: 'Track', country: 'Australia' },
    ];
    const route = getFlightRoute(unsorted, 'f1');
    assert.equal(route[0].round, 1);

    const state = {
      activeFilter: 'all', hoveredEvent: null, selectedEvent: null, autoRotate: true, lastInteraction: 0,
      currentRotation: [0, 0, 0], velocityX: 0, scaleFactor: 1, flightProgress: 1,
      flightActive: false, flightPaused: false, followPlane: true, flightSeries: 'f1',
      lastFlightSegIndex: 4, isDragging: false, projectedDots: [],
    };
    updatePassportFlightState(state, unsorted);
    assert.equal(state.flightActive, false);
    setPassportFlightSeries(state, 'motogp', unsorted);
    assert.equal(state.flightSeries, 'motogp');
  });

  test('finds the nearest projected dot within a threshold', () => {
    const best = findNearestProjectedEvent([
      { id: 'a', px: 10, py: 10, d: 1, seriesId: 'f1', round: 1, lat: 0, lng: 0, dateStart: '2026-01-01', dateEnd: '2026-01-02', isPast: false, name: 'A', circuit: 'A', country: 'A' },
      { id: 'b', px: 40, py: 40, d: 1, seriesId: 'f1', round: 2, lat: 0, lng: 0, dateStart: '2026-01-03', dateEnd: '2026-01-04', isPast: false, name: 'B', circuit: 'B', country: 'B' },
    ], 12, 12, 18);
    assert.equal(best?.id, 'a');
    assert.equal(findNearestProjectedEvent([], 0, 0, 10), null);
  });

  test('renders passport stats summary HTML for the active filter', () => {
    const statsHtml = renderPassportStats([
      { ...sampleEvents[0], lat: 1, lng: 2, isPast: true, name: 'Aus', circuit: 'Albert Park', country: 'Australia' },
      { ...sampleEvents[1], lat: 3, lng: 4, isPast: false, name: 'Qatar', circuit: 'Lusail', country: 'Qatar' },
    ], 'all');
    assert.match(statsHtml, /1\/2 rounds/);
    assert.match(statsHtml, /2 countries/);
    assert.match(statsHtml, /2 circuits/);
  });
});