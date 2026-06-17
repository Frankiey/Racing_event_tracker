export interface CalendarSelectionState {
  selectedDates: Set<string>;
  lastSelectedDate: string | null;
}

export function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function monDow(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function getDatesBetween(startStr: string, endStr: string): string[] {
  const start = new Date(startStr + 'T12:00:00');
  const end = new Date(endStr + 'T12:00:00');
  const from = start <= end ? start : end;
  const to = start <= end ? end : start;
  const dates: string[] = [];
  for (const cursor = new Date(from); cursor <= to; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(toDateStr(cursor));
  }
  return dates;
}

export function getSelectedDates(selectedDates: Set<string>): string[] {
  return [...selectedDates].sort();
}

export function formatSelectionLabel(dateStrings: string[]): string {
  if (dateStrings.length === 0) return '';
  if (dateStrings.length === 1) {
    return new Date(dateStrings[0] + 'T12:00:00').toLocaleDateString('en', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  }
  const first = new Date(dateStrings[0] + 'T12:00:00');
  const last = new Date(dateStrings[dateStrings.length - 1] + 'T12:00:00');
  return `${dateStrings.length} days · ${first.toLocaleDateString('en', { month: 'short', day: 'numeric' })}–${last.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
}

export function updateCalendarSelection(
  state: CalendarSelectionState,
  dateStr: string,
  event?: Pick<MouseEvent, 'shiftKey' | 'metaKey' | 'ctrlKey'>,
): CalendarSelectionState {
  const nextSelectedDates = new Set(state.selectedDates);

  if (event?.shiftKey && state.lastSelectedDate) {
    nextSelectedDates.clear();
    getDatesBetween(state.lastSelectedDate, dateStr).forEach((date) => nextSelectedDates.add(date));
    return { selectedDates: nextSelectedDates, lastSelectedDate: dateStr };
  }

  if (event?.metaKey || event?.ctrlKey) {
    if (nextSelectedDates.has(dateStr)) nextSelectedDates.delete(dateStr);
    else nextSelectedDates.add(dateStr);
    return {
      selectedDates: nextSelectedDates,
      lastSelectedDate: nextSelectedDates.size > 0 ? dateStr : null,
    };
  }

  if (nextSelectedDates.size === 1 && nextSelectedDates.has(dateStr)) {
    return { selectedDates: new Set(), lastSelectedDate: null };
  }

  return {
    selectedDates: new Set([dateStr]),
    lastSelectedDate: dateStr,
  };
}