import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Listen on all network interfaces so a phone on the same Wi-Fi can connect.
    host: true,
    port: 5173,
  },
  build: {
    // Phaser is one big (~1.2 MB) library; that's expected, so don't warn about it.
    chunkSizeWarningLimit: 1500,
  },
});
