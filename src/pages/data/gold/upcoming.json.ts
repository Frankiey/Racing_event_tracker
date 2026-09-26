import upcomingData from '../../../../data/gold/upcoming.json';

// Static endpoint: publishes the gold feed at ${base}/data/gold/upcoming.json
// so the kiosk (/status) can poll `generated` for new deploys.
export const GET = () =>
  new Response(JSON.stringify(upcomingData), {
    headers: { 'Content-Type': 'application/json' },
  });
