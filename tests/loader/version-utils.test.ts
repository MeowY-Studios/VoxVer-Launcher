/**
 * 加载器版本号工具测试
 * 重点覆盖 26.x 新版本号体系与预发布排序，避免字符串比较误判。
 */
import { describe, it, expect } from 'vitest'
import {
  compareNumericVersion,
  isPrereleaseVersion,
  sortBuilds
} from '../../electron/loaders/catalog/version-utils'
import type { LoaderBuild } from '../../electron/loaders/catalog/types'

function makeBuild(version: string, prerelease = false): LoaderBuild {
  return {
    loader: 'forge',
    mcVersion: '1.21',
    version,
    installerUrl: `https://example.com/${version}.jar`,
    prerelease,
    support: 'A'
  }
}

describe('compareNumericVersion', () => {
  it('按数字段比较，26.x 大于 1.21.x', () => {
    expect(compareNumericVersion('26.3', '1.21.11')).toBeGreaterThan(0)
    expect(compareNumericVersion('1.21.11', '1.21.9')).toBeGreaterThan(0)
    expect(compareNumericVersion('1.20', '1.20.0')).toBe(0)
  })

  it('处理带构建号的版本', () => {
    expect(compareNumericVersion('1.20.1-47.2.0', '1.20.1-47.1.106')).toBeGreaterThan(0)
  })
})

describe('isPrereleaseVersion', () => {
  it('识别 alpha/beta/snapshot/pre/rc', () => {
    expect(isPrereleaseVersion('21.1.77-beta')).toBe(true)
    expect(isPrereleaseVersion('26.1.2.10-alpha')).toBe(true)
    expect(isPrereleaseVersion('0.16.0-pre1')).toBe(true)
    expect(isPrereleaseVersion('47.2.0')).toBe(false)
  })
})

describe('sortBuilds', () => {
  it('稳定版优先，其次版本号倒序', () => {
    const sorted = sortBuilds([
      makeBuild('47.1.0', true),
      makeBuild('47.0.9'),
      makeBuild('47.2.0'),
      makeBuild('47.3.0-beta', true)
    ])
    expect(sorted.map((build) => build.version)).toEqual([
      '47.2.0',
      '47.0.9',
      '47.3.0-beta',
      '47.1.0'
    ])
  })
})
