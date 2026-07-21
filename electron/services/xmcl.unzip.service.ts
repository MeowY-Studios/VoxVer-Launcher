/**
 * XMCL Unzip 解压服务
 * 基于 @xmcl/unzip 提供 ZIP 解压能力，用于整合包导入等场景
 */
import { open, walkEntriesGenerator, openEntryReadStream } from '@xmcl/unzip'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import * as path from 'path'
import { pipeline } from 'stream'
import { promisify } from 'util'
import { logger } from '../utils/logger'

const log = logger.child('XMCL-Unzip')
const pipelineAsync = promisify(pipeline)

export async function extractZip(
  zipPath: string,
  destDir: string,
  onProgress?: (current: string, count: number) => void
): Promise<number> {
  log.info(`[extractZip] 开始解压: ${zipPath} -> ${destDir}`)

  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true })
  }

  const zip = await open(zipPath, { lazyEntries: true, autoClose: false })

  let count = 0
  try {
    for await (const entry of walkEntriesGenerator(zip)) {
      const entryPath = path.join(destDir, entry.fileName)

      if (/\/$/.test(entry.fileName)) {
        // 目录
        if (!existsSync(entryPath)) {
          mkdirSync(entryPath, { recursive: true })
        }
      } else {
        // 文件
        const parentDir = path.dirname(entryPath)
        if (!existsSync(parentDir)) {
          mkdirSync(parentDir, { recursive: true })
        }

        const readStream = await openEntryReadStream(zip, entry)
        const writeStream = createWriteStream(entryPath)
        await pipelineAsync(readStream, writeStream)
      }

      count++
      if (onProgress) {
        onProgress(entry.fileName, count)
      }
    }
  } finally {
    zip.close()
  }

  log.info(`[extractZip] 解压完成，共 ${count} 个条目`)
  return count
}

export { open, walkEntriesGenerator, openEntryReadStream }
