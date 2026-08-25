import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Playground imports the library straight from ../src for live editing.
export default defineConfig({
  plugins: [react()],
  server: { port: 8093 },
});
