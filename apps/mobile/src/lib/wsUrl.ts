export function serverWsBase(): string {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) return envUrl;
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.hostname}:8787`;
}
