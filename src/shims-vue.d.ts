/**
 * .vue 单文件组件模块声明
 * 必须位于无 import/export 的全局声明文件中，否则通配符模块声明不生效
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
