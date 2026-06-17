export type StorageValidator<T> = (value: unknown) => value is T;

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string' && item.length > 0);
}

export function readStoredJson<T>(
  key: string,
  fallback: T,
  validate?: StorageValidator<T>,
): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallback;
    return (parsed as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readStoredString(key: string, fallback = ''): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredString(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function removeStoredValue(key: string): void {
  localStorage.removeItem(key);
}