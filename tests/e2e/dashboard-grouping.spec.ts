import { test, expect } from '@playwright/test';

/**
 * Dashboard section bucketing — regression guard (docs/test-strategy.md, Layer 5).
 *
 * "Today" means "still has something happening today", not "started today".
 * On a Sunday evening, once every one of an event's Sunday sessions has run,
 * its card must have moved to the section matching its *next unfinished*
 * session's day — keying the section to `dateStart` left finished weekends
 * parked under "Today" until midnight.
 *
 * Everything here is clock-relative: session times are read off the DOM
 * (`[data-session-row][data-session-utc]`) and compared against `Date.now()`
 * inside the page, so the spec is equally valid on a quiet Tuesday with
 * nothing running and mid-race-weekend. No fixed dates, no assumption about
 * which series happen to be on.
 *
 * "Finished" is approximated as `start + FINISHED_SLACK_MS < now`. The app
 * itself uses duration-aware end times (src/lib/session-taxonomy.json); this
 * slack is deliberately far more generous than any real session length, so a
 * session in progress can never be mistaken for a finished one and the test
 * only fires on unambiguous violations.
 */

// Fixed non-UTC zone, matching the other dashboard specs: "today" is a local
// notion, so the local-date arithmetic below should run in a known offset
// rather than whatever the runner machine happens to be set to.
test.use({ timezoneId: 'America/New_York' });

/** A session that started this long ago is certainly over (longest real session ≪ 6h). */
const FINISHED_SLACK_MS = 6 * 60 * 60 * 1000;

interface GroupingReport {
  violations: string[];
  sectionCount: number;
  cardCount: number;
  todayCardCount: number;
  labels: string[];
}

test.describe('Dashboard section bucketing', () => {
  test('cards sit under the section matching their next unfinished session', async ({ page }) => {
    await page.goto('./');
    // Client scripts do the re-bucketing/re-labelling (index.astro ->
    // refreshDashboardSections), so read the DOM only after hydration.
    await page.waitForFunction(
      () => document.querySelectorAll('[data-session-row][data-session-utc]').length > 0,
    );
    await page.waitForLoadState('networkidle');

    const report: GroupingReport = await page.evaluate((slackMs) => {
      const now = Date.now();
      const violations: string[] = [];
      const labels: string[] = [];
      let cardCount = 0;
      let todayCardCount = 0;

      const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const todayKey = dayKey(new Date(now));
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = dayKey(tomorrow);

      const sections = Array.from(document.querySelectorAll<HTMLElement>('section.week-group'));

      for (const section of sections) {
        const heading = section.querySelector('h2');
        if (!heading) {
          violations.push('a .week-group section has no <h2> heading');
          continue;
        }

        // The heading holds the label as bare text plus a count chip element,
        // so take only the direct text nodes for the label.
        const label = Array.from(heading.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent ?? '')
          .join(' ')
          .trim();
        labels.push(label);

        const cards = Array.from(section.querySelectorAll<HTMLElement>('.event-card-wrapper'));
        cardCount += cards.length;

        // ── Count chip must match what is actually rendered in the section ──
        const chip = Array.from(heading.querySelectorAll<HTMLElement>('*')).reverse()
          .find((el) => /^\d+$/.test((el.textContent ?? '').trim()));
        if (!chip) {
          violations.push(`section "${label}": no numeric count chip in its heading`);
        } else if (Number((chip.textContent ?? '').trim()) !== cards.length) {
          violations.push(
            `section "${label}": count chip says ${(chip.textContent ?? '').trim()} but it holds ${cards.length} card(s)`,
          );
        }

        if (label !== 'Today') continue;
        todayCardCount += cards.length;

        for (const card of cards) {
          const article = card.querySelector<HTMLElement>('[data-event-id]');
          const id = article?.dataset.eventId ?? '(unknown event)';

          const sessions = Array.from(
            (article ?? card).querySelectorAll<HTMLElement>('[data-session-row][data-session-utc]'),
          )
            .map((row) => ({
              utc: row.dataset.sessionUtc ?? '',
              type: row.dataset.sessionType ?? '',
            }))
            // Year-1900 stamps are "time TBC" placeholders, not real sessions.
            .filter((s) => s.utc && !s.utc.startsWith('1900-'))
            .map((s) => ({ ...s, at: new Date(s.utc).getTime() }))
            .filter((s) => Number.isFinite(s.at))
            .sort((a, b) => a.at - b.at);

          if (sessions.length === 0) continue;

          const isFinished = (at: number) => at + slackMs < now;
          const todaySessions = sessions.filter((s) => dayKey(new Date(s.at)) === todayKey);
          const unfinished = sessions.filter((s) => !isFinished(s.at));

          // (1) Every session today is over, yet the card is still under "Today"
          //     while it has sessions still to come on a later day.
          if (todaySessions.length > 0 && todaySessions.every((s) => isFinished(s.at))) {
            const laterToCome = sessions.filter(
              (s) => dayKey(new Date(s.at)) !== todayKey && s.at > now,
            );
            if (laterToCome.length > 0) {
              violations.push(
                `${id}: under "Today" but all ${todaySessions.length} of today's session(s) have finished; ` +
                  `next up is ${laterToCome[0].type} at ${laterToCome[0].utc}`,
              );
            }
          }

          // (2) The card's next unfinished session is tomorrow — it belongs
          //     under "Tomorrow", not "Today".
          const next = unfinished[0];
          if (next && dayKey(new Date(next.at)) === tomorrowKey) {
            violations.push(
              `${id}: under "Today" but its next unfinished session (${next.type} at ${next.utc}) is tomorrow`,
            );
          }
        }
      }

      return {
        violations,
        sectionCount: sections.length,
        cardCount,
        todayCardCount,
        labels,
      };
    }, FINISHED_SLACK_MS);

    // Guard against a vacuous pass: the assertions above are only meaningful
    // if there were sections and cards to walk in the first place.
    console.log(
      `[dashboard-grouping] ${report.sectionCount} section(s) [${report.labels.join(' | ')}], ` +
        `${report.cardCount} card(s), ${report.todayCardCount} under "Today"`,
    );
    expect(report.sectionCount, 'no .week-group sections rendered').toBeGreaterThan(0);
    expect(report.cardCount, 'no event cards rendered to check').toBeGreaterThan(0);

    expect(report.violations).toEqual([]);
  });
});
