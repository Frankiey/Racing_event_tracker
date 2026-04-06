import { isPlaceholderTime } from './client-utils';
import { getClientSeriesMeta } from './series-client';
import { SESSION_LABELS } from './sessions';
import type { RaceEvent } from './types';

interface WeekendCardSession {
  label: string;
  dayLabel: string;
  timeLabel: string;
}

interface WeekendCardEvent {
  id: string;
  eventName: string;
  circuitName: string;
  badgeLabel: string;
  color: string;
  sessions: WeekendCardSession[];
  extraSessionCount: number;
}

export interface WeekendShareCardData {
  title: string;
  rangeLabel: string;
  timezoneLabel: string;
  eventCount: number;
  sessionCount: number;
  events: WeekendCardEvent[];
  hiddenEventCount: number;
}

interface ShareCardBuildOptions {
  title: string;
  rangeLabel: string;
  events: RaceEvent[];
  includeSession: (session: { type: string; startTimeUTC: string }) => boolean;
}

function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getWeekendWindow(now: Date): { start: Date; end: Date } {
  const start = startOfLocalDay(now);
  const day = start.getDay();

  if (day >= 1 && day <= 4) {
    start.setDate(start.getDate() + (5 - day));
  } else if (day === 6) {
    start.setDate(start.getDate() - 1);
  } else if (day === 0) {
    start.setDate(start.getDate() - 2);
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  return { start, end };
}

function formatRangeLabel(start: Date, end: Date): string {
  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);

  const startMonth = start.toLocaleDateString(undefined, { month: 'short' });
  const endMonth = lastDay.toLocaleDateString(undefined, { month: 'short' });

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}-${lastDay.getDate()}`;
  }

  return `${startMonth} ${start.getDate()}-${endMonth} ${lastDay.getDate()}`;
}

function getTimezoneLabel(now: Date): string {
  const shortName = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
    .formatToParts(now)
    .find(part => part.type === 'timeZoneName')?.value;

  return shortName ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function toLocalDateKey(utc: string): string {
  const local = new Date(utc);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, '0');
  const day = String(local.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatSelectedDatesLabel(sortedDates: string[]): string {
  if (sortedDates.length === 0) return '';
  if (sortedDates.length === 1) return formatDateLabel(sortedDates[0]);

  const contiguous = sortedDates.every((date, index) => {
    if (index === 0) return true;
    const prev = new Date(`${sortedDates[index - 1]}T12:00:00`);
    prev.setDate(prev.getDate() + 1);
    return date === `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
  });

  if (contiguous) {
    const firstDate = new Date(`${sortedDates[0]}T12:00:00`);
    const lastDate = new Date(`${sortedDates[sortedDates.length - 1]}T12:00:00`);
    const firstMonth = firstDate.toLocaleDateString(undefined, { month: 'short' });
    const lastMonth = lastDate.toLocaleDateString(undefined, { month: 'short' });
    if (firstMonth === lastMonth) return `${firstMonth} ${firstDate.getDate()}-${lastDate.getDate()}`;
    return `${formatDateLabel(sortedDates[0])}-${formatDateLabel(sortedDates[sortedDates.length - 1])}`;
  }

  return `${formatDateLabel(sortedDates[0])} +${sortedDates.length - 1} days`;
}

function buildShareCardData(options: ShareCardBuildOptions, now = new Date()): WeekendShareCardData | null {
  const eventCards = options.events
    .map(event => {
      const matchingSessions = event.sessions
        .filter(session => !isPlaceholderTime(session.startTimeUTC))
        .filter(session => options.includeSession(session))
        .map(session => ({ session, start: new Date(session.startTimeUTC) }))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      if (matchingSessions.length === 0) return null;

      const meta = getClientSeriesMeta(event.seriesId);

      return {
        id: event.id,
        eventName: event.eventName,
        circuitName: event.circuit.name,
        badgeLabel: meta.shortLabel,
        color: meta.color,
        sessionCount: matchingSessions.length,
        firstSession: matchingSessions[0].start.getTime(),
        sessions: matchingSessions.slice(0, 4).map(({ session, start }) => ({
          label: SESSION_LABELS[session.type] ?? session.type,
          dayLabel: start.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
          timeLabel: start.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })),
        extraSessionCount: Math.max(0, matchingSessions.length - 4),
      };
    })
    .filter((event): event is NonNullable<typeof event> => Boolean(event))
    .sort((a, b) => a.firstSession - b.firstSession);

  if (eventCards.length === 0) return null;

  const visibleEvents = eventCards.slice(0, 4).map(({ firstSession: _firstSession, sessionCount: _sessionCount, ...event }) => event);
  const sessionCount = eventCards.reduce((total, event) => total + event.sessionCount, 0);

  return {
    title: options.title,
    rangeLabel: options.rangeLabel,
    timezoneLabel: getTimezoneLabel(now),
    eventCount: eventCards.length,
    sessionCount,
    events: visibleEvents,
    hiddenEventCount: Math.max(0, eventCards.length - visibleEvents.length),
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string
) {
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth: number
) {
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, initialSize: number, weight: string): string {
  let size = initialSize;
  while (size > 24) {
    ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return ctx.font;
    size -= 2;
  }
  return `${weight} 24px ui-sans-serif, system-ui, sans-serif`;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  color: string,
  font: string
): number {
  ctx.font = font;
  ctx.fillStyle = color;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
}

function createDownload(canvas: HTMLCanvasElement, filename: string): void {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value.trimEnd()}…`;
}

function getShareCardLayout(eventCount: number) {
  if (eventCount <= 1) {
    return {
      maxSessionsPerEvent: 4,
      badgeFont: '700 24px ui-sans-serif, system-ui, sans-serif',
      titleFont: '900 40px ui-sans-serif, system-ui, sans-serif',
      titleLineHeight: 48,
      titleMaxLines: 2,
      circuitFont: '500 26px ui-sans-serif, system-ui, sans-serif',
      sessionTimeFont: '700 18px ui-monospace, SFMono-Regular, Menlo, monospace',
      sessionLabelFont: '600 18px ui-sans-serif, system-ui, sans-serif',
      sessionLabelMaxWidth: 82,
      sessionTop: 48,
      sessionStep: 58,
      sessionPillHeight: 44,
      sessionTextY: 28,
      minCardHeight: 360,
      maxCardHeight: 520,
      cardRadius: 38,
      footerOffset: 34,
    };
  }

  if (eventCount === 2) {
    return {
      maxSessionsPerEvent: 3,
      badgeFont: '700 22px ui-sans-serif, system-ui, sans-serif',
      titleFont: '900 36px ui-sans-serif, system-ui, sans-serif',
      titleLineHeight: 42,
      titleMaxLines: 2,
      circuitFont: '500 22px ui-sans-serif, system-ui, sans-serif',
      sessionTimeFont: '700 17px ui-monospace, SFMono-Regular, Menlo, monospace',
      sessionLabelFont: '600 17px ui-sans-serif, system-ui, sans-serif',
      sessionLabelMaxWidth: 78,
      sessionTop: 44,
      sessionStep: 50,
      sessionPillHeight: 40,
      sessionTextY: 26,
      minCardHeight: 310,
      maxCardHeight: 420,
      cardRadius: 36,
      footerOffset: 28,
    };
  }

  if (eventCount === 3) {
    return {
      maxSessionsPerEvent: 2,
      badgeFont: '700 20px ui-sans-serif, system-ui, sans-serif',
      titleFont: '900 32px ui-sans-serif, system-ui, sans-serif',
      titleLineHeight: 38,
      titleMaxLines: 2,
      circuitFont: '500 20px ui-sans-serif, system-ui, sans-serif',
      sessionTimeFont: '700 16px ui-monospace, SFMono-Regular, Menlo, monospace',
      sessionLabelFont: '600 16px ui-sans-serif, system-ui, sans-serif',
      sessionLabelMaxWidth: 74,
      sessionTop: 40,
      sessionStep: 44,
      sessionPillHeight: 36,
      sessionTextY: 24,
      minCardHeight: 250,
      maxCardHeight: 320,
      cardRadius: 34,
      footerOffset: 24,
    };
  }

  return {
    maxSessionsPerEvent: 2,
    badgeFont: '700 18px ui-sans-serif, system-ui, sans-serif',
    titleFont: '900 28px ui-sans-serif, system-ui, sans-serif',
    titleLineHeight: 34,
    titleMaxLines: 2,
    circuitFont: '500 18px ui-sans-serif, system-ui, sans-serif',
    sessionTimeFont: '700 15px ui-monospace, SFMono-Regular, Menlo, monospace',
    sessionLabelFont: '600 15px ui-sans-serif, system-ui, sans-serif',
    sessionLabelMaxWidth: 68,
    sessionTop: 36,
    sessionStep: 38,
    sessionPillHeight: 32,
    sessionTextY: 21,
    minCardHeight: 200,
    maxCardHeight: 250,
    cardRadius: 30,
    footerOffset: 20,
  };
}

export function getWeekendShareCardData(events: RaceEvent[], now = new Date()): WeekendShareCardData | null {
  const { start, end } = getWeekendWindow(now);
  return buildShareCardData({
    title: 'This Weekend in Racing',
    rangeLabel: formatRangeLabel(start, end),
    events,
    includeSession: session => {
      const sessionStart = new Date(session.startTimeUTC);
      return sessionStart >= start && sessionStart < end;
    },
  }, now);
}

export function getShareCardDataForDates(events: RaceEvent[], dateStrings: string[], now = new Date()): WeekendShareCardData | null {
  const sortedDates = [...new Set(dateStrings)].sort();
  if (sortedDates.length === 0) return null;

  const selectedDates = new Set(sortedDates);
  return buildShareCardData({
    title: sortedDates.length === 1 ? 'Race Day Snapshot' : 'Selected Race Days',
    rangeLabel: formatSelectedDatesLabel(sortedDates),
    events,
    includeSession: session => selectedDates.has(toLocalDateKey(session.startTimeUTC)) || selectedDates.has(session.startTimeUTC.slice(0, 10)),
  }, now);
}

function renderShareCard(data: WeekendShareCardData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable.');

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#09090b');
  gradient.addColorStop(0.55, '#111827');
  gradient.addColorStop(1, '#1f2937');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(140, 120);
  ctx.rotate(-0.28);
  fillRoundedRect(ctx, 0, 0, 860, 110, 28, 'rgba(244, 63, 94, 0.12)');
  fillRoundedRect(ctx, 120, 180, 720, 72, 24, 'rgba(251, 191, 36, 0.12)');
  fillRoundedRect(ctx, -40, 320, 920, 48, 20, 'rgba(34, 197, 94, 0.08)');
  ctx.restore();

  for (let index = 0; index < 26; index++) {
    fillRoundedRect(ctx, 76 + index * 36, 1530 + (index % 2) * 18, 10, 10, 5, 'rgba(255, 255, 255, 0.05)');
  }

  ctx.fillStyle = '#f97316';
  ctx.font = '700 28px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('RACETRACK', 84, 110);

  ctx.fillStyle = '#f4f4f5';
  ctx.font = fitText(ctx, data.title.toUpperCase(), 912, 96, '900');
  ctx.fillText(data.title.toUpperCase(), 84, 238);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 34px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(`${data.rangeLabel}  •  ${data.timezoneLabel}`, 84, 296);

  fillRoundedRect(ctx, 84, 338, 170, 58, 29, 'rgba(244, 63, 94, 0.14)');
  fillRoundedRect(ctx, 268, 338, 190, 58, 29, 'rgba(245, 158, 11, 0.14)');
  ctx.fillStyle = '#f4f4f5';
  ctx.font = '700 24px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(`${data.eventCount} events`, 118, 376);
  ctx.fillText(`${data.sessionCount} sessions`, 302, 376);

  const layout = getShareCardLayout(data.events.length);
  const cardGap = 28;
  const cardTop = 456;
  const cardBottomSpace = 248;
  const availableHeight = canvas.height - cardTop - cardBottomSpace;
  const baseCardHeight = Math.floor((availableHeight - cardGap * (data.events.length - 1)) / data.events.length);
  const cardHeight = Math.max(layout.minCardHeight, Math.min(layout.maxCardHeight, baseCardHeight));
  const totalCardsHeight = cardHeight * data.events.length + cardGap * (data.events.length - 1);
  const topOffset = cardTop + Math.max(0, Math.floor((availableHeight - totalCardsHeight) / 2));

  data.events.forEach((event, index) => {
    const top = topOffset + index * (cardHeight + cardGap);
    fillRoundedRect(ctx, 64, top, 952, cardHeight, layout.cardRadius, 'rgba(9, 9, 11, 0.7)');
    strokeRoundedRect(ctx, 64, top, 952, cardHeight, layout.cardRadius, 'rgba(255, 255, 255, 0.08)', 2);
    fillRoundedRect(ctx, 64, top, 20, cardHeight, 10, event.color);
    fillRoundedRect(ctx, 104, top + 34, 126, 46, 23, `${event.color}22`);

    ctx.fillStyle = event.color;
    ctx.font = layout.badgeFont;
    ctx.fillText(event.badgeLabel, 136, top + 64);

    const titleBottom = drawWrappedText(
      ctx,
      event.eventName,
      104,
      top + 132,
      640,
      layout.titleLineHeight,
      layout.titleMaxLines,
      '#fafafa',
      layout.titleFont
    );

    ctx.fillStyle = '#a1a1aa';
    ctx.font = layout.circuitFont;
    ctx.fillText(event.circuitName, 104, titleBottom + 16);

    const visibleSessions = event.sessions.slice(0, layout.maxSessionsPerEvent);
    const compactExtraSessionCount = event.extraSessionCount + Math.max(0, event.sessions.length - visibleSessions.length);
    const sessionStartY = top + layout.sessionTop;
    visibleSessions.forEach((session, sessionIndex) => {
      const rowTop = sessionStartY + sessionIndex * layout.sessionStep;
      fillRoundedRect(ctx, 724, rowTop, 252, layout.sessionPillHeight, 22, 'rgba(255, 255, 255, 0.05)');
      ctx.fillStyle = '#f4f4f5';
      ctx.font = layout.sessionTimeFont;
      ctx.fillText(`${session.dayLabel} ${session.timeLabel}`, 742, rowTop + layout.sessionTextY);
      ctx.fillStyle = '#d4d4d8';
      ctx.font = layout.sessionLabelFont;
      ctx.fillText(truncateText(ctx, session.label, layout.sessionLabelMaxWidth), 884, rowTop + layout.sessionTextY);
    });

    if (compactExtraSessionCount > 0) {
      ctx.fillStyle = '#71717a';
      ctx.font = '600 20px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(`+${compactExtraSessionCount} more sessions`, 724, top + cardHeight - layout.footerOffset);
    }
  });

  if (data.hiddenEventCount > 0) {
    ctx.fillStyle = '#d4d4d8';
    ctx.font = '600 28px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(`+${data.hiddenEventCount} more events on racetrack`, 84, 1672);
  }

  ctx.fillStyle = '#f4f4f5';
  ctx.font = '800 42px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('Local-time weekend snapshot', 84, 1776);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 28px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('Share it. Save it. Stop missing the good stuff.', 84, 1822);
  ctx.fillText('racetrack', 84, 1872);

  return canvas;
}

export function downloadWeekendShareCard(events: RaceEvent[], now = new Date()): boolean {
  const data = getWeekendShareCardData(events, now);
  if (!data) return false;
  const canvas = renderShareCard(data);

  const filename = `racetrack-weekend-${data.rangeLabel.replace(/\s+/g, '-').toLowerCase()}.png`;
  createDownload(canvas, filename);
  return true;
}

export function downloadShareCardForDates(events: RaceEvent[], dateStrings: string[], now = new Date()): boolean {
  const data = getShareCardDataForDates(events, dateStrings, now);
  if (!data) return false;

  const canvas = renderShareCard(data);
  const filename = `racetrack-days-${data.rangeLabel.replace(/\s+/g, '-').toLowerCase()}.png`;
  createDownload(canvas, filename);
  return true;
}