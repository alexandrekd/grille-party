#!/usr/bin/env node
// One command for hosting a real living-room game off a laptop plugged into the
// TV, on the local network — no hosting provider, no account, nothing to deploy.
// Auto-detects the laptop's LAN IPv4 address and starts the usual `npm run dev`
// with VITE_WS_URL already pointed at it, so phones on the same Wi-Fi can join
// without anyone having to look up or type an IP address by hand.
import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";

const VIRTUAL_ADAPTER_PATTERN = /virtual|vethernet|docker|vbox|vmware|utun|tailscale|zerotier/i;

function findLanIp() {
  const nets = networkInterfaces();
  const candidates = [];
  for (const [name, addrs] of Object.entries(nets)) {
    for (const addr of addrs ?? []) {
      if (addr.family === "IPv4" && !addr.internal) {
        candidates.push({ name, address: addr.address });
      }
    }
  }
  const real = candidates.find((c) => !VIRTUAL_ADAPTER_PATTERN.test(c.name));
  return (real ?? candidates[0])?.address ?? null;
}

const ip = findLanIp();

if (!ip) {
  console.error(
    "Impossible de détecter une adresse IP locale — vérifie que tu es bien connecté au Wi-Fi, " +
      "ou lance `npm run dev` directement en renseignant VITE_WS_URL toi-même (voir le README).",
  );
  process.exit(1);
}

console.log("");
console.log("  🎉  Grillé ! — soirée locale");
console.log("");
console.log(`  TV (à caster/brancher)  →  http://${ip}:5173`);
console.log(`  Téléphones des joueurs  →  http://${ip}:5174`);
console.log("");
console.log("  Tout le monde doit être sur le même Wi-Fi.");
console.log(
  "  Si une autre adresse est détectée par erreur (VPN, plusieurs réseaux…), lance `npm run dev` \n" +
    "  directement avec VITE_WS_URL=ws://TON_IP:8787 (voir le README).",
);
console.log("");

const child = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, VITE_WS_URL: `ws://${ip}:8787`, VITE_MOBILE_URL: `http://${ip}:5174` },
});
child.on("exit", (code) => process.exit(code ?? 0));
