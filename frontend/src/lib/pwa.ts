import { registerSW } from "virtual:pwa-register";

/** Register the service worker so the app loads offline and updates itself. */
export function setupPwa() {
  if (!("serviceWorker" in navigator)) return;
  registerSW({ immediate: true });
}

/**
 * Ask the browser not to evict our data when the phone is low on space.
 * iOS grants this to Home Screen apps; it's a no-op elsewhere.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** True when running from the Home Screen rather than a Safari tab. */
export function isStandalone(): boolean {
  return (
    matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
