import { ModrinthV2Client, ProjectVersion, SearchResult } from '@xmcl/modrinth'

const client = new ModrinthV2Client({
  headers: {
    'User-Agent': 'VoxVer-Launcher/1.0'
  }
})

/**
 * 获取项目的所有版本列表
 * @param projectId Modrinth 项目 ID
 * @param gameVersions Minecraft 版本过滤（可选）
 * @param loaders ModLoader 过滤（可选）
 */
export async function getProjectVersions(
  projectId: string,
  gameVersions?: string[],
  loaders?: string[]
): Promise<ProjectVersion[]> {
  return client.getProjectVersions(projectId, {
    gameVersions,
    loaders
  })
}

/**
 * 获取单个版本详情
 * @param versionId Modrinth 版本 ID
 */
export async function getProjectVersion(versionId: string): Promise<ProjectVersion> {
  return client.getProjectVersion(versionId)
}

/**
 * 搜索 Modrinth 项目
 * @param query 搜索关键词
 * @param limit 返回数量（默认 20）
 * @param offset 分页偏移
 */
export async function searchProjects(
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<SearchResult> {
  return client.searchProjects({
    query,
    limit,
    offset
  })
}

/** 批量获取项目信息 */
export async function getProjects(projectIds: string[]): Promise<import('@xmcl/modrinth').Project[]> {
  return client.getProjects(projectIds)
}

/** 暴露 ModrinthV2Client 实例供高级用法 */
export { client }
