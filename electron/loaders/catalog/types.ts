/**
 * 加载器目录的数据模型
 * 目录层只负责「某 MC 版本存在哪些加载器构建」以及安装所需元数据，
 * 不关心安装过程；安装流程由执行器（后续阶段）统一处理。
 */

/** 参与目录编排的加载器类型 */
export type LoaderKind = 'forge' | 'neoforge' | 'fabric' | 'quilt'

/** 兼容性分级：A 完全支持 / B 特殊流程 / C 仅元数据 / D 不支持 */
export type SupportLevel = 'A' | 'B' | 'C' | 'D'

export interface LoaderBuild {
  loader: LoaderKind
  mcVersion: string
  /** 加载器版本：Forge 为 <mc>-<build>，NeoForge 1.20.1 为 <mc>-<build>，其余为加载器自身版本 */
  version: string
  /** 安装器下载地址 */
  installerUrl: string
  /** 安装器版本（Fabric/Quilt 需要） */
  installerVersion?: string
  /** 是否为预发布构建（beta/alpha/snapshot） */
  prerelease?: boolean
  /** 是否需要 legacy 工件或特殊流程 */
  legacy?: boolean
  /** 该构建的兼容性等级 */
  support: SupportLevel
  /** 等级说明，用于向用户解释为什么不能一键安装 */
  note?: string
}

export interface LoaderSupport {
  loader: LoaderKind
  mcVersion: string
  level: SupportLevel
  builds: LoaderBuild[]
  reason?: string
}

export interface LoaderCatalogProvider {
  readonly loader: LoaderKind
  getBuilds(mcVersion: string): Promise<LoaderBuild[]>
}
