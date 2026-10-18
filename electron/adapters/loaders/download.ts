/**
 * 加载器适配器共享的流式下载工具
 */
import { promises as fs } from 'fs'
import axios from 'axios'
import { logger } from '../../utils/logger'

const log = logger.child('LoaderDownload')

/**
 * 下载文件（带进度回调）
 * @param onProgress 进度回调，参数为 0~1；仅当响应头含 content-length 时触发
 */
export async function downloadFile(
  url: string,
  destPath: string,
  onProgress: (progress: number) => void
): Promise<void> {
  log.info(`[Download] 开始下载: ${url} -> ${destPath}`)

  const response = await axios({
    method: 'get',
    url,
    responseType: 'stream',
    timeout: 600000 // 10分钟超时
  })

  const totalSize = parseInt(
    (response.headers as Record<string, string>)['content-length'] || '0',
    10
  )
  let downloaded = 0

  const writer = await fs.open(destPath, 'w')
  const writeStream = writer.createWriteStream()

  response.data.on('data', (chunk: Buffer) => {
    downloaded += chunk.length
    if (totalSize > 0) {
      onProgress(downloaded / totalSize)
    }
  })

  response.data.pipe(writeStream)

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      writer.close()
      log.info(`[Download] 下载完成: ${destPath}`)
      resolve()
    })

    writeStream.on('error', async (err: Error) => {
      try {
        await writer.close()
        await fs.unlink(destPath)
      } catch {
        // 忽略清理失败，保留原始错误
      }
      log.error(`[Download] 下载失败:`, err)
      reject(err)
    })

    response.data.on('error', async (err: Error) => {
      try {
        await writer.close()
        await fs.unlink(destPath)
      } catch {
        // 忽略清理失败，保留原始错误
      }
      log.error(`[Download] 下载失败:`, err)
      reject(err)
    })
  })
}
