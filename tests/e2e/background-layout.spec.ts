import { test, expect } from '@playwright/test';

test('background never contributes layout height', async ({ page }) => {
  await page.goto('./');
  await page.waitForTimeout(2000);

  const r = await page.evaluate(() => {
    const bg = document.getElementById('lightfall-bg')!;
    const cv = bg.querySelector('canvas') as HTMLCanvasElement;
    const main = document.querySelector('main') as HTMLElement;
    const before = main.getBoundingClientRect().top;

    // Simulate the stale-stylesheet failure: drop every rule that targets the
    // background container, leaving all other CSS intact.
    let dropped = 0;
    for (const sheet of Array.from(document.styleSheets)) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (let i = rules.length - 1; i >= 0; i--) {
        if ((rules[i] as CSSStyleRule).selectorText?.includes('lightfall-bg')) {
          sheet.deleteRule(i); dropped++;
        }
      }
    }
    document.body.offsetHeight; // force reflow
    return {
      inlineStyle: bg.getAttribute('style'),
      canvasPos: getComputedStyle(cv).position,
      droppedRules: dropped,
      mainTopBefore: before,
      mainTopAfterRulesDropped: main.getBoundingClientRect().top,
      bgPosAfter: getComputedStyle(bg).position,
    };
  });
  console.log(JSON.stringify(r, null, 1));
  expect(r.canvasPos).toBe('absolute');
  expect(r.bgPosAfter).toBe('fixed');
  expect(r.mainTopAfterRulesDropped).toBe(r.mainTopBefore);
});
