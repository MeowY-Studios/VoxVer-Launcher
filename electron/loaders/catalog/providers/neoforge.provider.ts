/**
 * NeoForge 元数据 provider
 * 数据源：maven.neoforged.net 的 Maven 版本 API
 * - 1.20.1：legacy 工件 net/neoforged/forge，版本 <mc>-<build>
 * - 1.20.2+：net/neoforged/neoforge，版本 <去前缀的 MC 版本>.<build>
 */
import axios from 'axios'
import { cached } from './cache'
import { isPrereleaseVersion, sortBuilds } from '../version-utils'
import type { LoaderBuild } from '../types'

const NEOFORGE_MAVEN = 'https://maven.neoforged.net/releases'
const NEOFORGE_META = 'https://maven.neoforged.net'

const MODERN_ARTIFACT = 'net/neoforged/neoforge'
const LEGACY_ARTIFACT = 'net/neoforged/forge'

/** 获取指定工件的全部版本（带缓存） */
async function getArtifactVersions(artifactPath: string): Promise<string[]> {
  return cached(`neoforge:${artifactPath}`, async () => {
    const response = await axios.get(
      `${NEOFORGE_META}/api/maven/versions/releases/${artifactPath}`
    )
    const data: unknown = response.data
    if (typeof data !== 'object' || data === null) return []
    const versions = (data as { versions?: unknown }).versions
    if (!Array.isArray(versions)) return []
    return versions.filter((version): version is string => typeof version === 'string')
  })
}

/**
 * MC 版本转 NeoForge 版本前缀候选（按精确度排序）
 * 例：1.20.2 → 20.2.x / 1.21 → 21.0.x / 26.2 → 26.2.0.x / 26.1.2 → 26.1.2.x
 */
export function neoForgePrefixCandidates(mcVersion: string): string[] {
  const stripped = mcVersion.replace(/^1\./, '')
  const parts = stripped.split('.')
  if (parts.length >= 3) return [`${stripped}.`]
  return [`${stripped}.0.`, `${stripped}.`]
}

/** NeoForge 安装器下载地址 */
export function buildNeoForgeInstallerUrl(version: string, legacy: boolean): string {
  if (legacy) {
    return `${NEOFORGE_MAVEN}/${LEGACY_ARTIFACT}/${version}/forge-${version}-installer.jar`
  }
  return `${NEOFORGE_MAVEN}/${MODERN_ARTIFACT}/${version}/neoforge-${version}-installer.jar`
}

/** legacy 版本补全 MC 前缀：47.1.106 → 1.20.1-47.1.106 */
export function normalizeNeoForgeLegacyVersion(raw: string): string {
  const value = raw.trim()
  return value.startsWith('1.20.1-') ? value : `1.20.1-${value}`
}

/** 获取指定 MC 版本的 NeoForge 构建 */
export async function getNeoForgeBuilds(mcVersion: string): Promise<LoaderBuild[]> {
  if (mcVersion === '1.20.1') {
    const versions = await getArtifactVersions(LEGACY_ARTIFACT)
    const builds = versions
      .filter((version) => version.startsWith('1.20.1-'))
      .map<LoaderBuild>((version) => ({
        loader: 'neoforge',
        mcVersion,
        version,
        installerUrl: buildNeoForgeInstallerUrl(version, true),
        prerelease: isPrereleaseVersion(version),
        legacy: true,
        support: 'B',
        note: '1.20.1 使用 NeoForge legacy 工件安装'
      }))
    return sortBuilds(builds)
  }

  const allVersions = await getArtifactVersions(MODERN_ARTIFACT)
  for (const prefix of neoForgePrefixCandidates(mcVersion)) {
    const matched = allVersions.filter((version) => version.startsWith(prefix))
    if (matched.length === 0) continue
    const builds = matched.map<LoaderBuild>((version) => ({
      loader: 'neoforge',
      mcVersion,
      version,
      installerUrl: buildNeoForgeInstallerUrl(version, false),
      prerelease: isPrereleaseVersion(version),
      support: 'A'
    }))
    return sortBuilds(builds)
  }

  return []
}
