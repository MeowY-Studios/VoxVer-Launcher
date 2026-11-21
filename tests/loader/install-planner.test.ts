/**
 * 安装计划生成器测试
 * 覆盖版本归一化、推荐构建选择、C 级拒绝与各加载器安装参数。
 */
import { describe, it, expect } from 'vitest'
import {
  InstallPlanner,
  normalizeRequestedLoaderVersion
} from '../../electron/loaders/plan/install-planner'
import type { InstallPlanBuildSource } from '../../electron/loaders/plan/install-planner'
import type { LoaderBuild, LoaderKind } from '../../electron/loaders/catalog/types'

function makeBuild(
  overrides: Partial<LoaderBuild> & Pick<LoaderBuild, 'loader' | 'version' | 'support'>
): LoaderBuild {
  return {
    mcVersion: '1.20.1',
    installerUrl: `https://example.com/${overrides.version}.jar`,
    ...overrides
  }
}

function buildSource(builds: LoaderBuild[]): InstallPlanBuildSource {
  return { getBuilds: async () => builds }
}

describe('normalizeRequestedLoaderVersion', () => {
  it('Forge 构建号补全 MC 前缀', () => {
    expect(normalizeRequestedLoaderVersion('forge', '1.20.1', '47.2.0')).toBe('1.20.1-47.2.0')
    expect(normalizeRequestedLoaderVersion('forge', '1.20.1', '1.20.1-47.2.0')).toBe(
      '1.20.1-47.2.0'
    )
  })

  it('NeoForge 1.20.1 legacy 补全前缀', () => {
    expect(normalizeRequestedLoaderVersion('neoforge', '1.20.1', '47.1.106')).toBe(
      '1.20.1-47.1.106'
    )
  })

  it('Fabric/Quilt 版本原样保留', () => {
    expect(normalizeRequestedLoaderVersion('fabric', '1.20.1', '0.16.0')).toBe('0.16.0')
  })
})

describe('InstallPlanner.plan', () => {
  it('未指定版本时跳过 C 级构建', async () => {
    const planner = new InstallPlanner(
      buildSource([
        makeBuild({ loader: 'forge', version: '1.20.1-0.0.1', support: 'C', note: '不支持' }),
        makeBuild({ loader: 'forge', version: '1.20.1-47.2.0', support: 'A' })
      ])
    )
    const plan = await planner.plan({ loader: 'forge', mcVersion: '1.20.1', gameDir: 'C:/game' })
    expect(plan.loaderVersion).toBe('1.20.1-47.2.0')
  })

  it('只有 C 级构建时抛出可读原因', async () => {
    const planner = new InstallPlanner(
      buildSource([
        makeBuild({
          loader: 'forge',
          version: '1.6.4-9.11.1.1345',
          support: 'C',
          note: '该版本没有现代安装器'
        })
      ])
    )
    await expect(
      planner.plan({ loader: 'forge', mcVersion: '1.6.4', gameDir: 'C:/game' })
    ).rejects.toThrow('该版本没有现代安装器')
  })

  it('用户指定不存在的加载器版本时给出明确错误', async () => {
    const planner = new InstallPlanner(
      buildSource([makeBuild({ loader: 'fabric', version: '0.16.0', support: 'A' })])
    )
    await expect(
      planner.plan({
        loader: 'fabric',
        mcVersion: '1.20.1',
        gameDir: 'C:/game',
        loaderVersion: '0.15.0'
      })
    ).rejects.toThrow('不适用于 Minecraft 1.20.1')
  })

  it('Fabric 计划包含显式 loader 参数与安装器文件名', async () => {
    const planner = new InstallPlanner(
      buildSource([
        makeBuild({
          loader: 'fabric',
          version: '0.16.0',
          support: 'A',
          installerVersion: '1.0.1',
          installerUrl: 'https://example.com/fabric-installer.jar'
        })
      ])
    )
    const plan = await planner.plan({
      loader: 'fabric',
      mcVersion: '1.20.1',
      gameDir: 'C:/game',
      loaderVersion: '0.16.0',
      taskId: 'task-1'
    })
    expect(plan.taskId).toBe('task-1')
    expect(plan.downloads[0].fileName).toBe('fabric-installer-1.0.1.jar')
    expect(plan.run.args).toContain('client')
    expect(plan.run.args).toContain('-loader')
    expect(plan.run.args).toContain('0.16.0')
    expect(plan.run.args).toContain('-dir')
    expect(plan.verify).toEqual({ loader: 'fabric', loaderVersion: '0.16.0' })
  })

  it('Quilt 使用位置参数与 --install-dir=', async () => {
    const planner = new InstallPlanner(
      buildSource([
        makeBuild({ loader: 'quilt', version: '0.27.0', installerVersion: '0.15.1', support: 'A' })
      ])
    )
    const plan = await planner.plan({ loader: 'quilt', mcVersion: '1.20.1', gameDir: 'C:/game' })
    expect(plan.run.args).toEqual([
      'install',
      'client',
      '1.20.1',
      '0.27.0',
      '--install-dir=C:/game',
      '--no-profile'
    ])
  })

  it('Forge/NeoForge 使用 --installClient 安装到游戏目录', async () => {
    const loaders: LoaderKind[] = ['forge', 'neoforge']
    for (const loader of loaders) {
      const planner = new InstallPlanner(
        buildSource([makeBuild({ loader, version: '21.1.77', support: 'A' })])
      )
      const plan = await planner.plan({ loader, mcVersion: '1.21.1', gameDir: 'C:/game' })
      expect(plan.run.args).toEqual(['--installClient', 'C:/game'])
      expect(plan.run.timeoutMs).toBeGreaterThan(0)
    }
  })

  it('未指定 taskId 时自动生成', async () => {
    const planner = new InstallPlanner(
      buildSource([makeBuild({ loader: 'quilt', version: '0.27.0', support: 'A' })])
    )
    const plan = await planner.plan({ loader: 'quilt', mcVersion: '1.20.1', gameDir: 'C:/game' })
    expect(plan.taskId.length).toBeGreaterThan(0)
  })
})
