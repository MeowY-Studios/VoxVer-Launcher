/**
 * Quilt 元数据 provider
 * 数据源：Quilt Meta API
 * loader 列表接口不包含 installer 版本，需要单独查询 installer 接口。
 */
import axios from 'axios'
import { cached } from './cache'
import { isPrereleaseVersion } from '../version-utils'
import type { LoaderBuild } from '../types'

const QUILT_META = 'https://meta.quiltmc.org/v3'
const QUILT_MAVEN = 'https://maven.quiltmc.org/repository/release'

function parseLoaderVersion(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null
  const loader = (value as { loader?: { version?: unknown } }).loader
  return typeof loader?.version === 'string' ? loader.version : null
}

function parseInstallerVersion(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null
  const version = (value as { version?: unknown }).version
  return typeof version === 'string' ? version : null
}

/** 指定 MC 版本的 Quilt Loader 版本列表 */
async function getLoaderVersions(mcVersion: string): Promise<string[]> {
  return cached(`quilt:loader:${mcVersion}`, async () => {
    const response = await axios.get(`${QUILT_META}/versions/loader/${mcVersion}`)
    const data: unknown = response.data
    if (!Array.isArray(data)) return []
    return data
      .map((entry) => parseLoaderVersion(entry))
      .filter((version): version is string => typeof version === 'string')
  })
}

/** Quilt 安装器版本（优先非预发布） */
async function getInstallerVersion(): Promise<string | null> {
  return cached('quilt:installer', async () => {
    const response = await axios.get(`${QUILT_META}/versions/installer`)
    const data: unknown = response.data
    if (!Array.isArray(data)) return null
    const versions = data
      .map((entry) => parseInstallerVersion(entry))
      .filter((version): version is string => typeof version === 'string')
    return versions.find((version) => !isPrereleaseVersion(version)) ?? versions[0] ?? null
  })
}

/** 获取指定 MC 版本的 Quilt 构建 */
export async function getQuiltBuilds(mcVersion: string): Promise<LoaderBuild[]> {
  const [loaders, installer] = await Promise.all([
    getLoaderVersions(mcVersion),
    getInstallerVersion()
  ])
  if (!installer || loaders.length === 0) return []

  return loaders.map<LoaderBuild>((version) => ({
    loader: 'quilt',
    mcVersion,
    version,
    installerVersion: installer,
    installerUrl: `${QUILT_MAVEN}/org/quiltmc/quilt-installer/${installer}/quilt-installer-${installer}.jar`,
    prerelease: isPrereleaseVersion(version),
    support: 'A'
  }))
}
