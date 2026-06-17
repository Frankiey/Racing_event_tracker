import { formatLocalValue, type LocalTimeFormat } from '../time';

export function hydrateLocalTimeElement(el: HTMLTimeElement): void {
  const utc = el.dataset.localTime;
  if (!utc) return;
  const format = (el.dataset.format as LocalTimeFormat | undefined) ?? 'datetime';
  el.textContent = formatLocalValue(utc, format);
}

export function hydrateLocalTimes(root: ParentNode = document): void {
  root.querySelectorAll<HTMLTimeElement>('[data-local-time]').forEach(hydrateLocalTimeElement);
}