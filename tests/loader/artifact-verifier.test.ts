/**
 * 安装产物校验测试
 * 校验器必须能识别版本 JSON 中的加载器库坐标，而不是只看安装器退出码。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
  verifyLoaderInstallation,
  versionDirectoryReferencesLoader
} from '../../electron/adapters/loaders/artifact-verifier'

let gameDir: string

/** 写入一个版本目录及其 JSON */
async function writeVersion(
  versionId: string,
  libraries: Array<{ name: string }>
): Promise<void> {
  const dir = path.join(gameDir, 'versions', versionId)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(
    path.join(dir, `${versionId}.json`),
    JSON.stringify({ id: versionId, libraries }),
    'utf8'
  )
}

beforeEach(async () => {
  gameDir = await fs.mkdtemp(path.join(os.tmpdir(), 'voxver-verify-'))
})

afterEach(async () => {
  await fs.rm(gameDir, { recursive: true, force: true })
})

describe('verifyLoaderInstallation', () => {
  it('找到版本号匹配的 Forge 库时校验通过', async () => {
    await writeVersion('1.20.1-forge-47.2.0', [
      { name: 'net.minecraftforge:forge:1.20.1-47.2.0' }
    ])
    const result = await verifyLoaderInstallation({
      gameDir,
      loader: 'forge',
      loaderVersion: '1.20.1-47.2.0'
    })
    expect(result.ok).toBe(true)
    expect(result.versionId).toBe('1.20.1-forge-47.2.0')
  })

  it('版本号不一致时返回失败原因', async () => {
    await writeVersion('1.20.1-forge-47.1.0', [
      { name: 'net.minecraftforge:forge:1.20.1-47.1.0' }
    ])
    const result = await verifyLoaderInstallation({
      gameDir,
      loader: 'forge',
      loaderVersion: '1.20.1-47.2.0'
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('47.1.0')
  })

  it('versions 目录不存在时返回明确原因', async () => {
    const result = await verifyLoaderInstallation({
      gameDir,
      loader: 'fabric',
      loaderVersion: '0.16.0'
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('版本目录不存在')
  })
})

describe('versionDirectoryReferencesLoader', () => {
  it('版本 JSON 引用对应加载器库时返回 true', async () => {
    await writeVersion('1.20.1-forge-47.2.0', [
      { name: 'net.minecraftforge:fmlloader:1.20.1-47.2.0' }
    ])
    await expect(
      versionDirectoryReferencesLoader(gameDir, '1.20.1-forge-47.2.0', 'forge')
    ).resolves.toBe(true)
  })

  it('引用其他加载器时返回 false', async () => {
    await writeVersion('fabric-loader-0.16.0', [
      { name: 'net.fabricmc:fabric-loader:0.16.0' }
    ])
    await expect(
      versionDirectoryReferencesLoader(gameDir, 'fabric-loader-0.16.0', 'forge')
    ).resolves.toBe(false)
  })
})
