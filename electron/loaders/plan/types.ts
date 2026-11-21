/**
 * 声明式安装计划的数据模型
 * 计划层只描述「安装某个加载器需要下载什么、怎么执行、如何校验」，
 * 不包含执行细节，执行器与回滚日志都以计划为准。
 */
import type { LoaderBuild, LoaderKind } from '../catalog/types'

/** 安装阶段，与现有 InstallationProgress.stage 保持一致 */
export type PlanStage = 'downloading' | 'installing' | 'verifying' | 'complete' | 'error'

/** 计划中的一项下载 */
export interface PlanDownload {
  /** 逻辑标识，例如 installer */
  id: string
  url: string
  /** 相对游戏目录 temp 目录的文件名 */
  fileName: string
  headers?: Record<string, string>
}

/** 计划中的安装器执行方式 */
export interface PlanInstallerRun {
  kind: 'java-jar'
  /** 传给安装器的参数（不含 -jar 与安装器路径） */
  args: string[]
  /** 安装器超时时间（毫秒） */
  timeoutMs: number
}

/** 计划中的安装产物校验 */
export interface PlanVerify {
  loader: LoaderKind
  loaderVersion: string
}

/** 一次完整的加载器安装计划 */
export interface InstallPlan {
  taskId: string
  loader: LoaderKind
  mcVersion: string
  /** 归一化后的加载器版本（与官方元数据一致） */
  loaderVersion: string
  gameDir: string
  build: LoaderBuild
  downloads: PlanDownload[]
  run: PlanInstallerRun
  verify: PlanVerify
  /** 特殊流程说明，例如 NeoForge 1.20.1 使用 legacy 工件 */
  note?: string
}

/** 生成安装计划所需的输入 */
export interface InstallPlanRequest {
  loader: LoaderKind
  mcVersion: string
  gameDir: string
  /** 用户选择的加载器版本，缺省取推荐/最新稳定构建 */
  loaderVersion?: string
  /** 安装任务标识，缺省自动生成 */
  taskId?: string
}
