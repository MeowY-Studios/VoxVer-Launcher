/**
 * IPC 入参路径校验
 *
 * 渲染进程传给主进程的路径一律不可信：渲染层一旦被 XSS 拿下，就能借 IPC 读写/删除
 * 任意文件（报告里的 S-03）。这里统一做三步校验收口：
 *   1) 必须是绝对路径、无空字节；
 *   2) 规范化后必须落在受信任根目录内（自定义 MC 目录 / 已保存的游戏文件夹 /
 *      userData / 临时目录 / 应用安装目录）；
 *   3) 可选：限制扩展名、要求路径中包含某一段（如 config、screenshots）。
 *
 * 校验失败一律抛错，由各 IPC handler 的 try/catch 转成 { ok: false, error }。
 */
import { app } from 'electron'
import { isAbsolute, normalize, sep } from 'path'
import * as configService from '../services/config'

export interface PathGuardOptions {
  /** 失败提示里用的名字，如「Mod 路径」 */
  label?: string
  /** 允许的扩展名（含点，大小写不敏感），如 ['.jar', '.zip'] */
  extensions?: string[]
  /** 必须包含的路径片段（大小写不敏感），如 'config'、'screenshots' */
  segment?: string
  /** 额外受信任根目录（如 app.getPath('downloads')） */
  extraRoots?: string[]
}

/** 去掉末尾分隔符并统一分隔符，便于前缀比较 */
function normalizeRoot(p: string): string {
  return normalize(p).replace(/[\\/]+$/, '')
}

/** 受信任的根目录集合：启动器真正会操作的那些目录 */
export function getTrustedRoots(): string[] {
  const roots = new Set<string>()
  const add = (p: unknown) => {
    if (typeof p === 'string' && p.trim() && isAbsolute(p)) roots.add(normalizeRoot(p))
  }

  // 用户配置的游戏目录
  add(configService.getConfig<string>('custom_minecraft_path'))
  add(configService.getConfig<string>('last_selected_folder'))
  const folders = configService.getConfig<string[]>('game_folders') ?? []
  for (const f of folders) add(f)

  // 应用自身数据目录与临时目录（日志、皮肤缓存、导出中转都在这）
  // downloads 也算受信任：Mod / 皮肤通常是用户从浏览器下载后直接导入的
  for (const key of ['userData', 'temp', 'appData', 'downloads'] as const) {
    try {
      add(app.getPath(key))
    } catch {
      // 个别平台没有该目录，忽略
    }
  }
  try {
    add(app.getPath('exe'))
  } catch {
    // 同上
  }

  return [...roots]
}

/**
 * 校验并规范化渲染进程传入的路径
 * @returns 规范化后的绝对路径
 * @throws 路径非法 / 不在受信任目录内 / 扩展名或路径片段不符
 */
export function assertSafeIpcPath(raw: unknown, opts: PathGuardOptions = {}): string {
  const label = opts.label || '路径'

  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error(`${label}为空`)
  }
  if (raw.includes('\0')) {
    throw new Error(`${label}包含非法字符`)
  }
  if (!isAbsolute(raw)) {
    throw new Error(`${label}必须是绝对路径: ${raw}`)
  }

  const full = normalize(raw)
  const lower = full.toLowerCase()

  if (opts.extensions?.length) {
    const ok = opts.extensions.some((ext) => lower.endsWith(ext.toLowerCase()))
    if (!ok) {
      throw new Error(`${label}类型不允许: ${full}`)
    }
  }

  if (opts.segment) {
    const segments = lower.split(/[\\/]+/).filter(Boolean)
    if (!segments.includes(opts.segment.toLowerCase())) {
      throw new Error(`${label}不在 ${opts.segment} 目录下: ${full}`)
    }
  }

  const roots = [...getTrustedRoots(), ...(opts.extraRoots ?? [])].map((r) =>
    normalizeRoot(r).toLowerCase()
  )
  const within = roots.some((root) => {
    if (!root) return false
    return lower === root || lower.startsWith(root + sep) || lower.startsWith(root + '/')
  })
  if (!within) {
    throw new Error(`${label}不在受信任目录内: ${full}`)
  }

  return full
}

/** 图片类扩展名（截图 / 皮肤预览走这条） */
export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.svg']

/** Mod / 整合包压缩包扩展名 */
export const MOD_EXTENSIONS = ['.jar', '.zip', '.mrpack', '.disabled']
