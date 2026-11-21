/**
 * 加载器安装产物统一校验
 * 安装器退出码为 0 并不代表产物齐全，必须确认 versions 下存在引用对应加载器库的版本 JSON。
 * 各适配器安装完成后都走这里，避免出现「提示安装完成但版本列表里没有」的情况。
 */
import { promises as fs } from 'fs'
import * as path from 'path'
import type { ModLoaderType } from '../../types/adapter.types'

interface LoaderArtifactSpec {
  group: string
  artifacts: string[]
}

/** 各加载器的核心库坐标（同一加载器可能存在多个历史工件名） */
const LOADER_ARTIFACTS: Record<ModLoaderType, LoaderArtifactSpec> = {
  forge: { group: 'net.minecraftforge', artifacts: ['forge', 'fmlloader'] },
  neoforge: { group: 'net.neoforged', artifacts: ['neoforge', 'forge', 'fmlloader'] },
  fabric: { group: 'net.fabricmc', artifacts: ['fabric-loader'] },
  quilt: { group: 'org.quiltmc', artifacts: ['quilt-loader'] }
}

export interface LoaderVerifyResult {
  ok: boolean
  /** 校验通过的版本目录名 */
  versionId?: string
  /** 校验失败原因 */
  reason?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** 解析 Maven 坐标 group:artifact:version[:classifier] */
function parseLibraryName(name: unknown): { group: string; artifact: string; version: string } | null {
  if (typeof name !== 'string') return null
  const [group, artifact, version] = name.split(':')
  if (!group || !artifact || !version) return null
  return { group, artifact, version }
}

/** 读取版本 JSON，非版本 JSON 或不可读时返回 null */
async function readVersionJson(filePath: string): Promise<Record<string, unknown> | null> {
  let raw: string
  try {
    raw = await fs.readFile(filePath, 'utf8')
  } catch {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  return isRecord(parsed) ? parsed : null
}

/**
 * 判断某个版本目录是否引用了指定加载器
 * 用于安装失败回滚时识别本次安装新建的版本目录，避免误删原有版本。
 */
export async function versionDirectoryReferencesLoader(
  gameDir: string,
  versionId: string,
  loader: ModLoaderType
): Promise<boolean> {
  const spec = LOADER_ARTIFACTS[loader]
  const data = await readVersionJson(
    path.join(gameDir, 'versions', versionId, `${versionId}.json`)
  )
  if (!data || !Array.isArray(data.libraries)) return false

  return data.libraries.some((lib) => {
    if (!isRecord(lib)) return false
    const coordinate = parseLibraryName(lib.name)
    return (
      !!coordinate &&
      coordinate.group === spec.group &&
      spec.artifacts.includes(coordinate.artifact)
    )
  })
}

/**
 * 校验加载器是否真的安装到了游戏目录
 * @param gameDir 游戏根目录（其下应有 versions 目录）
 * @param loader 加载器类型
 * @param loaderVersion 期望的加载器版本；为空时只校验加载器库是否存在
 */
export async function verifyLoaderInstallation(params: {
  gameDir: string
  loader: ModLoaderType
  loaderVersion: string
}): Promise<LoaderVerifyResult> {
  const { gameDir, loader, loaderVersion } = params
  const spec = LOADER_ARTIFACTS[loader]
  const versionsDir = path.join(gameDir, 'versions')

  let entries: string[]
  try {
    entries = await fs.readdir(versionsDir)
  } catch {
    return { ok: false, reason: `版本目录不存在：${versionsDir}` }
  }

  const expected = loaderVersion.trim()
  const mismatched = new Set<string>()

  for (const entry of entries) {
    const jsonPath = path.join(versionsDir, entry, `${entry}.json`)
    const data = await readVersionJson(jsonPath)
    if (!data || !Array.isArray(data.libraries)) continue

    for (const lib of data.libraries) {
      if (!isRecord(lib)) continue
      const coordinate = parseLibraryName(lib.name)
      if (!coordinate) continue
      if (coordinate.group !== spec.group || !spec.artifacts.includes(coordinate.artifact)) continue

      if (expected && coordinate.version !== expected) {
        mismatched.add(`${coordinate.artifact}:${coordinate.version}`)
        continue
      }
      return { ok: true, versionId: entry }
    }
  }

  const expectedText = expected ? ` ${expected}` : ''
  const foundText = mismatched.size > 0 ? `（找到其他版本：${[...mismatched].join('、')}）` : ''
  return {
    ok: false,
    reason: `未在 versions 目录找到包含 ${spec.group}:${spec.artifacts.join('/')}${expectedText} 的版本 JSON${foundText}`
  }
}
