/**
 * XMCL ResourcePack 服务
 * 基于 @xmcl/resourcepack 提供 Minecraft 资源包解析能力
 */
import {
  readPackMetaAndIcon,
  ResourcePack
} from '@xmcl/resourcepack'
import { resolveFileSystem } from '@xmcl/system'
import { logger } from '../utils/logger'

const log = logger.child('XMCL-ResourcePack')

export interface PackMeta {
  pack: {
    pack_format: number
    description: string | { text?: string; extra?: Array<{ text?: string }> }
  }
  [key: string]: unknown
}

export interface PackInfo {
  metadata: PackMeta
  icon?: Buffer
}

/** 获取资源包元数据和图标 */
export async function getPackInfo(packPath: string): Promise<PackInfo | null> {
  try {
    log.info(`[getPackInfo] 读取资源包信息: ${packPath}`)
    const result = await readPackMetaAndIcon(packPath)
    return {
      metadata: result.metadata as unknown as PackMeta,
      icon: result.icon as Buffer | undefined
    }
  } catch (e: unknown) {
    log.warn(`[getPackInfo] 读取失败: ${(e as Error).message}`)
    return null
  }
}

/** 打开资源包文件系统，返回 ResourcePack 实例 */
export async function openResourcePack(packPath: string): Promise<ResourcePack | null> {
  try {
    log.info(`[openResourcePack] 打开资源包: ${packPath}`)
    const fs = await resolveFileSystem(packPath)
    return new ResourcePack(fs)
  } catch (e: unknown) {
    log.warn(`[openResourcePack] 打开失败: ${(e as Error).message}`)
    return null
  }
}

export { readPackMetaAndIcon, ResourcePack }
