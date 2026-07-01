/**
 * 内容服务单例管理
 * 统一管理 CurseForge + Modrinth 内容服务实例
 */
import { ContentService } from './content.service'
import { DownloadService } from './download.service'

let _contentService: ContentService | null = null
let _initPromise: Promise<ContentService> | null = null

/**
 * 初始化内容服务（在 app.whenReady() 中调用一次）
 */
export function initializeContentService(
  curseForgeApiKey: string,
  modrinthUserAgent: string,
  downloadService: DownloadService
): ContentService {
  _contentService = new ContentService(curseForgeApiKey, modrinthUserAgent, downloadService)
  return _contentService
}

/**
 * 异步初始化内容服务，返回 Promise（供 IPC handler 等待就绪）
 */
export function initializeContentServiceAsync(
  curseForgeApiKey: Promise<string> | string,
  modrinthUserAgent: string,
  downloadService: DownloadService | Promise<DownloadService>
): Promise<ContentService> {
  _initPromise = (async () => {
    const [apiKey, ds] = await Promise.all([
      Promise.resolve(curseForgeApiKey),
      Promise.resolve(downloadService)
    ])
    _contentService = new ContentService(apiKey, modrinthUserAgent, ds)
    return _contentService
  })()
  return _initPromise
}

/**
 * 获取内容服务单例（同步，未初始化时抛错）
 */
export function getContentService(): ContentService {
  if (!_contentService) {
    throw new Error('ContentService 未初始化，请先调用 initializeContentService()')
  }
  return _contentService
}

/**
 * 等待内容服务就绪（异步，供 IPC handler 使用）
 * 如果已初始化则立即返回，否则等待异步初始化完成
 */
export async function waitForContentService(timeoutMs = 5000): Promise<ContentService> {
  if (_contentService) return _contentService
  if (_initPromise) {
    return Promise.race([
      _initPromise,
      new Promise<ContentService>((_, reject) =>
        setTimeout(() => reject(new Error('ContentService 初始化超时')), timeoutMs)
      )
    ])
  }
  throw new Error('ContentService 未初始化，请先调用 initializeContentService()')
}
