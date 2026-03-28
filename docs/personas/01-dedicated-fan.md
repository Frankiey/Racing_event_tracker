# Persona: The Dedicated Fan

**Name:** Marco
**Age:** 28
**Occupation:** Software developer
**Primary series:** Formula 1 (every session), MotoGP (race only)

## About

Marco has followed F1 since he was 12. He watches every practice, quali, and race live or same-day on replay. He knows the tyre compounds, race strategies, and team radio transcripts. MotoGP is a secondary interest — he'll catch the main race but doesn't chase qualifying.

## Goals

- Know exactly **when** every F1 session starts in his local timezone
- Never accidentally miss a session because of a timezone confusion
- Track how many rounds are left in the season
- Save key non-F1 events to his watchlist so they show up as reminders

## Pain Points

- Timezone conversions are error-prone — he's woken up at 3am for a race that starts at 5am
- Most calendars show only the main race, not all sessions
- Switching between browser tabs / apps to check different series is annoying

## How He Uses RaceTrack

- Opens dashboard on Friday morning to check the weekend session times
- Scrolls to "next up" hero on the dashboard for a quick countdown
- Uses the series page for F1 to see season progress and upcoming rounds
- Puts 2–3 MotoGP races per season on his watchlist

## Design Implications

- Session-level time accuracy is critical — local time conversion must be rock-solid
- Session list on cards must be scannable (FP1/FP2/FP3/Quali/Race, clearly labeled)
- Countdown timer on dashboard is highly valued
- Progress bar on series page ("7 of 24 rounds") is important context
