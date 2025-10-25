import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: 'src/setupTests.js',
    globals: true,
    css: true,
    // Discover tests from the central /tests directory
    include: ['../../tests/unit/**/*.test.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: '../../tests/coverage',
      include: [
        'src/lib/tokenManager.js',
        'src/lib/*Validation.js'
      ],
      exclude: ['**/node_modules/**'],
    },
  },
})
