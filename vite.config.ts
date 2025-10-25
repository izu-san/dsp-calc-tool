import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // カスタムドメイン (dsp-calc.com) を使用
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/e2e/**',
      'tests/fixtures/**',
      '**/*.e2e.spec.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'tests/e2e/',
        'tests/fixtures/'
      ]
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          'react-vendor': ['react', 'react-dom'],
          // UI component libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-label', 
            '@radix-ui/react-select',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip'
          ],
          // Chart and visualization
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          // Utilities and parsers
          'utils-vendor': [
            'decimal.js',
            'dompurify', 
            'fast-xml-parser',
            'lz-string',
            'js-cookie',
            'zod'
          ],
          // Internationalization
          'i18n-vendor': ['i18next', 'react-i18next'],
          // State management
          'state-vendor': ['zustand']
        }
      }
    },
    // Increase chunk size warning limit to 800KB
    chunkSizeWarningLimit: 800
  }
})
