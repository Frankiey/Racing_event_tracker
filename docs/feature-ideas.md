# Feature Ideas — RaceTrack

> Brainstormed 2026-03-31. Every idea is grounded in a persona need and respects the project constraints: static site, no backend, no auth, vanilla JS, localStorage only.


---

## 2. ICS Calendar Export — "Add to My Calendar"

**Persona:** Sofía + Marco
**Pain:** Timezone confusion, switching between apps, manual tracking

Let users export events (or their entire watchlist) as `.ics` files they can import into Google Calendar, Apple Calendar, Outlook, etc.

**What it looks like:**
- "Add to calendar" button on the EventModal — downloads a single `.ics` file with the race session time
- "Export watchlist" button on `/watchlist` — downloads an `.ics` with all favorited events
- Per-series "Subscribe" link on `/series/[id]` — downloads the full series schedule as one `.ics`

**Scope:** Pure client-side. Generate `.ics` blobs in the browser from event data already on the page. No server needed.



## 8. Where to Watch — Broadcast Guide

**Persona:** All (already in worknotes as planned feature)
**Pain:** "Where is this race airing?"

Show broadcast/streaming info per event per region. Start with 3 regions: NL, US, UK.

**What it looks like:**
- A "Where to watch" section in the EventModal showing channel/service per region
- Region selector (saved to `localStorage`) to show only the user's relevant broadcasts
- Small TV icon on EventCards indicating broadcast info is available
- Data lives in `data/gold/broadcasts.json` (seed / manual curation)

**Scope:** New seed data file. Frontend rendering in modal + card indicator. No API needed.

---

## 9. PWA + Home Screen Install

**Persona:** Priya (Mobile Glancer)
**Pain:** "This is a mobile-first experience for her" — but it's still a website

Turn RaceTrack into a Progressive Web App so Priya can add it to her home screen and get an app-like experience.

**What it looks like:**
- `manifest.json` with app name, icons, theme color, `display: standalone`
- Service worker for offline caching of the last-fetched data (static JSON)
- Install prompt on mobile browsers
- App launches full-screen without browser chrome
- Works offline with stale data + a "Data may be outdated" banner

**Scope:** Astro generates static files — the service worker just caches them. No backend. Offline = stale-but-usable.

---

## 11. Live Session Indicator — "It's Happening Now"

**Persona:** All
**Pain:** No way to know if a session is currently in progress

When a session's start time has passed but the event hasn't ended, show a live pulse indicator.

**What it looks like:**
- Green pulsing dot + "LIVE" badge on cards where a session is currently running
- Dashboard hero countdown flips to "IN PROGRESS" with elapsed time
- Kiosk page gets a dramatically different color treatment when live (more intense glow)
- Uses estimated session durations per type: Race ≈ 2h, FP ≈ 1h, Quali ≈ 1h

**Scope:** Client-side time comparison. Need to add estimated session durations to the data schema or hardcode reasonable defaults per session type.

---

## 12. Session Alerts — Browser Notifications

**Persona:** Marco (Dedicated Fan)
**Pain:** "Woken up at 3am for a race that starts at 5am"

Optional browser notification reminders before sessions start. Set per-event or globally.

**What it looks like:**
- "Remind me" button on EventModal → asks for notification permission
- Options: 15min, 30min, 1hr before session
- Uses `Notification API` + `setTimeout` (or service worker timers for PWA)
- Stored in `localStorage` as scheduled alerts
- Works even when the tab is in the background (if notification permission granted)

**Scope:** Browser Notification API — no server push needed. Service worker can handle timers more reliably if PWA is implemented.

---

## 14. Season Stats Dashboard — Year in Numbers

**Persona:** Marco + Sofía
**Pain:** No season-level summary or stats

A small section on the dashboard or a dedicated panel showing season-level stats across all tracked series.

**What it looks like:**
- Total events this season: **239** across **15 series**
- Events so far: **47** | Coming up: **192**
- Busiest month: **June (28 events)**
- Busiest weekend: **Jun 13-14 (6 series racing)**
- Countries visited: **32** (with flag row)
- Donut chart or bar showing events per series

**Scope:** All computed at build time from `calendar.json`. No runtime cost.


---

---

## 15. Clash Detector — "The Weekend From Hell"

**Persona:** Sofía (Multi-series tracker)
**Pain:** Three series race the same weekend and she misses sessions she cared about

Surface weekends where multiple series overlap so fans can plan ahead (or brace for chaos).

**What it looks like:**
- A "Clash" badge on the calendar whenever 3+ series share a weekend
- Dedicated "Clashes" section on the dashboard: _"6 series racing Jun 13–15"_ with a mini grid
- Hovering a clash shows which series are racing and what sessions overlap
- Optional: "Clash score" — a 1-5 chili pepper rating based on how many big sessions land in the same 3-hour window

**Scope:** Pure build-time computation from `calendar.json`. Zero runtime cost, no API, just smart date overlap logic.

---

## 16. Circuit Passport — "Been There, Raced That"

**Persona:** Marco (Dedicated Fan)
**Pain:** No way to explore the venues; every event is just text

An interactive circuit map where fans can browse the world map and click circuits to see all upcoming races there.

**What it looks like:**
- World SVG map (or lightweight Leaflet.js) on `/circuits` page — dot per circuit, colored by series
- Click a dot → popover showing circuit name, flag, upcoming events, lap record holder
- "I've been there" toggle — mark circuits you've attended in person (saved to localStorage)
- Circuits with races in the next 30 days pulsing to draw the eye

**Scope:** Static SVG world map + circuit lat/lng already in the data. Leaflet.js is ~42kb. No backend.

---

## 17. Countdown Sticker — Embeddable Widget

**Persona:** Everyone
**Pain:** "I want to show my friends when the next F1 race is"

A minimal embeddable countdown card for any series — shareable as a link that shows a live countdown.

**What it looks like:**
- `/widget/f1` renders a stripped-down page: series color, event name, countdown timer, nothing else
- Designed to be screenshot-able and share-worthy
- URL params: `?series=motogp&bg=dark` — lightweight customisation
- Zero JS if countdown already expired (just shows "Race weekend!" static text)

**Scope:** New Astro static route, reuses existing event data. Basically a mini status page per series.

---

## 18. "What Did I Miss?" Recap Roll

**Persona:** Priya (Casual Viewer)
**Pain:** Looks at the app on Monday morning after a busy weekend, has no idea what ran

A weekly digest view showing events from the past 7 days: what series ran, what the session results looked like at a glance (no spoilers until you tap).

**What it looks like:**
- `/recap` page or collapsible "Last week" section on the dashboard
- Cards showing completed events with a **spoiler-free toggle** — blurs session names/results until tapped
- "🏁 4 series raced this weekend" summary header
- Optional: share button that generates a plain-text recap (no images, just emoji + text)

**Scope:** Client-side date math on completed events. Spoiler toggle is just a CSS blur + click handler. No data beyond what's already there.

---

## 19. Sleep Calculator — "Can I Even Watch This?"

**Persona:** Priya + Marco
**Pain:** A race starts at 3am local time — is it worth setting an alarm, or just watching the replay?

Show the user their local start time with a human-readable sleep verdict.

**What it looks like:**
- On every session row in the modal: a tiny badge that says _"3:14 AM · 😴 Rough one"_ or _"18:00 · ✅ Prime time"_ or _"23:45 · ⚠️ Late night"_
- Thresholds: 06:00–22:00 = prime, 22:00–00:30 = late, 00:30–05:30 = rough, 05:30–06:00 = early bird
- Color-coded: green / amber / red
- Toggle off in settings if you hate fun

**Scope:** Pure client-side local time math. Already hydrating session times — add one comparison step.

---

## 20. Series Heatmap — "When Is It Busy?"

**Persona:** Sofía
**Pain:** "I just need to know which months are insane and which are dead"

A GitHub-style contribution heatmap for the full season — one square per day, colored by race density.

**What it looks like:**
- `/calendar` gets a heatmap strip above the monthly calendar grid
- Each day = 1 square, color intensity = number of sessions that day (0 = dark, 5+ = bright series color)
- Hover shows "3 sessions on Apr 12: F1 Quali, MotoGP Race, IndyCar Race"
- Months labeled below; today highlighted

**Scope:** Build-time data is already a day-indexed map (dateIndex in calendar.astro). Render the heatmap with inline SVG or a simple grid div layout. No new data needed.

---

## 21. Fan Mood Board — Hype Meter

**Persona:** Everyone (engagement / fun)
**Pain:** The app is purely functional, no emotional hook

Before each race weekend, show a "hype meter" — a community-free, personal version where *you* rate your own excitement level.

**What it looks like:**
- On the EventModal: five emoji reaction buttons (😴 → 🤩) below the session list
- Your reaction saved to localStorage per event ID
- Dashboard shows your most-hyped upcoming event with a highlight ring
- `/watchlist` shows your mood for each saved event
- After the event: button flips to a "Was it worth it?" 👎👍 — rate the race from memory

**Scope:** All localStorage. No votes sent anywhere, no social component — purely personal. Zero backend.

---

## 22. Series Rivalry Tracker

**Persona:** Marco
**Pain:** "F1 and MotoGP always seem to clash — is it intentional?"

Track head-to-head scheduling conflicts between specific pairs of series over the full season.

**What it looks like:**
- On each series page `/series/f1`: a "Clashes with" row showing how many weekends overlap with each other series and which ones
- A rivalry card: _"F1 vs MotoGP — 6 weekends clash this season. Biggest clash: Sep 19–21 (Italian GP + Misano)"_
- Simple bar: out of 24 F1 weekends, 6 clash = 25% blocked for MotoGP fans

**Scope:** Build-time computation. Two nested date-range overlap loops. Results baked into the series page at build time.

---

## 23. Time Zone Buddy — "Watch Together"

**Persona:** Sofía + friends in different countries
**Pain:** Coordinating with friends across time zones ("What time is it for you?")

A shareable event link that shows session times in multiple time zones simultaneously.

**What it looks like:**
- EventModal gets a "Time zones" section: user's local time + 2 pinned zones of their choice (e.g. NL + JP)
- Pin zones saved to localStorage
- Shareable URL: `/?event=f1-2026-r05&tz=Europe/Amsterdam,Asia/Tokyo` — the recipient sees the same multi-zone view
- Zones searched via a simple text input (filters a bundled IANA timezone list)

**Scope:** `Intl.DateTimeFormat` handles all the conversion — no library needed. IANA timezone list is ~2kb compressed.

---

## What's Deliberately Not Here



- **User accounts / login** — breaks the no-backend constraint
- **Real-time race results** — would need a live data source and server-side processing
- **Social features / comments** — needs a backend
- **Betting odds** — out of scope, ethically complex
- **Video/stream embedding** — copyright minefield
- **Native mobile app** — PWA covers this with zero distribution overhead
- **AI predictions** — cool but doesn't fit the "checker, not oracle" philosophy
