/**
 * 加载器适配器抽象基类
 * 元数据由 loader catalog 提供，安装流程统一交给 InstallPlanner + InstallExecutor，
 * 子类只需声明加载器类型与版本查询方式。
 */
import type { ModLoaderType } from '../../types/adapter.types'
import { logger, type Logger } from '../../utils/logger'
import { installExecutor } from '../../loaders/exec'
import { installPlanner } from '../../loaders/plan'
import type { ILoaderAdapter, LoaderInstallContext } from './ILoaderAdapter'

export abstract class BaseLoaderAdapter implements ILoaderAdapter {
  abstract readonly type: ModLoaderType
  abstract readonly name: string
  abstract readonly supportedVersions: string[]

  protected readonly log: Logger = logger.child(this.constructor.name)

  abstract getVersions(mcVersion: string): Promise<string[]>

  supportsVersion(mcVersion: string): boolean {
    return this.supportedVersions.includes(mcVersion)
  }

  /**
   * 是否支持指定 MC 版本
   * 以加载器官方元数据为准，静态白名单只作为网络失败时的兜底。
   * ! 不能再用白名单短路：白名单过期会显示支持但安装必然失败。
   */
  async isSupported(mcVersion: string): Promise<boolean> {
    try {
      const versions = await this.getVersions(mcVersion)
      return versions.length > 0
    } catch {
      return this.supportsVersion(mcVersion)
    }
  }

  /** 安装加载器：生成声明式计划后交给统一执行器 */
  async install(ctx: LoaderInstallContext): Promise<void> {
    const plan = await installPlanner.plan({
      loader: this.type,
      mcVersion: ctx.mcVersion,
      gameDir: ctx.gameDir,
      loaderVersion: ctx.loaderVersion,
      taskId: ctx.taskId
    })
    await installExecutor.execute(plan, {
      onProgress: ctx.onProgress,
      signal: ctx.signal
    })
  }
}
