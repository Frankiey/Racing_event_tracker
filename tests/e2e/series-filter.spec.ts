import { test, expect, type Page } from '@playwright/test';

/**
 * Priority 2 — Interactivity: series filter (docs/test-strategy.md, Layer 5).
 *
 * SeriesFilter.astro toggles visibility of every `[data-series]` element via
 * inline `style.display` (see applySeriesVisibility in lib/filters.ts).
 *
 * Scoped to non-lazy week groups only (`.week-group:not([data-lazy-group])`)
 * — the dashboard lazy-loads later week groups on scroll (display:none until
 * an IntersectionObserver reveals them), which is an orthogonal concern to
 * filtering and would make visibility assertions ambiguous here.
 */

async function visibleCardSeries(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLElement>('.week-group:not([data-lazy-group]) [data-series]'),
    )
      .filter(el => el.style.display !== 'none')
      .map(el => el.dataset.series ?? ''),
  );
}

test.describe('Series filter', () => {
  test('selecting F1 shows only F1 cards', async ({ page }) => {
    await page.goto('./');

    const before = await visibleCardSeries(page);
    expect(before.length).toBeGreaterThan(0);
    // Sanity: the unfiltered dashboard must include more than one series,
    // otherwise this test can't actually prove filtering narrowed anything.
    expect(new Set(before).size).toBeGreaterThan(1);

    await page.locator('[data-filter="f1"]').click();

    const after = await visibleCardSeries(page);
    expect(after.length).toBeGreaterThan(0);
    expect(after.every(s => s === 'f1')).toBe(true);
  });

  test('deselecting F1 restores all cards', async ({ page }) => {
    await page.goto('./');
    const before = await visibleCardSeries(page);

    const f1Btn = page.locator('[data-filter="f1"]');
    await f1Btn.click();
    expect(await visibleCardSeries(page)).not.toEqual(before);

    await f1Btn.click(); // toggle off
    const after = await visibleCardSeries(page);
    expect(after.sort()).toEqual(before.sort());
  });
});
