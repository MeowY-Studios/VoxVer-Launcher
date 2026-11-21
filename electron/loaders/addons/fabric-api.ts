/**
 * Fabric API 模组支持
 * Fabric API 与 Fabric Loader 独立发布，安装 Loader 后作为普通模组放入 mods 即可。
 * 版本列表从 Fabric Maven 元数据解析，按「+<MC 版本>」后缀精确匹配。
 */
import { promises as fs } from 'fs'
import * as path from 'path'
import axios from 'axios'
import { downloadFile } from '../../adapters/loaders/download'

const FABRIC_MAVEN = 'https://maven.fabricmc.net'
const FABRIC_API_ARTIFACT = 'net/fabricmc/fabric-api/fabric-api'

/** Fabric API 的 jar 下载地址 */
export function fabricApiJarUrl(version: string): string {
  return `${FABRIC_MAVEN}/${FABRIC_API_ARTIFACT}/${version}/fabric-api-${version}.jar`
}

/** 从 Maven 元数据获取指定 MC 版本的 Fabric API 版本（最新在前） */
export async function getFabricApiVersions(mcVersion: string): Promise<string[]> {
  const response = await axios.get(`${FABRIC_MAVEN}/${FABRIC_API_ARTIFACT}/maven-metadata.xml`, {
    timeout: 20000,
    responseType: 'text'
  })
  const xml = String(response.data)
  const versions: string[] = []
  for (const match of xml.matchAll(/<version>([^<]+)<\/version>/g)) {
    const version = match[1].trim()
    // Fabric API 版本形如 0.92.2+1.20.1，+ 后缀即目标 MC 版本
    if (version.endsWith(`+${mcVersion}`)) versions.push(version)
  }
  // Maven 元数据按发布时间升序，反转后最新版本在前
  return versions.reverse()
}

/**
 * 下载 Fabric API 并放入 mods
 * 返回最终模组文件路径。
 */
export async function installFabricApiMod(
  gameDir: string,
  mcVersion: string,
  requestedVersion: string | undefined,
  onDownload: (progress: number) => void
): Promise<string> {
  const versions = await getFabricApiVersions(mcVersion)
  const targetVersion =
    requestedVersion && versions.includes(requestedVersion) ? requestedVersion : versions[0]
  if (!targetVersion) {
    throw new Error(`Minecraft ${mcVersion} 没有可用的 Fabric API 版本`)
  }

  const fileName = `fabric-api-${targetVersion}.jar`
  const tempPath = path.join(gameDir, 'temp', fileName)
  await fs.mkdir(path.dirname(tempPath), { recursive: true })
  await downloadFile(fabricApiJarUrl(targetVersion), tempPath, onDownload)

  const modsDir = path.join(gameDir, 'mods')
  await fs.mkdir(modsDir, { recursive: true })
  const destPath = path.join(modsDir, fileName)
  // 与 OptiFine 一致：临时文件与 mods 同属游戏目录，直接重命名
  await fs.rename(tempPath, destPath)
  return destPath
}
