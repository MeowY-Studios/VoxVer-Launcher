import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import pkg from './package.json'

export default defineConfig({
  root: '.',
  plugins: [
    vue(),
    {
      name: 'html-inject-version',
      transformIndexHtml(html) {
        return html.replace('__APP_VERSION__', JSON.stringify(pkg.version))
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true
  }
})
