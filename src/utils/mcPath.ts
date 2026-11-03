/**
 * 获取当前 Minecraft 游戏目录
 *
 * 优先级：上次使用的目录 > 自定义路径 > 空字符串
 * 读取失败时静默兜底返回 ''，由调用方决定是提示还是跳过。
 */
export async function getCurrentMcPath(): Promise<string> {
  const api = window.electronAPI
  try {
    if (api?.folders?.getLast) {
      const last = await api.folders.getLast()
      if (last) return last
    }
    if (api?.path?.getCustom) {
      const custom = await api.path.getCustom()
      if (custom) return custom
    }
  } catch {
    // 忽略读取错误（例如首次启动还没有记录）
  }
  return ''
}
