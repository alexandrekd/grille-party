/** Mirrors serverWsBase()'s fallback pattern (see wsUrl.ts): an explicit env var
 * wins (needed on Render, where each service has its own domain), otherwise fall
 * back to the host page's own hostname on the mobile app's dev port — correct for
 * `npm run dev`/`npm run party`, where both apps share the same machine/LAN IP. */
function mobileBase(): string {
  const envUrl = import.meta.env.VITE_MOBILE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const proto = window.location.protocol;
  return `${proto}//${window.location.hostname}:5174`;
}

export function mobileJoinUrl(roomCode: string): string {
  return `${mobileBase()}/?code=${encodeURIComponent(roomCode)}`;
}
