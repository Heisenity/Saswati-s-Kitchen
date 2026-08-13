/**
 * Small, versioned browser cache for non-sensitive storefront state.
 * Never use this for addresses, payments, orders, messages, or account data.
 */
export const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

type BrowserCacheEntry<T> = {
  version: 1;
  expiresAt: number;
  value: T;
};

export function readBrowserCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const entry = JSON.parse(raw) as BrowserCacheEntry<T>;
    if (entry.version !== 1 || entry.expiresAt <= Date.now()) {
      window.localStorage.removeItem(key);
      return null;
    }

    return entry.value;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function writeBrowserCache<T>(key: string, value: T, ttlMs = FORTY_EIGHT_HOURS_MS) {
  if (typeof window === "undefined") return;

  try {
    const entry: BrowserCacheEntry<T> = {
      version: 1,
      expiresAt: Date.now() + ttlMs,
      value
    };
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage can be unavailable or full. The in-memory app state still works.
  }
}
