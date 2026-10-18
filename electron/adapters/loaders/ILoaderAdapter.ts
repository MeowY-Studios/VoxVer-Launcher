/**
 * Mod 加载器适配器统一接口
 * Forge / NeoForge / Fabric / Quilt 各实现一个适配器，
 * 由 ModLoaderService 统一调度
 */
import type { ModLoaderType } from '../../types/adapter.types'

/** 安装进度 */
export interface InstallationProgress {
  stage: 'downloading' | 'installing' | 'verifying' | 'complete' | 'error'
  progress: number
  message: string
}

/** 加载器与安装器版本对（Fabric / Quilt 的元数据同时返回两者） */
export interface LoaderVersion {
  loader: string
  installer: string
}

/** 安装上下文 */
export interface LoaderInstallContext {
  /** 游戏数据目录（.minecraft 风格根目录） */
  gameDir: string
  /** Minecraft 版本号 */
  mcVersion: string
  /** 指定加载器版本，缺省时取最新/推荐版本 */
  loaderVersion?: string
  /** 进度上报回调 */
  onProgress: (progress: InstallationProgress) => void
}

export interface ILoaderAdapter {
  /** 加载器类型标识 */
  readonly type: ModLoaderType
  /** 展示名称 */
  readonly name: string
  /** 支持适配的 Minecraft 版本列表 */
  readonly supportedVersions: string[]

  /** 是否支持指定 MC 版本 */
  supportsVersion(mcVersion: string): boolean

  /** 获取指定 MC 版本可用的加载器版本列表（最新在前） */
  getVersions(mcVersion: string): Promise<string[]>

  /** 下载并安装加载器到游戏目录 */
  install(ctx: LoaderInstallContext): Promise<void>
}
