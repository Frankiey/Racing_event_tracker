# Work Notes — RaceTrack

## Current Status
Project scaffolded. No functionality implemented yet.

## Next Steps
1. Initialize Astro project with Tailwind CSS
2. Set up data pipeline scripts for F1 (first series)
3. Build common event schema and silver-layer transform
4. Create basic dashboard page showing upcoming events
5. Add `/status` route for kiosk display

## Open Questions
- Which MotoGP data source is most reliable? Official API access may be limited.
- How to handle endurance race sessions (24h+ duration) in the session schema?
- Broadcast data: start with which regions? NL + US + UK as minimum?
- F2/F3 schedule — is it always co-located with F1 weekends or are there exceptions?

## Decisions Made
- Astro over plain HTML — gives us components, routing, and static build for free
- Medallion architecture for data — bronze/silver/gold layers
- Dark mode as default — primary use case is ambient/status display
- GitHub Pages hosting — free, simple, auto-deploys from main

## Known Limitations
- No real-time updates — data refreshes on cron schedule (nightly)
- Broadcast info must be manually curated per season
- Some series (DTM, IMSA) deferred to later phases
