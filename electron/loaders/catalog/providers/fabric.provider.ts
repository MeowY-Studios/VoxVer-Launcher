/**
 * Fabric 元数据 provider
 * 数据源：Fabric Meta API
 * loader 列表接口不包含 installer 版本，需要单独查询 installer 接口。
 */
import axios from 'axios'
import { cached } from './cache'
import { isPrereleaseVersion } from '../version-utils'
import type { LoaderBuild } from '../types'

const FABRIC_META = 'https://meta.fabricmc.net/v2'
const FABRIC_MAVEN = 'https://maven.fabricmc.net'

function parseLoaderVersion(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null
  const loader = (value as { loader?: { version?: unknown } }).loader
  return typeof loader?.version === 'string' ? loader.version : null
}

function parseInstallerEntry(value: unknown): { version: string; stable: boolean } | null {
  if (typeof value !== 'object' || value === null) return null
  const entry = value as { version?: unknown; stable?: unknown }
  if (typeof entry.version !== 'string') return null
  return { version: entry.version, stable: entry.stable === true }
}

/** 指定 MC 版本的 Fabric Loader 版本列表 */
async function getLoaderVersions(mcVersion: string): Promise<string[]> {
  return cached(`fabric:loader:${mcVersion}`, async () => {
    const response = await axios.get(`${FABRIC_META}/versions/loader/${mcVersion}`)
    const data: unknown = response.data
    if (!Array.isArray(data)) return []
    return data
      .map((entry) => parseLoaderVersion(entry))
      .filter((version): version is string => typeof version === 'string')
  })
}

/** Fabric 安装器版本（优先 stable） */
async function getInstallerVersion(): Promise<string | null> {
  return cached('fabric:installer', async () => {
    const response = await axios.get(`${FABRIC_META}/versions/installer`)
    const data: unknown = response.data
    if (!Array.isArray(data)) return null
    const entries = data
      .map((entry) => parseInstallerEntry(entry))
      .filter((entry): entry is { version: string; stable: boolean } => entry !== null)
    return entries.find((entry) => entry.stable)?.version ?? entries[0]?.version ?? null
  })
}

/** 获取指定 MC 版本的 Fabric 构建 */
export async function getFabricBuilds(mcVersion: string): Promise<LoaderBuild[]> {
  const [loaders, installer] = await Promise.all([
    getLoaderVersions(mcVersion),
    getInstallerVersion()
  ])
  if (!installer || loaders.length === 0) return []

  return loaders.map<LoaderBuild>((version) => ({
    loader: 'fabric',
    mcVersion,
    version,
    installerVersion: installer,
    installerUrl: `${FABRIC_MAVEN}/net/fabricmc/fabric-installer/${installer}/fabric-installer-${installer}.jar`,
    prerelease: isPrereleaseVersion(version),
    support: 'A'
  }))
}
