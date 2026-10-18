/**
 * 加载器适配器抽象基类
 * 提供进度上报、下载、运行 Java 安装器等公共能力
 */
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'
import type { ModLoaderType } from '../../types/adapter.types'
import { logger, type Logger } from '../../utils/logger'
import { downloadFile } from './download'
import type { ILoaderAdapter, InstallationProgress, LoaderInstallContext } from './ILoaderAdapter'

export abstract class BaseLoaderAdapter implements ILoaderAdapter {
  abstract readonly type: ModLoaderType
  abstract readonly name: string
  abstract readonly supportedVersions: string[]

  protected readonly log: Logger = logger.child(this.constructor.name)

  abstract getVersions(mcVersion: string): Promise<string[]>
  abstract install(ctx: LoaderInstallContext): Promise<void>

  supportsVersion(mcVersion: string): boolean {
    return this.supportedVersions.includes(mcVersion)
  }

  /** 上报进度 */
  protected report(
    ctx: LoaderInstallContext,
    stage: InstallationProgress['stage'],
    progress: number,
    message: string
  ): void {
    ctx.onProgress({ stage, progress, message })
  }

  /** 下载安装器到游戏目录 temp 下 */
  protected async downloadInstaller(
    url: string,
    gameDir: string,
    fileName: string,
    onProgress: (progress: number) => void
  ): Promise<string> {
    const destPath = path.join(gameDir, 'temp', fileName)
    await fs.mkdir(path.dirname(destPath), { recursive: true })
    await downloadFile(url, destPath, onProgress)
    return destPath
  }

  /**
   * 运行 Java 安装器（java -jar installer ...args）
   */
  protected async runJavaInstaller(installerPath: string, args: string[]): Promise<void> {
    const fullArgs = ['-jar', installerPath, ...args]
    this.log.info(`运行安装器: java ${fullArgs.join(' ')}`)

    return new Promise((resolve, reject) => {
      const child = spawn('java', fullArgs, {
        stdio: 'inherit',
        cwd: path.dirname(installerPath)
      })

      child.on('close', (code) => {
        if (code === 0) {
          this.log.info('安装器成功完成')
          resolve()
        } else {
          this.log.error(`安装器退出码: ${code}`)
          reject(new Error(`${this.name} 安装器失败，退出码: ${code}`))
        }
      })

      child.on('error', (err) => {
        this.log.error('运行安装器出错:', err)
        reject(err)
      })
    })
  }

  /** 清理临时安装器文件（失败时静默忽略） */
  protected async cleanupInstaller(installerPath: string): Promise<void> {
    try {
      await fs.unlink(installerPath)
    } catch {
      // 忽略清理失败
    }
  }
}
