# Feature Ideas — RaceTrack

> Brainstormed 2026-03-31, expanded 2026-04-02. Every idea is grounded in a persona need and respects the project constraints: static site, no backend, no auth, localStorage only.

---

## The Big Creative Dump

Organized by vibe. Complexity noted per idea. None require a backend.

---

### 🌌 COSMOS LAYER — "Race Weekend as a Universe"

#### Star Map Calendar
The season rendered as a galaxy. Each race weekend = a star, sized by session count, colored by series. Zoom in on a star to see the event. Use SVG + a simple force-layout so events don't overlap. Clusters form naturally around triple-headers and flyaway swarms. The current date is a slow-moving "you are here" comet.
- Complexity: medium-high (SVG layout math)
- Value: utterly unlike any other racing site

#### Dead Stars — Past Race Archaeology
Past races don't disappear, they *collapse*. A faded, low-opacity "dead star" ring remains on the calendar, clickable to pull up the session times and a "this was X days ago" label. The season is a graveyard of spent energy — which is correct, actually.
- Complexity: low (CSS + date comparison)
- Value: gives the calendar depth, satisfies the "how long ago was Bahrain?" curiosity

#### Series Phase Moon
Each series gets a moon-phase icon next to its badge showing how far through the season it is. 0% = new moon (season hasn't started), 50% = half moon (mid-season), 100% = full moon (champion crowned). Calculated from first/last round dates. No backend needed — all computable from `calendar.json`.
- Complexity: low
- Value: instant season-progress at a glance without reading numbers

#### Orbital Session View
Inside the EventModal, render the weekend sessions as orbiting bodies around a central "race day" planet. Practice = outer slow orbit, Qualifying = closer, Race = tight inner ring. Animate with CSS `@keyframes`. Pure delight for no engineering cost.
- Complexity: low (CSS animation)
- Value: transforms a boring session list into something people screenshot

---

### 🌊 TIME & TIMEZONE WIZARDRY

#### Sleep Verdict 2.0
The existing `sleepVerdict()` in `client-utils.ts` returns a string. Surface it properly: a prominent "Should you stay up?" panel on the dashboard. Show the local start time big and bold, a traffic-light indicator (green = civilized hour, amber = late but doable, red = 3am please don't), and a "Set alarm" button that fires a Web Notification API reminder 10 minutes before the session.
- Complexity: low-medium (Notifications API, already have the logic)
- Value: solves the #1 casual fan problem

#### Circuit Sunrise/Sunset Badge
For every session, calculate whether it'll be daylight or night at the *circuit* using the circuit's lat/lng (already in the data) and the session UTC time. A tiny ☀️ or 🌙 next to the session time. Singapore night race looks different from Monaco afternoon. Pure client-side math — no API.
- Complexity: medium (solar position formula, but well-documented)
- Value: genuinely useful for broadcast quality expectations

#### Time Bubble Overlap
A small visual in EventModal: two overlapping circles (Venn diagram style). Left = your timezone, right = circuit timezone. The overlap area is "shared daylight." Instantly shows why some races feel brutal.
- Complexity: low (SVG math)
- Value: beautiful and immediately readable

#### Binge-Watch Calculator
"If you watched every session this season back-to-back, how long would it take?" Computed from session durations in `calendar.json`. Displayed as a fun stat: `1 year, 3 months, 12 days of uninterrupted racing`. Update it dynamically as more data arrives. Put it on the `/status` kiosk view as an ambient number.
- Complexity: low
- Value: pure delight, absurd in a good way

---

### 🗺️ CARTOGRAPHY

#### Spinning Globe Circuit Map
A WebGL-free, pure-SVG world map where circuits light up as the season progresses. Completed circuits glow warm amber. Upcoming circuits pulse gently. Clicking a dot opens the EventModal. Use a simple equirectangular projection — circuit lat/lng already exists in the data.
- Complexity: medium (SVG world map, projection math)
- Value: the "world tour" perspective that circuit lists never convey

#### Mountain Range Elevation View
A horizontal cross-section view: circuits laid out left-to-right by date, their altitude used as the Y position. Monaco (0m) sits in a valley, Mexico City (2285m) towers above. The race schedule as a mountain range. Decorative but genuinely informative.
- Complexity: low (needs altitude data per circuit — one-time manual addition)
- Value: novel enough to get shared

#### "Quiet Weekend" Radar
Scan the calendar and surface weekends with zero scheduled sessions. Rare, precious, sacred. Display them as blank white squares in the calendar heatmap with the label "touch grass." A small act of care for the fan who schedules their life around racing.
- Complexity: low
- Value: practical + funny

---

### 🎰 DISCOVERY & SERENDIPITY

#### Series Roulette
A big "I DON'T KNOW WHAT TO WATCH" button. Spins through upcoming events across all series and lands on one at random, weighted toward series the user has favorited. Reveals with a slot-machine animation. Single `Math.random()` call.
- Complexity: low
- Value: solves decision paralysis, shareable

#### "What's On Right Now" Pulse
A persistent thin bar at the very top of every page. If any session is live (within its window), it glows red and names the series + session. If something starts in under 2 hours, it pulses amber. Otherwise it's invisible. Uses `isSessionLive()` already in `client-utils.ts`. No backend — just client clock vs session times.
- Complexity: low (already have the logic)
- Value: transforms the site into a live dashboard feel

#### Clash Constellation
The existing clash detector shows conflicts as a list. Upgrade: render conflicting events as two stars connected by a crackling arc. Multiple clashes in a weekend form a constellation. Visual metaphor for the brutal reality of triple-header season calendars.
- Complexity: medium
- Value: makes the clash detector worth visiting

#### "Ghost Lap" Season Density Compare
A thin overlay toggle on the calendar: show 2025 session density as a ghost (dashed, low-opacity) beneath 2026. Reveals whether this season is more or less packed than last. Needs prior-year data but that's just a second JSON file.
- Complexity: medium (needs historical data, dual-layer rendering)
- Value: satisfies the "is it just me or are there more races this year" question definitively

---

### 🌦️ AMBIENT / CONTEXTUAL LAYERS

#### Live Weather at Circuit
Open-Meteo API is free, requires no auth, supports CORS. For the next upcoming event, fetch current + 7-day forecast for the circuit's lat/lng on page load. Show a tiny weather strip in EventModal: each session gets a temperature + condition icon. Cache in sessionStorage to avoid hammering the API.
- Complexity: medium (Open-Meteo fetch, sessionStorage cache)
- Value: genuinely useful, F1 fans are obsessed with weather

#### Thermal Heatmap on Calendar
The calendar month view gets a subtle background intensity: more sessions in a day = deeper color. Like a GitHub contributions graph but for race weekends. Built purely from `calendar.json` counts. Shows at a glance that March is chaos and August is desert.
- Complexity: low
- Value: beautiful, scannable

#### Series Momentum Pulse
A horizontal bar per series on the dashboard: how many events in the last 14 days vs next 14 days. A series with 3 recent + 2 upcoming is "hot." One with 0 recent + 5 upcoming is "launching." Calculated from `upcoming.json` + past events. No API.
- Complexity: low
- Value: answers "what's happening in motorsport right now overall"

#### Confetti on Race Day
When the user opens the app and the next event starts within 24 hours: a single burst of confetti in the series color. One time per event (tracked in localStorage). 30 particles, 2-second animation, never shown again for that event. Pure joy with zero data dependency.
- Complexity: low (canvas confetti or CSS keyframes)
- Value: makes the app feel alive on the days it matters most

---

### 📡 SHARING & EXPORT

#### ICS Export with Emoji
The current ICS export works. Make it better: prefix event titles with series emoji (🔴 F1, 🟠 MotoGP, 🟡 IndyCar) so they're scannable in calendar apps. Add the circuit name, session type, and a `DESCRIPTION` field with the broadcast channels from `broadcasts.json`. Zero new infrastructure.
- Complexity: low (modify `ics.ts`)
- Value: the ICS export is already there — this just makes it delightful

#### "This Weekend in Racing" Share Card
A button that generates a `<canvas>` image: this weekend's sessions, series colors, session times in the user's timezone. One-tap download as PNG. Designed for story-sized (9:16) posting. No server — all client-side canvas rendering.
- Complexity: medium-high (canvas layout code)
- Value: organic social sharing, the site's logo in every post

#### Deep Link to Moment
Clicking "Share" on an EventModal already works. Extend it: allow linking to a *specific session* within an event (`#event-id?session=race`). The modal opens and auto-scrolls to that session row and highlights it. Purely URL hash logic.
- Complexity: low (hash parsing + DOM scroll)
- Value: "hey watch this specific session" sharing is much more specific than "look at this event"

---

### 🧠 PERSONALIZATION (localStorage-only)

#### "My Series" Quick Filter
Let users pin their 2–3 series to a persistent top strip. Stored in localStorage as `rt-pinned-series`. The dashboard shows pinned-series events first, everything else below a soft divider. No account needed.
- Complexity: low
- Value: the multi-series fan's biggest UX pain is "where's my series in all this noise"

#### Viewing History
Track which events the user has clicked into (EventModal opens = viewed) in localStorage as `rt-viewed`. Add a subtle "seen" dot to EventCard. On the Watchlist page, show a "Previously browsed" section. Fully client-side, never transmitted anywhere.
- Complexity: low
- Value: "I swear I looked at this race before" — now they can confirm it

#### Personal Timezone Override
Let users set a preferred timezone in localStorage (`rt-tz`), separate from their system clock. Useful for travelers or fans who want to see times in "home" tz while abroad. A small ⚙️ in the corner of any time display to toggle between local/override.
- Complexity: medium (thread override through all LocalTime hydration)
- Value: solves a real pain for fans who travel to watch races live

---

## What's Deliberately Not Here



- **User accounts / login** — breaks the no-backend constraint
- **Real-time race results** — would need a live data source and server-side processing
- **Social features / comments** — needs a backend
- **Betting odds** — out of scope, ethically complex
- **Video/stream embedding** — copyright minefield
- **Native mobile app** — PWA covers this with zero distribution overhead
- **AI predictions** — cool but doesn't fit the "checker, not oracle" philosophy
