/**
 * i18n 工具 - 为非 Vue 组件上下文提供翻译能力
 * 在 main.ts 中调用 setI18n() 注册实例
 */
import type { Composer } from 'vue-i18n'

let i18n: Composer | null = null

export function setI18n(instance: Composer): void {
  i18n = instance
}

export function $t(key: string, ...args: unknown[]): string {
  if (i18n) {
    // * 先用 te() 检查 key 是否存在，避免对缺失 key 输出 [intlify] Not found 警告
    if (i18n.te(key)) {
      return (i18n.t as (...a: unknown[]) => string)(key, ...args)
    }
    // * key 不存在，返回 key 名或传入的默认值作为静默 fallback
    return (args[0] as string) ?? key
  }
  return key
}
