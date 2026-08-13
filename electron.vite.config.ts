import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import dotenv from 'dotenv'
import pkg from './package.json'

dotenv.config()

const depKeys = Object.keys(pkg.dependencies || {})
const externalDeps = [...depKeys, 'electron', '@aws-sdk/client-s3']
const isExternal = (id: string): boolean =>
  externalDeps.some((dep) => id === dep || id.startsWith(dep + '/'))

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      minify: false,
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/main.ts')
        },
        external: isExternal,
        output: {
          format: 'cjs',
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name][extname]'
        }
      }
    }
  },
  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/preload.ts')
        },
        external: isExternal,
        output: {
          format: 'cjs',
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name][extname]'
        }
      }
    }
  },
  renderer: {
    root: '.',
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html')
        }
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
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
          // sass-embedded >= 1.99 支持 modern-compiler api，@types/sass/vite 声明还未同步
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          api: 'modern-compiler'
        }
      }
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true
    }
  }
})
