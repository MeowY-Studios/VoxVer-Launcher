/**
 * i18n 工具 - 为非 Vue 组件上下文提供翻译能力
 * 在 main.ts 中调用 setI18n() 注册实例
 */
import type { Composer } from 'vue-i18n'

let i18n: Composer | null = null

export function setI18n(instance: Composer): void {
  i18n = instance
}

export function $t(key: string, ...args: any[]): string {
  if (i18n) {
    return (i18n.t as any)(key, ...args)
  }
  return key
}
