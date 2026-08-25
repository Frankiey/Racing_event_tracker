import { test, expect } from '@playwright/test';

/**
 * Priority 2 — Interactivity: event modal (docs/test-strategy.md, Layer 5).
 *
 * EventCard.astro dispatches 'rt-open-event' on click (see event-client.ts
 * bindEventOpeners); EventModal.astro listens globally and populates
 * #modal-title / #modal-sessions, then adds the 'open' class to #event-modal.
 */

test.describe('Event modal', () => {
  test('clicking an event card opens the modal with the right event', async ({ page }) => {
    await page.goto('./');

    const firstCard = page.locator('.week-group [data-event-id]').first();
    const eventName = (await firstCard.locator('h3').first().textContent())?.trim();
    expect(eventName).toBeTruthy();

    const modal = page.locator('#event-modal');
    await expect(modal).not.toHaveClass(/open/);

    await firstCard.click();

    await expect(modal).toHaveClass(/open/);
    await expect(page.locator('#modal-title')).toHaveText(eventName!);
  });

  test('modal shows at least one session', async ({ page }) => {
    await page.goto('./');
    await page.locator('.week-group [data-event-id]').first().click();

    await expect(page.locator('#event-modal')).toHaveClass(/open/);
    const sessionRows = page.locator('#modal-sessions time');
    await expect(sessionRows.first()).toBeVisible();
    expect(await sessionRows.count()).toBeGreaterThan(0);
  });

  test('modal closes on Escape', async ({ page }) => {
    await page.goto('./');
    const modal = page.locator('#event-modal');

    await page.locator('.week-group [data-event-id]').first().click();
    await expect(modal).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/open/);
  });

  test('modal closes on backdrop click', async ({ page }) => {
    await page.goto('./');
    const modal = page.locator('#event-modal');

    await page.locator('.week-group [data-event-id]').first().click();
    await expect(modal).toHaveClass(/open/);

    // Click the backdrop itself, not the panel — force since the backdrop
    // sits behind the (larger) modal panel in the layout box model.
    await page.locator('#modal-backdrop').click({ position: { x: 5, y: 5 }, force: true });
    await expect(modal).not.toHaveClass(/open/);
  });
});
