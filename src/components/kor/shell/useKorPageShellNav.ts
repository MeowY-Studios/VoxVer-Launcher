import { inject } from 'vue'
import type { KorShellNav } from './types'

/**
 * 在 KorPageShell 的子页内容里反向操作侧栏（例如首页里的跳转按钮）。
 * 必须在 <KorPageShell> 渲染的子树内调用。
 */
export function useKorPageShellNav(): KorShellNav {
  const ctx = inject<KorShellNav | null>('kor-shell-nav', null)
  if (!ctx) throw new Error('useKorPageShellNav() 必须在 <KorPageShell> 内使用')
  return ctx
}
