/**
 * I18n 汉化模组智能跳过
 *
 * 背景：I18nUpdateMod（i18nupdatemod）每次游戏启动都会把 1.18/1.19/1.20 三个语言包
 *       重新解压合并并写回 resourcepacks，在 HDD 上造成额外的合并与写盘耗时。
 *       模组本身没有"跳过合并、复用已有包"的开关。
 *
 * 本服务在游戏启动前通过"快照对比 + JAR 文件改名"控制是否让模组运行：
 *   - mods 目录相对上次快照无新增 → 把 I18nUpdateMod-*.jar 改名为 *.jar.disabled，
 *     Forge 启动时不加载它，跳过合并与写盘，直接复用已生成的语言包。
 *   - mods 目录有新增/变动 或 首次运行 → 确保 I18n jar 处于启用状态，让模组重新生成语言包，
 *     并更新快照，作为新的基线。
 *
 * 可逆性：只改文件名后缀，随时可手动改回 .jar 恢复模组运行。
 * 文件名约定：启用的模组为 `I18nUpdateMod-xxx.jar`，跳过时为 `I18nUpdateMod-xxx.jar.disabled`。
 */
import * as fs from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { getDatabase } from './database'
import { logger } from '../utils/logger'

const log = logger.child('I18nMod')

/** 模组 jar 文件名前缀（精确匹配，避免误伤其它同名前缀文件） */
const I18N_JAR_PREFIX = 'I18nUpdateMod-'
const I18N_JAR_SUFFIX = '.jar'
const I18N_DISABLED_SUFFIX = '.jar.disabled'

/** 快照在 configs 表中的 key */
const SNAPSHOT_KEY = 'i18n_mods_snapshot'

/** mods 目录快照：文件清单的 md5，用于判断是否有新增/变动的模组文件 */
function hashModsDir(modsDir: string): string {
  if (!fs.existsSync(modsDir)) return ''
  const names = fs
    .readdirSync(modsDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .sort()
  // 忽略 I18n 自身及其 disabled 状态，避免"改名"本身被当作 mods 变动
  const filtered = names.filter((n) => !n.startsWith(I18N_JAR_PREFIX))
  return createHash('md5').update(filtered.join('\n')).digest('hex')
}

/** 读取历史快照 */
function loadSnapshot(gamePath: string): string | null {
  try {
    const db = getDatabase()
    const row = db.prepare('SELECT value FROM configs WHERE key = ?').get(SNAPSHOT_KEY) as
      | { value: string }
      | undefined
    if (!row?.value) return null
    const map = JSON.parse(row.value) as Record<string, string>
    return map[gamePath] ?? null
  } catch (e: unknown) {
    log.warn(`[snapshot] 读取快照失败: ${(e as Error).message}`)
    return null
  }
}

/** 保存当前快照 */
function saveSnapshot(gamePath: string, hash: string): void {
  try {
    const db = getDatabase()
    const prev = loadSnapshotAll()
    prev[gamePath] = hash
    db.prepare(
      `INSERT INTO configs (key, value, type, updated_at)
       VALUES (?, ?, 'json', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, type = excluded.type, updated_at = excluded.updated_at`
    ).run(SNAPSHOT_KEY, JSON.stringify(prev), new Date().toISOString())
  } catch (e: unknown) {
    log.warn(`[snapshot] 保存快照失败: ${(e as Error).message}`)
  }
}

function loadSnapshotAll(): Record<string, string> {
  try {
    const db = getDatabase()
    const row = db.prepare('SELECT value FROM configs WHERE key = ?').get(SNAPSHOT_KEY) as
      | { value: string }
      | undefined
    if (!row?.value) return {}
    const parsed = JSON.parse(row.value) as Record<string, string>
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

/** 在 mods 目录内查找 I18n 模组 jar（启用或禁用态） */
function findI18nJar(modsDir: string): { enabled: string | null; disabled: string | null } {
  let enabled: string | null = null
  let disabled: string | null = null
  if (!fs.existsSync(modsDir)) return { enabled, disabled }
  for (const name of fs.readdirSync(modsDir)) {
    if (!name.startsWith(I18N_JAR_PREFIX)) continue
    if (name.endsWith(I18N_DISABLED_SUFFIX)) disabled = name
    else if (name.endsWith(I18N_JAR_SUFFIX)) enabled = name
  }
  return { enabled, disabled }
}

/**
 * 游戏启动前调用：确保 I18n 模组 jar 处于正确状态。
 * 传入最终游戏数据目录（mods 所在目录）。返回 true 表示模组本次会运行，false 表示被跳过。
 */
export function ensureI18nModEnabledByChanges(gamePath: string): boolean {
  const modsDir = join(gamePath, 'mods')
  const { enabled, disabled } = findI18nJar(modsDir)

  // 实例里根本没有 I18n 模组，无需处理
  if (!enabled && !disabled) {
    return false
  }

  const currentHash = hashModsDir(modsDir)
  const lastHash = loadSnapshot(gamePath)

  // 首次运行（无快照）或 mods 有变动 → 让模组运行并更新基线
  if (lastHash === null || lastHash !== currentHash) {
    if (disabled && !enabled) {
      const src = join(modsDir, disabled)
      const dst = join(modsDir, disabled.slice(0, -I18N_DISABLED_SUFFIX.length) + I18N_JAR_SUFFIX)
      try {
        fs.renameSync(src, dst)
        log.info(`[i18n] mods 有变动，恢复 I18n 模组: ${disabled} -> ${dst}`)
      } catch (e: unknown) {
        log.warn(`[i18n] 恢复 I18n 模组失败: ${(e as Error).message}`)
      }
    }
    // 更新基线（记录本次 mods 状态），即使启用失败也记录，避免下次无谓重试
    saveSnapshot(gamePath, currentHash)
    return true
  }

  // 无变动 → 跳过模组（把启用态改成 disabled）
  if (enabled && !disabled) {
    const src = join(modsDir, enabled)
    const dst = join(modsDir, enabled.slice(0, -I18N_JAR_SUFFIX.length) + I18N_DISABLED_SUFFIX)
    try {
      fs.renameSync(src, dst)
      log.info(`[i18n] mods 无变动，跳过 I18n 模组: ${enabled} -> ${dst}`)
    } catch (e: unknown) {
      log.warn(`[i18n] 跳过 I18n 模组失败: ${(e as Error).message}`)
    }
    return false
  }

  // 已是 disabled 且无变动 → 保持跳过
  return false
}
