/**
 * 安装计划生成器（InstallPlanner）
 * 把 loader catalog 的构建信息转换为声明式安装计划：
 * 下载地址、安装器参数、超时时间、校验目标与任务标识。
 * 所有加载器共用同一套生成逻辑，差异只体现在计划内容里。
 */
import { randomUUID } from 'crypto'
import { loaderCatalog } from '../catalog/loader-catalog'
import { normalizeNeoForgeLegacyVersion } from '../catalog/providers/neoforge.provider'
import type { LoaderBuild, LoaderKind } from '../catalog'
import type { InstallPlan, InstallPlanRequest } from './types'

/** 计划生成所需的元数据来源（测试可注入） */
export interface InstallPlanBuildSource {
  getBuilds(loader: LoaderKind, mcVersion: string): Promise<LoaderBuild[]>
}

/** 安装器最长执行时间：Forge/NeoForge 首次安装需要下载大量库 */
const INSTALLER_TIMEOUT_MS = 15 * 60 * 1000

const LOADER_LABELS: Record<LoaderKind, string> = {
  forge: 'Forge',
  neoforge: 'NeoForge',
  fabric: 'Fabric',
  quilt: 'Quilt'
}

/**
 * 把用户输入的加载器版本归一化为官方元数据中的完整版本
 * - Forge：缺省 MC 前缀时补全（47.2.0 → 1.20.1-47.2.0）
 * - NeoForge 1.20.1：补全 legacy 前缀（47.1.106 → 1.20.1-47.1.106）
 */
export function normalizeRequestedLoaderVersion(
  loader: LoaderKind,
  mcVersion: string,
  raw: string
): string {
  const value = raw.trim()
  if (!value) return value
  if (loader === 'forge') {
    return value.startsWith(`${mcVersion}-`) ? value : `${mcVersion}-${value}`
  }
  if (loader === 'neoforge' && mcVersion === '1.20.1') {
    return normalizeNeoForgeLegacyVersion(value)
  }
  return value
}

/** 安装器文件名 */
function installerFileName(build: LoaderBuild): string {
  const installerVersion = build.installerVersion ?? build.version
  switch (build.loader) {
    case 'forge':
      return `forge-installer-${build.version}.jar`
    case 'neoforge':
      return `neoforge-installer-${build.version}.jar`
    case 'fabric':
      return `fabric-installer-${installerVersion}.jar`
    case 'quilt':
      return `quilt-installer-${installerVersion}.jar`
  }
}

/** 各加载器安装器的命令行参数 */
function installerArgs(build: LoaderBuild, gameDir: string): string[] {
  switch (build.loader) {
    case 'forge':
    case 'neoforge':
      return ['--installClient', gameDir]
    case 'fabric':
      // Fabric 安装器 CLI：client -dir <dir> -mcversion <mc> -loader <ver> -noprofile
      // 不能用 Quilt 风格的双横线与 install 子命令，否则安装器不产生版本文件
      return [
        'client',
        '-dir',
        gameDir,
        '-mcversion',
        build.mcVersion,
        '-loader',
        build.version,
        '-noprofile'
      ]
    case 'quilt':
      // Quilt 安装器 CLI：install client <mc> [<loader>] --install-dir=<dir> --no-profile
      // 加载器版本是位置参数，目录必须用 --install-dir=<dir> 单参数形式
      return [
        'install',
        'client',
        build.mcVersion,
        build.version,
        `--install-dir=${gameDir}`,
        '--no-profile'
      ]
  }
}

export class InstallPlanner {
  constructor(private readonly catalog: InstallPlanBuildSource = loaderCatalog) {}

  /**
   * 生成安装计划
   * 用户指定版本时必须能在官方构建中找到；未指定时取可一键安装的最新稳定构建。
   */
  async plan(request: InstallPlanRequest): Promise<InstallPlan> {
    const { loader, mcVersion, gameDir } = request
    const label = LOADER_LABELS[loader]
    if (!mcVersion.trim()) {
      throw new Error('安装 Minecraft 版本不能为空')
    }
    if (!gameDir.trim()) {
      throw new Error('安装目标目录不能为空')
    }

    const builds = await this.catalog.getBuilds(loader, mcVersion)
    if (builds.length === 0) {
      throw new Error(`Minecraft ${mcVersion} 没有可用的 ${label} 构建`)
    }

    const requested = request.loaderVersion?.trim()
    const build = requested
      ? this.pickRequestedBuild(builds, label, mcVersion, loader, requested)
      : this.pickRecommendedBuild(builds, label, mcVersion)

    return {
      taskId: request.taskId?.trim() || randomUUID(),
      loader,
      mcVersion,
      loaderVersion: build.version,
      gameDir,
      build,
      downloads: [
        {
          id: 'installer',
          url: build.installerUrl,
          fileName: installerFileName(build)
        }
      ],
      run: {
        kind: 'java-jar',
        args: installerArgs(build, gameDir),
        timeoutMs: INSTALLER_TIMEOUT_MS
      },
      verify: {
        loader,
        loaderVersion: build.version
      },
      note: build.note
    }
  }

  /** 用户指定加载器版本：必须命中官方构建，且不能是仅元数据级别 */
  private pickRequestedBuild(
    builds: LoaderBuild[],
    label: string,
    mcVersion: string,
    loader: LoaderKind,
    requested: string
  ): LoaderBuild {
    const normalized = normalizeRequestedLoaderVersion(loader, mcVersion, requested)
    const matched = builds.find((build) => build.version === normalized)
    if (!matched) {
      throw new Error(`${label} 加载器 ${normalized} 不适用于 Minecraft ${mcVersion}`)
    }
    if (matched.support === 'C' || matched.support === 'D') {
      throw new Error(matched.note ?? `Minecraft ${mcVersion} 的 ${label} 暂不支持一键安装`)
    }
    return matched
  }

  /** 未指定版本：稳定版优先，跳过硬性不可安装的构建 */
  private pickRecommendedBuild(
    builds: LoaderBuild[],
    label: string,
    mcVersion: string
  ): LoaderBuild {
    const installable = builds.find((build) => build.support === 'A' || build.support === 'B')
    if (installable) return installable
    const reason = builds[0]?.note ?? `Minecraft ${mcVersion} 的 ${label} 暂不支持一键安装`
    throw new Error(reason)
  }
}

export const installPlanner = new InstallPlanner()
