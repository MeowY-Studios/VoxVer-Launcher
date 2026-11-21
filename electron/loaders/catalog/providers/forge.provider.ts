/**
 * Forge 元数据 provider
 * 数据源：Maven metadata（全量构建）与 promotions_slim.json（推荐版本）
 */
import axios from 'axios'
import { cached } from './cache'
import { compareNumericVersion, isPrereleaseVersion, sortBuilds } from '../version-utils'
import type { LoaderBuild } from '../types'

const FORGE_MAVEN = 'https://maven.minecraftforge.net'
const FORGE_MAVEN_META = `${FORGE_MAVEN}/net/minecraftforge/forge/maven-metadata.xml`
const FORGE_PROMO_URL =
  'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'

const MAVEN_CACHE_KEY = 'forge:maven'
const PROMO_CACHE_KEY = 'forge:promotions'

interface ForgePromotions {
  promos: Record<string, string>
}

/** 解析 Maven metadata 中的全部 Forge 版本 */
function parseMavenMetadata(xml: string): string[] {
  const versions = new Set<string>()
  const versionRegex = /<version>([^<]+)<\/version>/g
  let match: RegExpExecArray | null
  while ((match = versionRegex.exec(xml)) !== null) {
    const version = match[1].trim()
    if (version) versions.add(version)
  }
  return [...versions]
}

/** 获取 Maven 中的全部 Forge 版本（带缓存） */
export async function getAllForgeVersions(): Promise<string[]> {
  return cached(MAVEN_CACHE_KEY, async () => {
    const response = await axios.get(FORGE_MAVEN_META, { responseType: 'text' })
    return parseMavenMetadata(String(response.data))
  })
}

/** Forge 安装器下载地址 */
export function buildForgeInstallerUrl(version: string): string {
  return `${FORGE_MAVEN}/net/minecraftforge/forge/${version}/forge-${version}-installer.jar`
}

/**
 * 1.7.2 之前的 Forge 没有可用的现代安装器
 * 对应计划 D1：1.1–1.6.4 暂标 C 级，不在一键安装范围内。
 */
export function isLegacyForgeMcVersion(mcVersion: string): boolean {
  if (!mcVersion.startsWith('1.')) return false
  return compareNumericVersion(mcVersion, '1.7.2') < 0
}

/** 获取指定 MC 版本的 Forge 构建 */
export async function getForgeBuilds(mcVersion: string): Promise<LoaderBuild[]> {
  const allVersions = await getAllForgeVersions()
  const prefix = `${mcVersion}-`
  const legacy = isLegacyForgeMcVersion(mcVersion)

  const builds = allVersions
    .filter((version) => version.startsWith(prefix))
    .map<LoaderBuild>((version) => ({
      loader: 'forge',
      mcVersion,
      version,
      installerUrl: buildForgeInstallerUrl(version),
      prerelease: isPrereleaseVersion(version),
      legacy,
      support: legacy ? 'C' : 'A',
      note: legacy ? '该 Minecraft 版本的 Forge 没有现代安装器，暂不支持一键安装' : undefined
    }))

  return sortBuilds(builds)
}

/** 获取指定 MC 版本的推荐/最新 Forge 版本 */
export async function getForgeRecommendedVersion(mcVersion: string): Promise<string | null> {
  const promotions = await cached<ForgePromotions>(PROMO_CACHE_KEY, async () => {
    const response = await axios.get(FORGE_PROMO_URL)
    const data: unknown = response.data
    if (typeof data !== 'object' || data === null) {
      return { promos: {} }
    }
    const promos = (data as { promos?: unknown }).promos
    if (typeof promos !== 'object' || promos === null) {
      return { promos: {} }
    }
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(promos)) {
      if (typeof value === 'string') result[key] = value
    }
    return { promos: result }
  })

  const recommended = promotions.promos[`${mcVersion}-recommended`]
  const latest = promotions.promos[`${mcVersion}-latest`]
  const build = recommended ?? latest
  return build ? `${mcVersion}-${build}` : null
}
