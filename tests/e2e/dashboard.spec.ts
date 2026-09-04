import { test, expect, type Page } from '@playwright/test';

/**
 * Priority 1 — Dashboard correctness (docs/test-strategy.md, Layer 5).
 *
 * Runs against a production build served by `astro preview`
 * (see playwright.config.ts for how the server is expected to be running).
 *
 * These tests read data straight off the DOM (data-* attributes written by
 * EventCard.astro / index.astro) rather than the visible rendered text,
 * because the dashboard lazy-loads week groups (display:none until scrolled
 * into view) — reading attributes lets us assert on every upcoming card
 * regardless of whether it has scrolled into view yet.
 */

// Fixed non-UTC zone: makes "hydration actually changed the displayed time"
// assertions meaningful and deterministic instead of an accidental no-op.
test.use({ timezoneId: 'America/New_York' });

const FLAG_EMOJI = /[\u{1F1E6}-\u{1F1FF}]{2}/u;

interface CardInfo {
  eventId: string;
  seriesId: string;
  dateStart: string | null;
  anchorDate: string | null;
  raceUtc: string | null;
  sessionUtcs: string[];
  sessionTexts: string[];
  cardText: string;
}

/**
 * Collect every event card in the "upcoming" section of the dashboard
 * (i.e. everything except the collapsed "Recent" section, which
 * intentionally holds past events).
 */
async function collectUpcomingCards(page: Page): Promise<CardInfo[]> {
  return page.evaluate(() => {
    const wrappers = Array.from(
      document.querySelectorAll<HTMLElement>('.week-group .event-card-wrapper'),
    );
    return wrappers.map(wrapper => {
      const article = wrapper.querySelector<HTMLElement>('[data-event-id]')!;
      const sessionEls = Array.from(
        article.querySelectorAll<HTMLElement>('[data-session-row][data-session-utc]'),
      );
      return {
        eventId: article.dataset.eventId ?? '',
        seriesId: wrapper.dataset.series ?? '',
        dateStart: wrapper.dataset.dateStart || null,
        anchorDate: wrapper.dataset.anchorDate || null,
        raceUtc: wrapper.dataset.raceUtc || null,
        sessionUtcs: sessionEls.map(el => el.dataset.sessionUtc ?? ''),
        sessionTexts: sessionEls.map(el => el.querySelector('time')?.textContent?.trim() ?? ''),
        cardText: article.textContent ?? '',
      };
    });
  });
}

test.describe('Dashboard correctness', () => {
  test('all upcoming event cards have a dateStart today or later', async ({ page }) => {
    await page.goto('./');
    const cards = await collectUpcomingCards(page);
    expect(cards.length).toBeGreaterThan(0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    for (const card of cards) {
      // Every upcoming card must have at least one non-placeholder session,
      // and its last real session must not be in the past.
      const validUtcs = card.sessionUtcs.filter(u => u && !u.startsWith('1900-'));
      expect(validUtcs.length, `event ${card.eventId} has no valid sessions`).toBeGreaterThan(0);
      const lastSession = new Date(Math.max(...validUtcs.map(u => new Date(u).getTime())));
      expect(
        lastSession.getTime(),
        `event ${card.eventId} (${card.seriesId}) has a last session in the past: ${lastSession.toISOString()}`,
      ).toBeGreaterThanOrEqual(startOfToday.getTime());
    }
  });

  test('event cards are in chronological order', async ({ page }) => {
    await page.goto('./');
    const cards = await collectUpcomingCards(page);
    // Sort key is the anchor date (a "YYYY-MM-DD" string, so lexicographic
    // order is chronological order) — the day of the event's next unfinished
    // session, which is what the dashboard buckets and orders by. NOT dateStart
    // (a weekend whose Friday running is over sorts after a Saturday-only event)
    // and NOT the race session's exact UTC time: two events on the same day can
    // legitimately race in an order that doesn't match their day ordering, so
    // asserting on data-race-utc directly would be flaky against real data.
    const anchors = cards.map(c => c.anchorDate).filter((d): d is string => !!d);

    expect(anchors.length).toBeGreaterThan(1);

    for (let i = 1; i < anchors.length; i++) {
      expect(
        anchors[i] >= anchors[i - 1],
        `card ${i} (${anchors[i]}) is out of order relative to card ${i - 1} (${anchors[i - 1]})`,
      ).toBe(true);
    }
  });

  test('hero countdown targets the earliest upcoming race', async ({ page }) => {
    await page.goto('./');
    const heroCountdown = page.locator('[data-hero-countdown]');
    await expect(heroCountdown).toHaveCount(1);
    const heroUtc = await heroCountdown.getAttribute('data-countdown');
    expect(heroUtc).toBeTruthy();

    const cards = await collectUpcomingCards(page);
    const earliestCardUtc = Math.min(
      ...cards.map(c => c.raceUtc).filter((u): u is string => !!u).map(u => new Date(u).getTime()),
    );

    // The hero must never target a race later than the earliest rendered
    // card — it's allowed to be earlier only if that event was pruned by
    // the dashboard's per-series display cap (see index.astro MAX_PER_SERIES).
    expect(new Date(heroUtc!).getTime()).toBeLessThanOrEqual(earliestCardUtc);
  });

  test('at least 4 different series are represented', async ({ page }) => {
    await page.goto('./');
    const cards = await collectUpcomingCards(page);
    const seriesIds = new Set(cards.map(c => c.seriesId).filter(Boolean));
    expect(seriesIds.size).toBeGreaterThanOrEqual(4);
  });

  test('no event card shows an empty flag', async ({ page }) => {
    await page.goto('./');
    const cards = await collectUpcomingCards(page);
    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      expect(
        FLAG_EMOJI.test(card.cardText),
        `event ${card.eventId} (${card.seriesId}) has no country flag — possible alpha-3 countryCode`,
      ).toBe(true);
    }
  });

  test('no session shows a placeholder (year-1900) time', async ({ page }) => {
    // Note: we deliberately don't assert on the rendered "00:00" text here.
    // With a fixed non-UTC test timezone (see test.use above), a real
    // session can legitimately land on local midnight — that's correct
    // behavior, not a placeholder-time bug. The actual regression this
    // guards against (a 1900-01-01 placeholder slipping past the
    // isPlaceholderTime filter in EventCard.astro) is only detectable from
    // the underlying UTC value, which is deterministic regardless of timezone.
    await page.goto('./');
    const cards = await collectUpcomingCards(page);
    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      for (const utc of card.sessionUtcs) {
        expect(utc.startsWith('1900-'), `event ${card.eventId} rendered a placeholder session time (${utc})`).toBe(false);
      }
    }
  });

  test('page has no uncaught console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('./');
    await page.waitForLoadState('networkidle');

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });
});
