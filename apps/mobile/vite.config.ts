import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // Bound to all interfaces so real phones on the same Wi-Fi can reach the dev
    // server — point them at this machine's LAN IP, not localhost.
    host: true,
  },
});
