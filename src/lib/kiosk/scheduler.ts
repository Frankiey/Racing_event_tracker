export interface KioskSchedulerOptions {
  rotationIntervalMs: number;
  onSecondTick: () => void;
  onModeRefresh: () => void;
  onRotate: () => void;
  onDataRefresh: () => void;
}

export interface KioskScheduler {
  start: () => void;
  stop: () => void;
}

export function createKioskScheduler(options: KioskSchedulerOptions): KioskScheduler {
  let intervalIds: number[] = [];

  return {
    start() {
      if (intervalIds.length > 0) return;
      intervalIds = [
        window.setInterval(options.onSecondTick, 1000),
        window.setInterval(options.onModeRefresh, 30_000),
        window.setInterval(options.onRotate, options.rotationIntervalMs),
        window.setInterval(options.onDataRefresh, 5 * 60_000),
      ];
    },
    stop() {
      intervalIds.forEach((id) => window.clearInterval(id));
      intervalIds = [];
    },
  };
}