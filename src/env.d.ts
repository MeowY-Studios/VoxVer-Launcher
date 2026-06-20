/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: import('../electron/preload').MclaAPI
}

declare module 'vue-i18n' {
  import type { LocaleMessages } from './locale'
  interface DefineLocaleMessage extends LocaleMessages {}
}
