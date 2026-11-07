/** KorPageShell 的公共类型（供 .vue 与 composable 共用）。 */

export interface KorShellItem {
  key: string
  label: string
  /** 第二行副标题（如路径、版本号），单行截断 */
  description?: string
  /** 动作项：点击只执行回调，不切换子页、不参与选中 */
  onSelect?: () => void
  /** 不在侧栏列出，但仍可被外部切换显示 */
  hidden?: boolean
}

export interface KorShellGroup {
  title?: string
  items: KorShellItem[]
}

export interface KorShellNav {
  activeKey: string
  navigate: (key: string) => void
}
