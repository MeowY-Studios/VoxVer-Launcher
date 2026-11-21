/**
 * 安装事务日志测试
 * 回滚只能删除本次安装新建、且引用当前加载器的版本目录。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import * as os from 'os'
import * as path from 'path'
import { InstallJournal } from '../../electron/loaders/journal/install-journal'

let gameDir: string

async function writeVersion(versionId: string, libraryName: string): Promise<void> {
  const dir = path.join(gameDir, 'versions', versionId)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(
    path.join(dir, `${versionId}.json`),
    JSON.stringify({ id: versionId, libraries: [{ name: libraryName }] }),
    'utf8'
  )
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

beforeEach(async () => {
  gameDir = await fs.mkdtemp(path.join(os.tmpdir(), 'voxver-journal-'))
  await writeVersion('1.20.1-forge-47.1.0', 'net.minecraftforge:forge:1.20.1-47.1.0')
  await fs.writeFile(
    path.join(gameDir, 'launcher_profiles.json'),
    JSON.stringify({ original: true }),
    'utf8'
  )
})

afterEach(async () => {
  await fs.rm(gameDir, { recursive: true, force: true })
})

describe('InstallJournal', () => {
  it('回滚删除本次新建的加载器版本与临时文件，并还原 launcher_profiles.json', async () => {
    const journal = new InstallJournal(gameDir)
    const session = await journal.begin({
      taskId: 'task-rollback',
      loader: 'forge',
      mcVersion: '1.20.1',
      loaderVersion: '1.20.1-47.2.0'
    })

    const tempFile = path.join(gameDir, 'temp', 'forge-installer.jar')
    await fs.mkdir(path.dirname(tempFile), { recursive: true })
    await fs.writeFile(tempFile, 'installer', 'utf8')
    await journal.recordTempFile(session, tempFile)

    // 模拟安装器新建版本目录并改写 profiles
    await writeVersion('1.20.1-forge-47.2.0', 'net.minecraftforge:forge:1.20.1-47.2.0')
    await fs.writeFile(
      path.join(gameDir, 'launcher_profiles.json'),
      JSON.stringify({ modified: true }),
      'utf8'
    )

    await journal.rollback(session)

    await expect(exists(path.join(gameDir, 'versions', '1.20.1-forge-47.2.0'))).resolves.toBe(
      false
    )
    await expect(exists(path.join(gameDir, 'versions', '1.20.1-forge-47.1.0'))).resolves.toBe(
      true
    )
    await expect(exists(tempFile)).resolves.toBe(false)
    const profile = JSON.parse(
      await fs.readFile(path.join(gameDir, 'launcher_profiles.json'), 'utf8')
    ) as { original?: boolean }
    expect(profile.original).toBe(true)
    await expect(exists(path.join(gameDir, '.voxver', 'journal', 'task-rollback.json'))).resolves.toBe(
      false
    )
  })

  it('安装成功后清除本次日志与备份', async () => {
    const journal = new InstallJournal(gameDir)
    const session = await journal.begin({
      taskId: 'task-commit',
      loader: 'fabric',
      mcVersion: '1.20.1',
      loaderVersion: '0.16.0'
    })
    await journal.commit(session)

    const journalDir = path.join(gameDir, '.voxver', 'journal')
    await expect(exists(path.join(journalDir, 'task-commit.json'))).resolves.toBe(false)
    await expect(exists(path.join(journalDir, 'task-commit.launcher_profiles.json'))).resolves.toBe(
      false
    )
    // 原有 profiles 不受影响
    const profile = JSON.parse(
      await fs.readFile(path.join(gameDir, 'launcher_profiles.json'), 'utf8')
    ) as { original?: boolean }
    expect(profile.original).toBe(true)
  })
})
