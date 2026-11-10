import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    // 公共目录里的绝对路径资源（/xxx.png）不要在测试里被解析成文件 URL
    vue({ template: { transformAssetUrls: { includeAbsolute: false } } })
  ],
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
