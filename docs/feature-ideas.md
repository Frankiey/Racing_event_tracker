# Feature Ideas — RaceTrack

> Brainstormed 2026-03-31. Every idea is grounded in a persona need and respects the project constraints: static site, no backend, no auth, vanilla JS, localStorage only.

---

## 1. Clash Radar — Weekend Conflict Map

**Persona:** Sofía (Multi-Series Tracker)
**Pain:** "Clash detection is entirely manual — she keeps a paper calendar"

Show weekends where multiple series overlap, so Sofía can plan screen time and recordings weeks in advance.

**What it looks like:**
- On the calendar page, weekends with 2+ active series get a stacked badge showing which series collide (e.g. `F1 + WEC + Moto2`)
- A dedicated "Busy Weekends" section at the top of the calendar — a compact list of upcoming clash weekends with the series dots and date range
- Clicking a clash weekend scrolls to that weekend and highlights all overlapping events
- Filterable: only show clashes for *her* active series filter, not all 15

**Scope:** Frontend only. All data is already in `calendar.json` — just group by `dateStart`/`dateEnd` overlap.

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

---

## 3. Race-Only Mode — "Just Tell Me When the Race Is"

**Persona:** James (Casual Viewer)
**Pain:** "Too much detail (all sessions listed) makes it hard to find the race"

A toggle that collapses everything except the main race session on event cards. FP1/FP2/FP3/Quali disappear. Just the flag, event name, race day, and race time.

**What it looks like:**
- A small toggle/icon in the dashboard header: "All sessions" ↔ "Race only"
- When active, EventCards show only the Race session row — cleaner, faster to scan
- Preference saved to `localStorage` so it persists
- Inactive by default (power users like Marco want all sessions)

**Scope:** CSS visibility toggle on session rows, similar to the existing series filter. One `localStorage` key.

---

## 4. This Weekend — Zero-Scroll Answer

**Persona:** James + Priya (Casual Viewer + Mobile Glancer)
**Pain:** "Is there a race this weekend?"

A prominent, always-visible block at the top of the dashboard that directly answers: "Yes, here's what's on" or "No races this weekend. Next up: [event] in [X days]."

**What it looks like:**
- When races are happening this weekend: a full-width card showing all series racing this weekend with their race times in local time
- When it's a quiet weekend: a calm "No races this weekend" message with a mini-countdown to the next event
- Designed to be the entire answer for James in under 3 seconds

**Scope:** Already have all the data in `upcoming.json`. Just a new component that filters on the current week.

---

## 5. Race Weekend Timeline — Visual Session Strip

**Persona:** Marco (Dedicated Fan)
**Pain:** Session list is scannable but not spatial — hard to feel the rhythm of a weekend

Replace the plain session list in the EventModal with a visual horizontal timeline showing all sessions laid out across Friday → Saturday → Sunday.

**What it looks like:**
- Horizontal bar split into 3 days (or 2 for short weekends)
- Color-coded blocks placed at their actual time positions (proportional spacing)
- Session labels inside blocks: `FP1`, `Q`, `Race`
- Current time marker (thin red line) so you can see where you are in the weekend
- Works for endurance events too — WEC 24h block would visually span the full bar

**Scope:** Client-side component in the modal. Data already has `startTimeUTC` for each session.

---

## 6. Series Passport — Season Journey Visualization

**Persona:** Marco + Sofía
**Pain:** Season progress bar exists but doesn't tell a story

A world map dot visualization on each series page showing the season route — circuits connected by lines, visited ones filled, upcoming ones hollow. A visual "passport" of the season journey.

**What it looks like:**
- Compact SVG world map with dots at each circuit's `lat`/`lng` coordinates
- Dots colored in the series color, with a subtle connecting line following the calendar order
- Past rounds: filled dots. Next race: pulsing dot. Future: hollow dots
- Hovering a dot shows the event name and date
- Totally static at build time — no map tile APIs needed

**Scope:** All circuit coordinates are already in the event schema (`lat`/`lng`). Generate an SVG at build time with Astro.

---

## 7. My Racing Week — Personalized Weekly Digest

**Persona:** Sofía + Priya
**Pain:** Calendar shows everything; watchlist is a flat list

A dynamic "My Week" view that shows only the events you care about, laid out as a 7-day strip. Like a personal race agenda.

**What it looks like:**
- Horizontal or vertical day strip: Mon → Sun
- Shows only events from series the user has filtered to, or events in their watchlist
- Each day cell shows session pills with local times: `FP1 10:30`, `Race 15:00`
- Empty days show nothing (no noise)
- Swipeable on mobile (next week / prev week)

**Scope:** Client-side. Combines watchlist (from `localStorage`) with series filter preference. Data already available.

---

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

## 10. Share Event — Quick Social Sharing

**Persona:** Priya + Marco
**Pain:** Telling friends "the race is at 3pm local"

One-tap share button using the Web Share API (native on mobile) or clipboard fallback on desktop. Shares a formatted text snippet.

**What it looks like:**
- Share button on EventModal and EventCard
- Uses `navigator.share()` on mobile for native share sheet
- Fallback: copies a text snippet to clipboard on desktop
- Snippet: `🏁 Monaco Grand Prix — Race: Sun May 24, 3:00 PM (your time) — racetrack.app/calendar`

**Scope:** A few lines of JS. Web Share API is well-supported on mobile.

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

## 13. Timezone Buddy — "What Time Is It There?"

**Persona:** Marco + Sofía
**Pain:** Timezone confusion across global circuits

Show both the user's local time AND the circuit's local time for each session. Useful to understand the atmosphere — "it's a night race" vs. "it's afternoon there."

**What it looks like:**
- In EventModal, each session row shows: `Your time: 3:00 PM` / `Track time: 9:00 PM (SGT)`
- Small sun/moon icon indicating day/night at the circuit
- Uses the circuit's `lat`/`lng` to estimate the timezone (or add a `timezone` field to the schema)

**Scope:** Need to add timezone data to circuits. Can calculate from coordinates using a small timezone lookup library client-side, or just add `timezone: "Asia/Singapore"` to the seed/schema.

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

## 15. Dark/Light Theme Toggle

**Persona:** Priya + James
**Pain:** Dark mode is great in the evening, but Priya checks during her morning commute in bright sunlight

Add a theme toggle that respects `prefers-color-scheme` by default but lets users override.

**What it looks like:**
- Small sun/moon toggle in the Nav
- Default: follow system preference
- Override saved to `localStorage`
- Light theme: white backgrounds, darker text, adjusted series colors for contrast

**Scope:** Tailwind v4 dark mode utilities + a CSS class toggle on `<html>`. Series colors may need lighter variants.

---

## Priority Matrix

| # | Feature | Effort | Impact | Persona(s) |
|---|---------|--------|--------|-------------|
| 4 | This Weekend | S | High | James, Priya |
| 3 | Race-Only Mode | S | High | James |
| 11 | Live Indicator | S | High | All |
| 10 | Share Event | S | Medium | Priya, Marco |
| 1 | Clash Radar | M | High | Sofía |
| 2 | ICS Export | M | High | Sofía, Marco |
| 14 | Season Stats | S | Medium | Marco, Sofía |
| 8 | Where to Watch | M | High | All |
| 13 | Timezone Buddy | S | Medium | Marco, Sofía |
| 5 | Weekend Timeline | M | Medium | Marco |
| 9 | PWA Install | M | High | Priya |
| 12 | Session Alerts | M | Medium | Marco |
| 7 | My Racing Week | M | Medium | Sofía, Priya |
| 15 | Light Theme | M | Low | Priya, James |
| 6 | Series Passport | L | Medium | Marco, Sofía |

> **S** = a few hours, **M** = 1-2 sessions, **L** = multi-session project

---

## What's Deliberately Not Here

- **User accounts / login** — breaks the no-backend constraint
- **Real-time race results** — would need a live data source and server-side processing
- **Social features / comments** — needs a backend
- **Betting odds** — out of scope, ethically complex
- **Video/stream embedding** — copyright minefield
- **Native mobile app** — PWA covers this with zero distribution overhead
- **AI predictions** — cool but doesn't fit the "checker, not oracle" philosophy
