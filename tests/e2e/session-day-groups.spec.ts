import { test, expect } from '@playwright/test';

// The day-group ring means "the day still to come", not "today's calendar date".
// On a Friday night, after practice and quali have run, the ring must have moved off
// Friday's box onto Saturday's — keying it to the date left Friday ringed all evening.
// Asserted against whatever the clock says at run time, with a slack window well past
// any real session length so a session in progress never counts as finished.
const STALE_MS = 6 * 60 * 60 * 1000;

test('day-group ring is never stuck on a finished day', async ({ page }) => {
  await page.goto('./');
  await page.waitForFunction(() => document.querySelectorAll('[data-session-group]').length > 0);

  const problems = await page.evaluate((staleMs) => {
    const now = Date.now();
    const found: string[] = [];

    document.querySelectorAll<HTMLElement>('[data-event-id]').forEach(card => {
      const groups = [...card.querySelectorAll<HTMLElement>('[data-session-group]')];
      const ringed = groups.filter(g => g.classList.contains('ring-1'));
      const id = card.dataset.eventId;

      if (ringed.length > 1) found.push(`${id}: ${ringed.length} day-groups ringed at once`);

      ringed.forEach(g => {
        const starts = [...g.querySelectorAll<HTMLElement>('[data-session-row]')]
          .map(row => new Date(row.dataset.sessionUtc ?? 0).getTime());
        if (starts.length && starts.every(t => t + staleMs < now)) {
          found.push(`${id}: ring stuck on a day whose sessions all finished`);
        }
      });

      // A ringed day must be the earliest unfinished one — never skip ahead past a day
      // that still has sessions to run.
      const ringIndex = groups.findIndex(g => g.classList.contains('ring-1'));
      if (ringIndex > 0) {
        const earlierStillLive = groups.slice(0, ringIndex).some(g =>
          [...g.querySelectorAll<HTMLElement>('[data-session-row]')].some(
            row => new Date(row.dataset.sessionUtc ?? 0).getTime() > now,
          ),
        );
        if (earlierStillLive) found.push(`${id}: ring skipped a day that still has sessions`);
      }
    });
    return found;
  }, STALE_MS);

  expect(problems).toEqual([]);
});
