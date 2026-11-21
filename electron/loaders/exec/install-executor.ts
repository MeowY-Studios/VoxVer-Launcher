/**
 * 安装执行器（InstallExecutor）
 * 按声明式计划完成下载、运行 Java 安装器、产物校验与失败回滚。
 * 适配器只需生成计划，不需要关心下载重试、Java 选择、日志与回滚细节。
 */
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'
import { logger } from '../../utils/logger'
import { verifyLoaderInstallation } from '../../adapters/loaders/artifact-verifier'
import { resolveInstallerJava } from '../../adapters/loaders/java-resolver'
import type { InstallationProgress } from '../../adapters/loaders/ILoaderAdapter'
import { InstallJournal } from '../journal/install-journal'
import type { InstallJournalSession } from '../journal/install-journal'
import { downloadWithRetry } from './download'
import type { InstallPlan } from '../plan/types'

const log = logger.child('InstallExecutor')

/** 安装器输出保留上限，避免日志无限增长 */
const MAX_OUTPUT_LENGTH = 20000

const LOADER_LABELS: Record<InstallPlan['loader'], string> = {
  forge: 'Forge',
  neoforge: 'NeoForge',
  fabric: 'Fabric',
  quilt: 'Quilt'
}

export interface InstallExecuteOptions {
  onProgress?: (progress: InstallationProgress) => void
  signal?: AbortSignal
}

export interface InstallResult {
  loader: InstallPlan['loader']
  mcVersion: string
  loaderVersion: string
  /** 校验通过的版本目录名 */
  versionId?: string
  /** 本次安装任务标识 */
  taskId: string
}

export class InstallExecutor {
  async execute(plan: InstallPlan, options: InstallExecuteOptions = {}): Promise<InstallResult> {
    const label = LOADER_LABELS[plan.loader]
    if (options.signal?.aborted) {
      throw new Error('安装已取消')
    }

    const journal = new InstallJournal(plan.gameDir)
    const session = await journal.begin({
      taskId: plan.taskId,
      loader: plan.loader,
      mcVersion: plan.mcVersion,
      loaderVersion: plan.loaderVersion
    })

    try {
      const installerPath = await this.downloadInstallers(plan, session, journal, options)

      this.report(options, 'installing', 45, `安装 ${label}...`)
      const installerOutput = await this.runInstaller(plan, installerPath, options)

      this.report(options, 'verifying', 90, '验证安装...')
      const verified = await verifyLoaderInstallation({
        gameDir: plan.gameDir,
        loader: plan.verify.loader,
        loaderVersion: plan.verify.loaderVersion
      })
      if (!verified.ok) {
        // 退出码为 0 但产物缺失时，把安装器输出带上，便于定位（如参数不被识别）
        const detail = this.extractFailureLine(installerOutput)
        throw new Error(
          `${label} 安装校验失败：${verified.reason}${detail ? `（安装器输出：${detail}）` : ''}`
        )
      }

      await journal.commit(session)
      this.report(options, 'complete', 100, `${label} 安装完成！`)

      return {
        loader: plan.loader,
        mcVersion: plan.mcVersion,
        loaderVersion: plan.loaderVersion,
        versionId: verified.versionId,
        taskId: plan.taskId
      }
    } catch (error) {
      log.error(`[${label}] 安装失败，开始回滚:`, error)
      try {
        await journal.rollback(session)
      } catch (rollbackError) {
        log.error(`[${label}] 回滚失败，可能残留部分文件:`, rollbackError)
      }
      throw error
    }
  }

  /** 下载计划中的全部安装器，返回主安装器路径 */
  private async downloadInstallers(
    plan: InstallPlan,
    session: InstallJournalSession,
    journal: InstallJournal,
    options: InstallExecuteOptions
  ): Promise<string> {
    const tempDir = path.join(plan.gameDir, 'temp')
    let installerPath = ''
    const total = plan.downloads.length

    for (let index = 0; index < total; index++) {
      const download = plan.downloads[index]
      const baseProgress = 5 + (index / total) * 35
      const span = 35 / total
      const destPath = path.join(tempDir, download.fileName)

      this.report(options, 'downloading', baseProgress, `下载 ${download.fileName}...`)
      await downloadWithRetry({
        url: download.url,
        destPath,
        headers: download.headers,
        signal: options.signal,
        onProgress: (progress) => {
          this.report(
            options,
            'downloading',
            baseProgress + progress * span,
            `下载中... ${Math.round(progress * 100)}%`
          )
        }
      })
      await journal.recordTempFile(session, destPath)

      if (index === 0) {
        installerPath = destPath
      }
    }

    return installerPath
  }

  /** 运行 Java 安装器（带超时与取消） */
  private async runInstaller(
    plan: InstallPlan,
    installerPath: string,
    options: InstallExecuteOptions
  ): Promise<string> {
    const label = LOADER_LABELS[plan.loader]
    const java = await resolveInstallerJava(plan.gameDir, plan.mcVersion)
    const args = ['-jar', installerPath, ...plan.run.args]
    log.info(
      `运行 ${label} 安装器（Java ${java.majorVersion || '未知'}，要求 ${java.requiredMajor}）: ${java.path} ${args.join(' ')}`
    )

    return new Promise<string>((resolve, reject) => {
      const child = spawn(java.path, args, {
        cwd: path.dirname(installerPath),
        windowsHide: true
      })

      let output = ''
      let settled = false

      const finish = (error?: Error): void => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        options.signal?.removeEventListener('abort', onAbort)
        if (error) {
          reject(error)
        } else {
          resolve(output)
        }
      }

      const onAbort = (): void => {
        child.kill()
        finish(new Error('安装已取消'))
      }

      const timer = setTimeout(() => {
        child.kill()
        finish(
          new Error(
            `${label} 安装器执行超时（${Math.round(plan.run.timeoutMs / 60000)} 分钟）`
          )
        )
      }, plan.run.timeoutMs)

      options.signal?.addEventListener('abort', onAbort, { once: true })

      const append = (chunk: Buffer): void => {
        output += chunk.toString('utf8')
        if (output.length > MAX_OUTPUT_LENGTH) {
          output = output.slice(-MAX_OUTPUT_LENGTH)
        }
      }
      child.stdout?.on('data', append)
      child.stderr?.on('data', append)

      child.on('close', (code) => {
        if (code === 0) {
          log.info(`${label} 安装器执行完成`)
          finish()
          return
        }
        log.error(`${label} 安装器退出码: ${code}\n${output}`)
        const detail = this.extractFailureLine(output)
        finish(
          new Error(
            `${label} 安装器失败（退出码 ${code}）${detail ? `：${detail}` : '，请查看日志了解详情'}`
          )
        )
      })

      child.on('error', (error) => {
        log.error(`运行 ${label} 安装器出错:`, error)
        finish(error)
      })
    })
  }

  /** 从安装器输出中提取最可能说明失败原因的一行 */
  private extractFailureLine(output: string): string {
    const lines = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    for (let i = lines.length - 1; i >= 0; i--) {
      if (/exception|error|failed|失败/i.test(lines[i])) {
        return lines[i]
      }
    }
    return lines[lines.length - 1] ?? ''
  }

  /** 上报进度（未提供回调时静默忽略） */
  private report(
    options: InstallExecuteOptions,
    stage: InstallationProgress['stage'],
    progress: number,
    message: string
  ): void {
    options.onProgress?.({ stage, progress, message })
  }
}

export const installExecutor = new InstallExecutor()
