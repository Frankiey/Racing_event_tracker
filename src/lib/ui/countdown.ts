interface CountdownRefs {
  days: HTMLElement;
  hours: HTMLElement;
  minutes: HTMLElement;
  seconds: HTMLElement;
  label: HTMLElement | null;
  daysLabel: HTMLElement | null;
}

const countdownIntervals = new WeakMap<HTMLElement, number>();

function getCountdownRefs(el: HTMLElement): CountdownRefs | null {
  const days = el.querySelector<HTMLElement>('[data-unit="days"]');
  const hours = el.querySelector<HTMLElement>('[data-unit="hours"]');
  const minutes = el.querySelector<HTMLElement>('[data-unit="minutes"]');
  const seconds = el.querySelector<HTMLElement>('[data-unit="seconds"]');
  if (!days || !hours || !minutes || !seconds) return null;

  return {
    days,
    hours,
    minutes,
    seconds,
    label: el.querySelector('p'),
    daysLabel: days.nextElementSibling as HTMLElement | null,
  };
}

export function initCountdownElement(el: HTMLElement): void {
  if (el.dataset.countdownInit === '1') return;
  const targetUtc = el.dataset.countdown;
  if (!targetUtc) return;
  const refs = getCountdownRefs(el);
  if (!refs) return;

  el.dataset.countdownInit = '1';
  const target = new Date(targetUtc).getTime();

  const update = () => {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      const elapsed = now - target;
      const elapsedMinutes = Math.floor(elapsed / 60000);
      const elapsedHours = Math.floor(elapsedMinutes / 60);
      if (refs.label && !refs.label.dataset.liveSet) {
        refs.label.dataset.liveSet = '1';
        refs.label.innerHTML = '<span class="live-pulse inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span><span class="text-emerald-400">In Progress</span></span>';
      }
      refs.days.textContent = '0';
      refs.hours.textContent = String(elapsedHours).padStart(2, '0');
      refs.minutes.textContent = String(elapsedMinutes % 60).padStart(2, '0');
      refs.seconds.textContent = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
      if (refs.daysLabel && refs.daysLabel.textContent !== 'elapsed') refs.daysLabel.textContent = 'elapsed';
      return;
    }

    refs.days.textContent = String(Math.floor(diff / 86400000));
    refs.hours.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
    refs.minutes.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    refs.seconds.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  };

  update();
  countdownIntervals.set(el, window.setInterval(update, 1000));
}

export function destroyCountdownElement(el: HTMLElement): void {
  const intervalId = countdownIntervals.get(el);
  if (intervalId !== undefined) {
    window.clearInterval(intervalId);
    countdownIntervals.delete(el);
  }
  delete el.dataset.countdownInit;
}

export function initCountdowns(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-countdown]').forEach(initCountdownElement);
}

export function cleanupCountdowns(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-countdown]').forEach(destroyCountdownElement);
}