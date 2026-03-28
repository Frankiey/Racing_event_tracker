# Kiosk Redesign — `/status`

> **Status:** Design draft — not yet implemented
> **Goal:** Turn the current placeholder into a purpose-built ambient display fit for TVs, bar screens, and waiting rooms.

---

## What We Have Now

The current `/status` page is a thin shell:

- Centered, narrow column (`max-w-md`) — wastes 80% of a TV screen
- Title "RaceTrack" in small zinc-400 text
- One countdown (days:hrs:min:sec) for the next race
- 4 upcoming events as plain list rows with date ranges
- Hard reload every 5 minutes
- No sense of urgency, no live detection, no series color personality

It's functional but reads more like a fallback than a destination.

---

## Target Use Cases

| Context | Screen | Key Needs |
|---|---|---|
| Bar / pub TV | 1080p 55" wall-mounted | Legible at 5m, no interaction |
| Home office ambient | 27" monitor | Dense info, secondary display |
| Race van / workshop | iPad landscape | Touch-friendly, bright |
| Phone ambient | iPhone landscape | Clock + countdown, minimal |

The design must work across all four without layout breakage.

---

## Visual Identity

This is the most important section. The kiosk should feel like a race control room display — cinematic, high contrast, authoritative. Not a widget. Not a web page that forgot to grow up.

### The Aesthetic

**Reference feeling:** F1 TV's "session starts in" full-screen card × Bloomberg terminal density × a dark cinema before the race begins.

Key principles:
- **Darkness with intent.** `bg-zinc-950` base with deliberate pockets of light — not dark-mode-by-default but *designed for dark*.
- **Series color as personality.** Each series bleeds its color into the screen. F1 red. MotoGP crimson. IndyCar navy. The color owns the moment.
- **Numbers that fill the room.** The countdown should be readable from across a bar. Not decorative — functional.
- **Stillness punctuated by motion.** The page is calm and static except for the clock ticking and the live pulse. No carousels, no fades, no spinning logos.

### Color Theming

The entire hero section responds to which series is "up next." Series color flows through:

1. **Background tint** — `rgba(seriesColor, 0.06)` radial gradient from center:
   ```css
   background: radial-gradient(ellipse 80% 60% at 40% 50%, {color}0f 0%, transparent 70%);
   ```
2. **Hero card border** — left border accent, 2px, `{color}60` (37% opacity):
   ```css
   border-left: 2px solid {color}60;
   ```
3. **Countdown digits** — shift from `text-zinc-100` to `text-white` with a subtle text-shadow glow in weekend/live mode:
   ```css
   text-shadow: 0 0 40px {color}80;
   ```
4. **Series badge** — already uses series color via `SeriesBadge.astro`, just render it bigger (`size="lg"` or a new kiosk size)
5. **Glow ring on flag** — in live mode, a blurred `box-shadow` around the flag emoji container:
   ```css
   filter: drop-shadow(0 0 24px {color}90);
   ```

All colors via inline `style=` — never dynamic Tailwind classes (Tailwind v4 limitation).

### Typography Scale

| Element | Classes | Notes |
|---|---|---|
| Countdown digits | `font-mono font-black tabular-nums` + `clamp(4rem, 12vw, 9rem)` via style | Scale with viewport |
| Countdown labels | `text-xs uppercase tracking-[0.2em] text-zinc-500` | Extreme tracking for "DAYS HRS MIN SEC" |
| Countdown separator `:` | `text-zinc-700` at ~60% the digit size | Self-start, slight top margin |
| Event name | `text-3xl sm:text-4xl lg:text-5xl font-bold` | Truncate at 2 lines |
| Circuit name | `text-base text-zinc-400` | |
| Round / series info | `text-sm text-zinc-500` | "Round 8 of 24" |
| Sidebar event name | `text-sm font-medium` | |
| Clock | `text-sm font-mono tabular-nums text-zinc-600` | Corner, unobtrusive |
| "LIVE NOW" | `text-lg font-bold uppercase tracking-widest text-white` | Accompanied by pulse dot |

### The Racing Stripe

The existing 3px top stripe in `global.css` stays. In kiosk mode (bare layout), it's the only site chrome — which actually makes it look intentional and sharp.

### Session Strip Styling

Each session pill:
```
┌─────────────────┐   ┌─────────────────┐   ┌═════════════════╗   ┌─────────────────┐
│ FP1             │   │ FP2             │   ║ QUALIFYING      ║   │ RACE            │
│ Thu 10:30       │   │ Thu 14:00       │   ║ Fri 15:00       ║   │ Sun 13:00       │
│ (muted/done)    │   │ (muted/done)    │   ║ ← NEXT (accent) ║   │ (upcoming)      │
└─────────────────┘   └─────────────────┘   └═════════════════╝   └─────────────────┘
```

- Past: `bg-zinc-900 border-zinc-800 text-zinc-600 line-through`
- Next: `bg-zinc-900 text-zinc-100 border-[seriesColor]` with a subtle left-side bar `border-l-2`
- Future: `bg-zinc-900/60 border-zinc-800 text-zinc-300`

### Live Mode Visual

Full-screen. No sidebar. The series color takes over.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  (radial glow from series color, very low opacity, ~8%)                 │
│                                                                         │
│  ● LIVE NOW                        🇲🇨                                  │
│                                                                         │
│  ┌── F1 ──────────────────────────────────────────────────────────┐    │
│  │                                                                 │    │
│  │  Monaco Grand Prix — Qualifying                                 │    │
│  │  Circuit de Monaco · Monaco                                     │    │
│  │                                                                 │    │
│  │  Started 47 min ago                                             │    │
│  │                                                                 │    │
│  └─────────────────────────────────────────────────────────────── ┘    │
│                                                                         │
│                                              16:47  Sat 28 Mar          │
└─────────────────────────────────────────────────────────────────────────┘
```

The `● LIVE NOW` dot is pure CSS pulse (no JS). The card has `border-left: 3px solid {seriesColor}`.

### Animations

```css
/* Live dot pulse */
@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.3; transform: scale(0.7); }
}
.kiosk-live-dot {
  animation: live-pulse 1.2s ease-in-out infinite;
}

/* Mode transition — fade between idle/weekend/live */
.kiosk-mode-enter {
  animation: kioskFadeIn 600ms ease both;
}
@keyframes kioskFadeIn {
  from { opacity: 0; transform: scale(0.99); }
  to   { opacity: 1; transform: scale(1); }
}

/* Countdown digit flip on change — subtle */
@keyframes digitTick {
  from { opacity: 0.4; transform: translateY(-3px); }
  to   { opacity: 1;   transform: translateY(0); }
}
.cd-tick { animation: digitTick 120ms ease-out; }
```

Trigger `cd-tick` class on the digit `<span>` whenever the value changes, then remove it after 120ms. Gives a subtle "tick" without a full flip animation that would be distracting on a passive display.

---

## Three Modes

The kiosk switches modes automatically. No user input.

### Mode 1 — Idle (default)

**When:** Next race > 7 days away.

```
┌─────────────────────────────────────────────────────┬──────────────────────────┐
│                                                     │                          │
│  [F1]  🇲🇨                           Round 8 / 24  │  — COMING UP —           │
│                                                     │                          │
│  Monaco Grand Prix                                  │  [MotoGP]  Jerez         │
│  Circuit de Monaco · Monaco                         │  Apr 25–27               │
│                                                     │                          │
│  ── RACE STARTS IN ──                               │  [IndyCar]  Barber       │
│                                                     │  Apr 27                  │
│   12  :  04  :  31  :  08                           │                          │
│  DAYS    HRS   MIN   SEC                            │  [NASCAR]  Talladega     │
│                                                     │  Apr 26                  │
│  [FP1 Thu 10:30] [FP2 Thu 14:00]                   │                          │
│  [QUAL Fri 15:00] [RACE Sun 13:00]                  │  [WEC]  Spa              │
│                                                     │  May 2–3                 │
│                                         ⏱ 14:32     │                          │
└─────────────────────────────────────────────────────┴──────────────────────────┘
```

### Mode 2 — Weekend (next event ≤ 7 days)

**When:** `nextEvent.dateStart` is within 7 days.

Changes from Idle:
- `THIS WEEKEND` pill replaces round number
- Series color tint activates on hero background
- Countdown targets the **next session** (not necessarily the race — could be FP1 tonight)
- Session strip expands to full-width grid with done/next/upcoming states

```
┌─────────────────────────────────────────────────────┬──────────────────────────┐
│                                                     │                          │
│  [F1]  🇲🇨                        ■ THIS WEEKEND   │  — COMING UP —           │
│                                                     │                          │
│  Monaco Grand Prix                                  │  (same sidebar)          │
│  Circuit de Monaco · Monaco                         │                          │
│                                                     │                          │
│  ── QUALIFYING IN ──                                │                          │
│                                                     │                          │
│   00  :  04  :  31  :  08                           │                          │
│  DAYS    HRS   MIN   SEC                            │                          │
│                                                     │                          │
│  ┌──────┐ ┌──────┐ ┌══════════╗ ┌──────┐           │                          │
│  │ FP1  │ │ FP2  │ ║ QUAL     ║ │ RACE │           │                          │
│  │10:30 │ │14:00 │ ║ 15:00    ║ │13:00 │           │                          │
│  │ ✓    │ │ ✓    │ ║ in 4h30m ║ │ Sun  │           │                          │
│  └──────┘ └──────┘ └══════════╝ └──────┘           │                          │
│                                         ⏱ 14:32     │                          │
└─────────────────────────────────────────────────────┴──────────────────────────┘
```

### Mode 3 — Live

**When:** A session started in the past and estimated end time hasn't passed.

Full-screen takeover, sidebar hidden, series color glow active.

If multiple series are live simultaneously, the one with the highest series priority is shown in the hero. The others appear as small `● also live` chips below the event name.

**Priority order:** F1 → F2 → F3 → FE → MotoGP → Moto2 → Moto3 → IndyCar → NASCAR → WEC → IMSA → DTM → NLS → WSBK → SF (matches `order` field in `series.ts`)

---

## Decisions (resolved)

### Grace period after session estimated end

Add a **30-minute grace window** — the page stays in Live mode for 30 minutes beyond the estimated session end. This handles overruns (red flags, rain delays, extra laps) without flipping back to Idle mid-race.

```ts
const GRACE_MS = 30 * 60 * 1000;
const isLive = now >= sessionStart && now < sessionEstimatedEnd + GRACE_MS;
```

### Multiple simultaneous live sessions

Show the highest-priority series (by `series.ts` order, F1 = 1) in the main hero. All other concurrently live sessions render as small chips below the event name:

```
Monaco Grand Prix — Race
● also live: MotoGP · Jerez  ·  IndyCar · Barber
```

Each chip links to nothing (kiosk is non-interactive) but gives context.

### `weekday-time` format for session times

**Decision: extend `LocalTime.astro`.**

This is the correct place — all `data-local-time` hydration lives in one script, runs on load and `astro:after-swap`, and handles edge cases (NaN dates, missing data). Duplicating the hydration logic in status.astro's script would create two separate systems that can drift.

Add `weekday-time` to the format union in `LocalTime.astro`:

```ts
// LocalTime.astro — format options
// 'datetime'     → "Mar 21, 13:00"
// 'date'         → "Mar 21"
// 'time'         → "13:00"
// 'weekday-time' → "Thu 13:00"   ← NEW

if (fmt === 'weekday-time') {
  options.weekday = 'short';
  options.hour = '2-digit';
  options.minute = '2-digit';
}
```

Session strip usage:
```astro
<time data-local-time={session.startTimeUTC} data-format="weekday-time">--</time>
```

This works because `LocalTime.astro`'s `<script>` is a module that Astro deduplicates — adding `<LocalTime>` anywhere on the same page won't double-register the listener. But for session strips rendered directly in `status.astro` without importing `LocalTime.astro`, we need to ensure the hydration script runs. The safest approach: import a dummy `<LocalTime>` somewhere on the page to guarantee the script is included, then use the `data-local-time` attribute directly on `<time>` elements for the strip.

---

## Data Logic

### Event selection

Sort `upcoming.json` by `dateStart` (it's grouped by series — always sort first):

```ts
const sorted = [...upcoming].sort((a, b) => a.dateStart.localeCompare(b.dateStart));
```

Then find the next event with a real (non-placeholder) race session that's in the future — or currently live.

### Mode detection (client-side, runs every 30s)

```js
const SESSION_DURATION_MS = {
  'FP1': 60, 'FP2': 60, 'FP3': 60,
  'Qualifying': 90, 'Sprint Qualifying': 60,
  'Sprint': 45, 'Sprint Race': 45,
  'Race': 120, 'Feature Race': 120,
  'NASCAR Race': 180,
  'MotoGP Race': 60,
  'default': 120,
};

function estimatedEnd(session) {
  if (session.endTimeUTC) return new Date(session.endTimeUTC).getTime();
  const dur = SESSION_DURATION_MS[session.type] ?? SESSION_DURATION_MS.default;
  return new Date(session.startTimeUTC).getTime() + dur * 60_000;
}

const GRACE_MS = 30 * 60_000;

function isSessionLive(session, now) {
  const start = new Date(session.startTimeUTC).getTime();
  return now >= start && now < estimatedEnd(session) + GRACE_MS;
}

function getKioskMode(events, now) {
  // Check all events for live sessions first
  for (const event of events) {
    for (const session of event.sessions) {
      if (!isPlaceholder(session) && isSessionLive(session, now)) {
        return { mode: 'live', event, session };
      }
    }
  }

  const next = getNextEvent(events, now);
  if (!next) return { mode: 'idle', event: null };

  const daysUntil = (new Date(next.dateStart) - now) / 86_400_000;
  if (daysUntil <= 7) return { mode: 'weekend', event: next };

  return { mode: 'idle', event: next };
}
```

### Sidebar upcoming list

8 events, sorted by `dateStart`, skipping the hero event. Simple linear list — no series grouping.

---

## LocalTime.astro changes

The only shared component change required. Add `'weekday-time'` to the format type:

```ts
// Before
type Format = 'datetime' | 'time' | 'date';

// After
type Format = 'datetime' | 'time' | 'date' | 'weekday-time';
```

And in the `options` block:

```ts
if (fmt === 'weekday-time') {
  options.weekday = 'short';
  options.hour = '2-digit';
  options.minute = '2-digit';
}
```

Output: `"Thu 13:00"` in the user's locale with their preferred hour cycle.

---

## global.css additions

```css
/* ── Kiosk: Live dot pulse ── */
@keyframes kiosk-live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.25; transform: scale(0.65); }
}
.kiosk-live-dot {
  animation: kiosk-live-pulse 1.2s ease-in-out infinite;
}

/* ── Kiosk: Mode transition ── */
@keyframes kiosk-fade-in {
  from { opacity: 0; transform: scale(0.99); }
  to   { opacity: 1; transform: scale(1); }
}
.kiosk-mode-enter {
  animation: kiosk-fade-in 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* ── Kiosk: Countdown digit tick ── */
@keyframes kiosk-digit-tick {
  from { opacity: 0.3; transform: translateY(-4px); }
  to   { opacity: 1;   transform: translateY(0); }
}
.kiosk-cd-tick {
  animation: kiosk-digit-tick 100ms ease-out;
}

/* ── Kiosk: Session strip scroll ── */
.kiosk-session-strip {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.kiosk-session-strip::-webkit-scrollbar { display: none; }
```

---

## Auto-Refresh

Replace the hard reload with a fetch-based soft refresh. The page only reloads if data has actually changed — mode transitions (idle → weekend → live) happen in-place via JS.

```js
let cachedFingerprint = null;

async function refreshData() {
  try {
    const base = document.documentElement.dataset.base ?? '';
    const res = await fetch(`${base}/data/gold/upcoming.json`, { cache: 'no-store' });
    const data = await res.json();

    const fingerprint = `${data.length}-${data[0]?.id ?? ''}`;
    if (cachedFingerprint && fingerprint !== cachedFingerprint) {
      location.reload();
      return;
    }
    cachedFingerprint = fingerprint;

    // Re-run mode detection without reload
    updateKioskDisplay(data);
    updateLastRefreshedLabel();
  } catch {
    // Silently fail — stale data is fine for a passive display
  }
}

setInterval(refreshData, 5 * 60_000);
```

Footer: `<span id="kiosk-refreshed" class="text-xs text-zinc-700">Data as of --:--</span>`

---

## Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `< sm` (mobile portrait) | Single column, countdown only, no session strip, no sidebar |
| `sm` landscape | Single column + session strip below countdown |
| `lg` (desktop ≥1024px) | Two columns: hero + sidebar |
| `xl` (TV ≥1280px) | Two columns, sidebar wider, countdown at full clamp size |

```html
<div class="flex flex-col lg:flex-row min-h-screen">
  <section class="flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-12 lg:p-16">
    <!-- Hero -->
  </section>
  <aside class="hidden lg:flex w-72 xl:w-80 shrink-0 border-l border-zinc-800/50 flex-col p-6">
    <!-- Sidebar -->
  </aside>
</div>
```

---

## Implementation Plan

All changes confined to `src/pages/status.astro`, `src/components/LocalTime.astro`, and `src/styles/global.css`. No new pages. No new components (session strip is inline in status.astro — not worth extracting until it's needed elsewhere).

### Phase 1 — Layout & Static Visuals
- [ ] Remove `max-w-md`, implement two-column flex layout
- [ ] Enlarge countdown to `clamp(4rem, 12vw, 9rem)` via style
- [ ] Add country flag, circuit name, round number to hero
- [ ] Apply series color tint to hero (inline `style=`, radial gradient)
- [ ] Add series color left-border on hero card
- [ ] Add live clock (JS, updates every second)
- [ ] Sidebar: 8 upcoming events, sorted by dateStart

### Phase 2 — Session Strip
- [ ] Extend `LocalTime.astro` with `weekday-time` format
- [ ] Render session strip below countdown (filter placeholder sessions server-side)
- [ ] Client JS: mark past sessions muted, highlight next session with series color border

### Phase 3 — Mode Logic
- [ ] Implement `getKioskMode()` client-side
- [ ] Weekend mode: switch countdown target to next session, activate color tint
- [ ] Live mode: hide sidebar, full-screen layout, pulse dot, series glow
- [ ] Multi-live: priority by series order, "also live" chips
- [ ] CSS mode transitions (`kiosk-mode-enter` class)

### Phase 4 — Smart Refresh
- [ ] Replace `setTimeout(reload)` with fetch-based soft refresh
- [ ] Add last-refreshed footer label
- [ ] Test midnight boundary (data rolls over to next day's events)

---

## What This Is NOT

- No authentication, no personalization — always global view
- No broadcast info — `broadcasts.json` doesn't exist yet; Live mode shows placeholder text
- No standings — out of scope
- No interaction — passive display, no click handlers, no modal
- No framework islands — vanilla `<script>` tags only
