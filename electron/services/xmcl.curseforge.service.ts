/**
 * XMCL CurseForge 服务
 * 基于 @xmcl/curseforge 提供 CurseForge API 访问能力
 */
import {
  CurseforgeV1Client,
  ModsSearchSortField,
  FileReleaseType,
  FileModLoaderType
} from '@xmcl/curseforge'
import { logger } from '../utils/logger'

const log = logger.child('XMCL-CurseForge')

let client: CurseforgeV1Client | null = null

/** 初始化 CurseForge 客户端 */
export function initCurseforge(apiKey: string): void {
  client = new CurseforgeV1Client(apiKey)
  log.info('[initCurseforge] CurseForge 客户端已初始化')
}

/** 获取当前 CurseForge 客户端实例 */
export function getCurseforgeClient(): CurseforgeV1Client | null {
  return client
}

/** 搜索 Mod */
export async function searchMods(
  query: string,
  gameVersion?: string,
  options?: {
    pageSize?: number
    index?: number
    classId?: number
    modLoaderType?: FileModLoaderType
    sortField?: ModsSearchSortField
  }
): Promise<Record<string, unknown>> {
  if (!client) {
    log.warn('[searchMods] CurseForge 客户端未初始化，返回空结果')
    return { data: [] }
  }

  try {
    const result = await client.searchMods({
      searchFilter: query,
      gameVersion,
      pageSize: options?.pageSize ?? 20,
      index: options?.index ?? 0,
      classId: options?.classId,
      modLoaderType: options?.modLoaderType,
      sortField: options?.sortField ?? ModsSearchSortField.Popularity
    })
    return result
  } catch (e: unknown) {
    log.error(`[searchMods] 搜索失败: ${(e as Error).message}`)
    return { data: [] }
  }
}

export {
  CurseforgeV1Client,
  ModsSearchSortField,
  FileReleaseType,
  FileModLoaderType
}
