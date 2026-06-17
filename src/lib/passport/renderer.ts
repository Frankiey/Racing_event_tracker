import { geoDistance, geoGraticule, geoInterpolate, geoOrthographic, geoPath } from 'd3-geo';
import { timer, type Timer } from 'd3-timer';
import { filterPassportEvents, getFlightRoute } from './state';
import type {
  PassportEvent,
  PassportRenderState,
  PassportSeriesMetaMap,
  ProjectedPassportEvent,
} from './types';

interface PassportRendererOptions {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  land: GeoJSON.GeoJsonObject;
  events: PassportEvent[];
  meta: PassportSeriesMetaMap;
  state: PassportRenderState;
  flightSpeed: number;
  onArrival: (event: PassportEvent) => void;
}

export function createPassportRenderer(options: PassportRendererOptions) {
  const stars = Array.from({ length: 400 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.2 + 0.2,
    a: Math.random() * 0.5 + 0.1,
    speed: Math.random() * 0.003 + 0.001,
    phase: Math.random() * Math.PI * 2,
  }));

  const projection = geoOrthographic()
    .clipAngle(90)
    .precision(0.5);
  const pathGen = geoPath(projection, options.ctx);
  const graticule = geoGraticule().step([20, 20]);
  let loop: Timer | null = null;

  function resize() {
    const rect = options.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (options.canvas.width !== Math.round(rect.width * dpr) || options.canvas.height !== Math.round(rect.height * dpr)) {
      options.canvas.width = Math.round(rect.width * dpr);
      options.canvas.height = Math.round(rect.height * dpr);
      options.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const width = rect.width;
    const height = rect.height;
    const radius = Math.min(width, height) * 0.40 * options.state.scaleFactor;
    projection.translate([width / 2, height / 2]).scale(radius);
    return { width, height, radius };
  }

  function drawRoutes() {
    const filtered = filterPassportEvents(options.events, options.state.activeFilter);
    const bySeries: Record<string, PassportEvent[]> = {};
    for (const event of filtered) {
      if (!bySeries[event.seriesId]) bySeries[event.seriesId] = [];
      bySeries[event.seriesId].push(event);
    }

    for (const [sid, seriesEvents] of Object.entries(bySeries)) {
      const sorted = [...seriesEvents].sort((a, b) => a.round - b.round);
      const color = options.meta[sid]?.color ?? '#71717a';
      for (let index = 0; index < sorted.length - 1; index++) {
        const from = sorted[index];
        const to = sorted[index + 1];
        const line: GeoJSON.Feature = {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [[from.lng, from.lat], [to.lng, to.lat]] },
        };
        options.ctx.beginPath();
        pathGen(line);
        options.ctx.strokeStyle = color + '18';
        options.ctx.lineWidth = 1;
        options.ctx.setLineDash([3, 4]);
        options.ctx.stroke();
        options.ctx.setLineDash([]);
      }
    }
  }

  function drawDots() {
    const filtered = filterPassportEvents(options.events, options.state.activeFilter);
    const projectedDots: ProjectedPassportEvent[] = [];
    const nextRace: Record<string, PassportEvent> = {};

    for (const event of filtered) {
      if (event.isPast) continue;
      if (!nextRace[event.seriesId] || event.dateStart < nextRace[event.seriesId].dateStart) nextRace[event.seriesId] = event;
    }

    for (const event of filtered) {
      const coords: [number, number] = [event.lng, event.lat];
      const distance = geoDistance(coords, [-options.state.currentRotation[0], -options.state.currentRotation[1]]);
      if (distance > Math.PI / 2 + 0.05) continue;
      const pos = projection(coords);
      if (!pos) continue;
      projectedDots.push({ ...event, px: pos[0], py: pos[1], d: distance });
    }

    projectedDots.sort((a, b) => b.d - a.d);
    options.state.projectedDots = projectedDots;

    for (const event of projectedDots) {
      const color = options.meta[event.seriesId]?.color ?? '#71717a';
      const isNext = nextRace[event.seriesId]?.id === event.id;
      const isHovered = options.state.hoveredEvent?.id === event.id;
      const isSelected = options.state.selectedEvent?.id === event.id;
      const dotR = isHovered || isSelected ? 7 : isNext ? 6 : 4;

      options.ctx.shadowColor = 'rgba(0,0,0,0.5)';
      options.ctx.shadowBlur = 3;
      options.ctx.shadowOffsetX = 1;
      options.ctx.shadowOffsetY = 1;

      if (event.isPast) {
        options.ctx.beginPath();
        options.ctx.arc(event.px, event.py, dotR, 0, Math.PI * 2);
        options.ctx.fillStyle = color + '90';
        options.ctx.fill();
      } else if (isNext) {
        const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
        options.ctx.shadowColor = color;
        options.ctx.shadowBlur = 15;
        options.ctx.beginPath();
        options.ctx.arc(event.px, event.py, dotR + 5, 0, Math.PI * 2);
        options.ctx.fillStyle = color + Math.round(pulse * 35).toString(16).padStart(2, '0');
        options.ctx.fill();
        options.ctx.beginPath();
        options.ctx.arc(event.px, event.py, dotR, 0, Math.PI * 2);
        options.ctx.fillStyle = color;
        options.ctx.fill();
        options.ctx.strokeStyle = '#ffffff';
        options.ctx.lineWidth = 1.5;
        options.ctx.stroke();
      } else {
        options.ctx.beginPath();
        options.ctx.arc(event.px, event.py, dotR, 0, Math.PI * 2);
        options.ctx.strokeStyle = color + '80';
        options.ctx.lineWidth = 1.5;
        options.ctx.stroke();
      }

      options.ctx.shadowColor = 'transparent';
      options.ctx.shadowBlur = 0;
      options.ctx.shadowOffsetX = 0;
      options.ctx.shadowOffsetY = 0;

      if (isHovered || isSelected) {
        options.ctx.beginPath();
        options.ctx.arc(event.px, event.py, dotR + 3, 0, Math.PI * 2);
        options.ctx.strokeStyle = '#ffffff';
        options.ctx.lineWidth = 1;
        options.ctx.setLineDash([2, 2]);
        options.ctx.stroke();
        options.ctx.setLineDash([]);
      }
    }
  }

  function drawFlightAnimation() {
    if (!options.state.flightActive) return;
    const route = getFlightRoute(options.events, options.state.flightSeries);
    if (route.length < 2) return;

    const segCount = route.length - 1;
    const segIndex = Math.min(Math.floor(options.state.flightProgress), segCount - 1);
    const segT = options.state.flightProgress - segIndex;

    for (let index = 0; index <= segIndex; index++) {
      const from = route[index];
      const to = route[index + 1];
      if (!to) break;
      const isCurrent = index === segIndex;
      const drawT = isCurrent ? segT : 1;
      const interp = geoInterpolate([from.lng, from.lat], [to.lng, to.lat]);
      const pts: [number, number][] = [];
      const nPts = 60;
      for (let point = 0; point <= Math.floor(nPts * drawT); point++) {
        pts.push(interp(point / nPts) as [number, number]);
      }
      if (isCurrent && pts.length > 0) pts.push(interp(drawT) as [number, number]);
      if (pts.length < 2) continue;
      const line: GeoJSON.Feature = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts } };
      const alpha = isCurrent ? 'cc' : '55';
      const flightColor = options.meta[options.state.flightSeries]?.color ?? '#e10600';
      options.ctx.beginPath();
      pathGen(line);
      options.ctx.strokeStyle = flightColor + alpha;
      options.ctx.lineWidth = isCurrent ? 2.5 : 1.5;
      options.ctx.shadowColor = flightColor;
      options.ctx.shadowBlur = isCurrent ? 10 : 3;
      options.ctx.stroke();
      options.ctx.shadowColor = 'transparent';
      options.ctx.shadowBlur = 0;
    }

    if (segIndex < segCount) {
      const from = route[segIndex];
      const to = route[segIndex + 1];
      if (to) {
        const interp = geoInterpolate([from.lng, from.lat], [to.lng, to.lat]);
        const planeCoord = interp(segT);
        const pos = projection(planeCoord as [number, number]);
        const d = geoDistance(planeCoord as [number, number], [-options.state.currentRotation[0], -options.state.currentRotation[1]]);

        if (options.state.followPlane && !options.state.isDragging && !options.state.flightPaused) {
          const targetLon = -(planeCoord as [number, number])[0];
          const targetLat = -(planeCoord as [number, number])[1];
          options.state.currentRotation[0] += (targetLon - options.state.currentRotation[0]) * 0.08;
          options.state.currentRotation[1] += (targetLat - options.state.currentRotation[1]) * 0.08;
          options.state.autoRotate = false;
        }

        if (pos && d < Math.PI / 2) {
          const aheadCoord = interp(Math.min(segT + 0.02, 1));
          const aheadPos = projection(aheadCoord as [number, number]);
          options.ctx.save();
          options.ctx.translate(pos[0], pos[1]);

          let angle = 0;
          if (aheadPos) {
            angle = Math.atan2(aheadPos[1] - pos[1], aheadPos[0] - pos[0]);
            options.ctx.rotate(angle);
          }

          const flightColor = options.meta[options.state.flightSeries]?.color ?? '#e10600';
          options.ctx.shadowColor = flightColor;
          options.ctx.shadowBlur = 16;

          const planeColor = '#ffffff';
          const planeAccent = flightColor;

          options.ctx.beginPath();
          options.ctx.moveTo(10, 0);
          options.ctx.lineTo(4, -1.5);
          options.ctx.lineTo(-8, -1.2);
          options.ctx.lineTo(-10, 0);
          options.ctx.lineTo(-8, 1.2);
          options.ctx.lineTo(4, 1.5);
          options.ctx.closePath();
          options.ctx.fillStyle = planeColor;
          options.ctx.fill();

          options.ctx.beginPath();
          options.ctx.moveTo(2, -1.5);
          options.ctx.lineTo(-2, -9);
          options.ctx.lineTo(-5, -8);
          options.ctx.lineTo(-3, -1.3);
          options.ctx.closePath();
          options.ctx.fillStyle = planeAccent;
          options.ctx.globalAlpha = 0.85;
          options.ctx.fill();

          options.ctx.beginPath();
          options.ctx.moveTo(2, 1.5);
          options.ctx.lineTo(-2, 9);
          options.ctx.lineTo(-5, 8);
          options.ctx.lineTo(-3, 1.3);
          options.ctx.closePath();
          options.ctx.fill();
          options.ctx.globalAlpha = 1;

          options.ctx.beginPath();
          options.ctx.moveTo(-7, -1.2);
          options.ctx.lineTo(-10, -5);
          options.ctx.lineTo(-10, -1);
          options.ctx.closePath();
          options.ctx.fillStyle = planeAccent;
          options.ctx.globalAlpha = 0.7;
          options.ctx.fill();
          options.ctx.globalAlpha = 1;

          options.ctx.beginPath();
          options.ctx.arc(6, 0, 1.2, 0, Math.PI * 2);
          options.ctx.fillStyle = '#60a5fa';
          options.ctx.fill();

          options.ctx.shadowColor = 'transparent';
          options.ctx.shadowBlur = 0;
          const trailGrad = options.ctx.createLinearGradient(-10, 0, -22, 0);
          trailGrad.addColorStop(0, 'rgba(255, 160, 50, 0.6)');
          trailGrad.addColorStop(0.4, 'rgba(255, 100, 30, 0.3)');
          trailGrad.addColorStop(1, 'rgba(255, 80, 20, 0)');
          options.ctx.beginPath();
          options.ctx.moveTo(-10, -1);
          options.ctx.lineTo(-22, -0.5);
          options.ctx.lineTo(-22, 0.5);
          options.ctx.lineTo(-10, 1);
          options.ctx.closePath();
          options.ctx.fillStyle = trailGrad;
          options.ctx.fill();
          options.ctx.restore();
        }
      }
    }

    if (!options.state.flightPaused) {
      options.state.flightProgress += options.flightSpeed;
      if (options.state.flightProgress >= segCount) {
        options.state.flightProgress = 0;
        options.state.lastFlightSegIndex = -1;
      } else {
        const newSegIdx = Math.min(Math.floor(options.state.flightProgress), segCount - 1);
        if (newSegIdx !== options.state.lastFlightSegIndex) {
          options.state.lastFlightSegIndex = newSegIdx;
          if (route[newSegIdx]) {
            const arrived = route[newSegIdx];
            options.state.selectedEvent = arrived;
            options.onArrival(arrived);
          }
        }
      }
    }
  }

  function render() {
    const { width, height, radius } = resize();
    const cx = width / 2;
    const cy = height / 2;
    options.ctx.clearRect(0, 0, width, height);
    projection.rotate(options.state.currentRotation);

    const now = Date.now();
    const rSafe = radius + 8;
    for (const star of stars) {
      const sx = star.x * width;
      const sy = star.y * height;
      const dx = sx - cx;
      const dy = sy - cy;
      if (dx * dx + dy * dy < rSafe * rSafe) continue;
      const twinkle = Math.sin(now * star.speed + star.phase) * 0.35 + 0.65;
      options.ctx.beginPath();
      options.ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
      options.ctx.fillStyle = `rgba(180, 200, 255, ${star.a * twinkle})`;
      options.ctx.fill();
    }

    const atmoGrad = options.ctx.createRadialGradient(cx, cy, radius * 0.96, cx, cy, radius * 1.3);
    atmoGrad.addColorStop(0, 'rgba(70, 140, 255, 0.15)');
    atmoGrad.addColorStop(0.4, 'rgba(50, 120, 240, 0.06)');
    atmoGrad.addColorStop(0.8, 'rgba(30, 90, 200, 0.02)');
    atmoGrad.addColorStop(1, 'rgba(20, 60, 150, 0)');
    options.ctx.beginPath();
    options.ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
    options.ctx.fillStyle = atmoGrad;
    options.ctx.fill();

    const oceanGrad = options.ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.05, cx + radius * 0.1, cy + radius * 0.1, radius);
    oceanGrad.addColorStop(0, '#1a3d5c');
    oceanGrad.addColorStop(0.4, '#133050');
    oceanGrad.addColorStop(0.75, '#0d2038');
    oceanGrad.addColorStop(1, '#091528');
    options.ctx.beginPath();
    options.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    options.ctx.fillStyle = oceanGrad;
    options.ctx.fill();

    options.ctx.beginPath();
    pathGen(graticule());
    options.ctx.strokeStyle = 'rgba(50, 100, 150, 0.10)';
    options.ctx.lineWidth = 0.4;
    options.ctx.stroke();

    options.ctx.beginPath();
    pathGen(options.land as any);
    options.ctx.fillStyle = '#1c2e25';
    options.ctx.fill();
    options.ctx.strokeStyle = 'rgba(70, 120, 90, 0.5)';
    options.ctx.lineWidth = 0.6;
    options.ctx.stroke();

    drawRoutes();
    drawFlightAnimation();
    drawDots();

    options.ctx.save();
    options.ctx.beginPath();
    options.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    options.ctx.clip();
    const specGrad = options.ctx.createRadialGradient(cx - radius * 0.38, cy - radius * 0.4, 0, cx - radius * 0.2, cy - radius * 0.2, radius * 0.6);
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
    specGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.02)');
    specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    options.ctx.fillStyle = specGrad;
    options.ctx.fillRect(0, 0, width, height);
    options.ctx.restore();

    options.ctx.save();
    options.ctx.beginPath();
    options.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    options.ctx.clip();
    const limbGrad = options.ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius);
    limbGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    limbGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
    limbGrad.addColorStop(0.85, 'rgba(0, 8, 25, 0.15)');
    limbGrad.addColorStop(0.95, 'rgba(0, 10, 35, 0.30)');
    limbGrad.addColorStop(1, 'rgba(0, 10, 40, 0.45)');
    options.ctx.fillStyle = limbGrad;
    options.ctx.fillRect(0, 0, width, height);
    const atmoEdge = options.ctx.createRadialGradient(cx, cy, radius * 0.92, cx, cy, radius);
    atmoEdge.addColorStop(0, 'rgba(60, 140, 255, 0)');
    atmoEdge.addColorStop(0.7, 'rgba(60, 140, 255, 0.02)');
    atmoEdge.addColorStop(1, 'rgba(80, 160, 255, 0.06)');
    options.ctx.fillStyle = atmoEdge;
    options.ctx.fillRect(0, 0, width, height);
    options.ctx.restore();

    options.ctx.beginPath();
    options.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    options.ctx.strokeStyle = 'rgba(80, 150, 255, 0.10)';
    options.ctx.lineWidth = 1.5;
    options.ctx.stroke();

    if (!options.state.isDragging) {
      if (Math.abs(options.state.velocityX) > 0.01) {
        options.state.currentRotation[0] += options.state.velocityX;
        options.state.velocityX *= 0.95;
      }
      if (!options.state.autoRotate && Date.now() - options.state.lastInteraction > 6000) options.state.autoRotate = true;
      if (options.state.autoRotate) options.state.currentRotation[0] += 0.15;
    }
  }

  return {
    render,
    start() {
      if (loop) return;
      loop = timer(() => render());
    },
    stop() {
      loop?.stop();
      loop = null;
    },
  };
}