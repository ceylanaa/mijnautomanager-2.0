import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    clearMocks: true,
    // Testwaarden; de echte waarden staan in .env.
    env: { VITE_NOVI_URL: 'https://novi.test', VITE_NOVI_PROJECT_ID: 'test-project' },
  },
});
