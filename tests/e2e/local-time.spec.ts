import { test, expect } from '@playwright/test';

/**
 * Priority 1 — LocalTime hydration (docs/test-strategy.md, Layer 5).
 *
 * EventCard.astro server-renders session times formatted in UTC, then a
 * client <script> (see EventCard.astro's initCards()) rewrites every
 * `[data-local-time][data-format="time-short"]` element to the viewer's
 * local time. This spec proves that rewrite actually runs in a real
 * browser — a regression here (e.g. a broken import, a thrown error before
 * the querySelectorAll loop) is invisible to the build smoke test, which
 * only inspects the pre-hydration server HTML.
 */

// Fixed, non-UTC zone: guarantees the local-formatted time differs from the
// UTC-formatted time the server rendered (a UTC test runner would make the
// "did it change" assertion a false positive/negative depending on offset).
test.use({ timezoneId: 'America/New_York' });

const ISO_8601_LIKE = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

interface RawTimeEntry {
  utc: string;
  text: string;
}

/** Parse the server-rendered (pre-hydration) `<time data-local-time>` tags out of raw HTML. */
function parseRawLocalTimes(html: string): RawTimeEntry[] {
  const entries: RawTimeEntry[] = [];
  const tagRe = /<time\b([^>]*)>([^<]*)<\/time>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    const [, attrs, text] = match;
    const utcMatch = /data-local-time="([^"]*)"/.exec(attrs);
    const formatMatch = /data-format="([^"]*)"/.exec(attrs);
    if (utcMatch && formatMatch?.[1] === 'time-short') {
      entries.push({ utc: utcMatch[1], text: text.trim() });
    }
  }
  return entries;
}

test.describe('LocalTime hydration', () => {
  test('<time data-local-time> elements hydrate after load (content changes from raw UTC)', async ({ page, request, baseURL }) => {
    // 1. Raw server HTML — what ships before any client JS runs.
    const rawHtml = await (await request.get(baseURL!)).text();
    const rawTimes = parseRawLocalTimes(rawHtml);
    expect(rawTimes.length).toBeGreaterThan(0);

    // 2. Same page, in a real browser, after hydration.
    await page.goto('./');
    const hydratedTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-local-time][data-format="time-short"]'))
        .map(el => el.textContent?.trim() ?? ''),
    );

    expect(hydratedTexts.length).toBe(rawTimes.length);

    let changed = 0;
    for (let i = 0; i < rawTimes.length; i++) {
      expect(hydratedTexts[i], `time element ${i} is empty after hydration`).not.toBe('');
      if (hydratedTexts[i] !== rawTimes[i].text) changed++;
    }

    // With a fixed multi-hour UTC offset, essentially every session time
    // should render differently locally vs. in UTC.
    expect(changed, 'no time elements changed after hydration — hydration script may not be running').toBeGreaterThan(0);
    expect(changed).toBe(rawTimes.length);
  });

  test('session times on event cards are not in ISO 8601 format after hydration', async ({ page }) => {
    await page.goto('./');

    const texts = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-local-time]')).map(el => el.textContent?.trim() ?? ''),
    );

    expect(texts.length).toBeGreaterThan(0);
    for (const text of texts) {
      expect(ISO_8601_LIKE.test(text), `rendered time "${text}" looks like a raw ISO 8601 string`).toBe(false);
    }
  });
});
