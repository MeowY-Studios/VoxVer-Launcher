/**
 * XMCL File-Transfer 下载服务
 * 基于 @xmcl/file-transfer 提供高性能下载能力
 */
import { download, createProgressController } from '@xmcl/file-transfer'
import { logger } from '../utils/logger'

const log = logger.child('XMCL-Download')

export async function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (downloaded: number, total: number, speed: number) => void
): Promise<void> {
  log.info(`[downloadFile] 开始下载: ${url} -> ${destPath}`)

  await download({
    url,
    destination: destPath,
    progressController: onProgress
      ? createProgressController((_url, _chunkSize, written, total) => {
          onProgress(written, total, 0)
        })
      : undefined
  })

  log.info(`[downloadFile] 下载完成: ${destPath}`)
}

export { download }
