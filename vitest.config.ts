import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'out/',
        'dist/',
        '.git/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '/Alogo.png': resolve(__dirname, 'tests/__mocks__/fileMock.js'),
      '\\.(png|jpg|jpeg|gif|svg|webp)$': resolve(__dirname, 'tests/__mocks__/fileMock.js')
    }
  }
})
