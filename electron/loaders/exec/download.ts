/**
 * 安装器下载（带重试、超时与取消）
 * 加载器安装器体积较大，单次请求失败不应直接中断安装流程。
 */
import { promises as fs } from 'fs'
import * as path from 'path'
import axios from 'axios'
import { logger } from '../../utils/logger'

const log = logger.child('InstallDownload')

export interface DownloadOptions {
  url: string
  destPath: string
  headers?: Record<string, string>
  signal?: AbortSignal
  /** 最大尝试次数，默认 3 次 */
  attempts?: number
  /** 单次请求超时时间（毫秒） */
  timeoutMs?: number
  onProgress?: (progress: number) => void
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 下载文件，失败时按次数重试 */
export async function downloadWithRetry(options: DownloadOptions): Promise<void> {
  const attempts = Math.max(1, options.attempts ?? 3)
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (options.signal?.aborted) {
      throw new Error('安装已取消')
    }
    try {
      await downloadOnce(options)
      return
    } catch (error) {
      lastError = error
      log.warn(`下载失败（第 ${attempt}/${attempts} 次）: ${options.url}`, error)
      if (options.signal?.aborted) {
        throw new Error('安装已取消')
      }
      if (attempt < attempts) {
        await sleep(1000 * attempt)
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`下载失败: ${options.url}`)
}

/** 单次下载 */
async function downloadOnce(options: DownloadOptions): Promise<void> {
  const { url, destPath, headers, signal, timeoutMs = 600000, onProgress } = options
  await fs.mkdir(path.dirname(destPath), { recursive: true })

  const response = await axios({
    method: 'get',
    url,
    responseType: 'stream',
    headers,
    signal,
    timeout: timeoutMs
  })

  const totalSize = parseInt(String(response.headers['content-length'] ?? '0'), 10)
  let downloaded = 0

  const writer = await fs.open(destPath, 'w')
  const writeStream = writer.createWriteStream()

  return new Promise<void>((resolve, reject) => {
    let settled = false

    const cleanup = async (): Promise<void> => {
      try {
        await writer.close()
      } catch {
        // 忽略关闭失败
      }
      try {
        await fs.unlink(destPath)
      } catch {
        // 忽略清理失败
      }
    }

    const fail = (error: unknown): void => {
      if (settled) return
      settled = true
      void cleanup().then(() => reject(error))
    }

    response.data.on('data', (chunk: Buffer) => {
      downloaded += chunk.length
      if (totalSize > 0) {
        onProgress?.(downloaded / totalSize)
      }
    })

    writeStream.on('finish', () => {
      if (settled) return
      settled = true
      writer.close().then(
        () => resolve(),
        (error: unknown) => reject(error)
      )
    })

    writeStream.on('error', fail)
    response.data.on('error', fail)
    response.data.pipe(writeStream)
  })
}
