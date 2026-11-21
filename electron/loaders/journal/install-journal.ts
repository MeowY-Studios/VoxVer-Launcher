/**
 * 安装事务日志（InstallJournal）
 * 安装前记录 versions 目录快照与 launcher_profiles.json 备份，
 * 失败时回滚本次新建的版本目录与临时文件；成功时清除日志。
 * 同一游戏目录下最多保留最近 10 个任务日志，便于排查残留状态。
 */
import { promises as fs } from 'fs'
import * as path from 'path'
import { logger } from '../../utils/logger'
import { versionDirectoryReferencesLoader } from '../../adapters/loaders/artifact-verifier'
import type { LoaderKind } from '../catalog'

const log = logger.child('InstallJournal')

/** 保留的任务日志数量 */
const MAX_ENTRIES = 10

interface JournalEntry {
  taskId: string
  loader: LoaderKind
  mcVersion: string
  loaderVersion: string
  startedAt: string
  /** 安装前的 versions 目录快照 */
  baselineVersionIds: string[]
  /** 安装过程中下载的临时文件 */
  tempFiles: string[]
  /** 安装前是否已存在 launcher_profiles.json */
  profileExisted: boolean
  /** 备份文件名（相对日志目录） */
  profileBackup?: string
}

export interface InstallJournalSession {
  entry: JournalEntry
  journalDir: string
  entryPath: string
}

export interface JournalBeginInput {
  taskId: string
  loader: LoaderKind
  mcVersion: string
  loaderVersion: string
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function removeIfExists(target: string): Promise<void> {
  try {
    await fs.rm(target, { recursive: true, force: true })
  } catch (error) {
    log.warn(`清理失败: ${target}`, error)
  }
}

export class InstallJournal {
  constructor(private readonly gameDir: string) {}

  private get journalDir(): string {
    return path.join(this.gameDir, '.voxver', 'journal')
  }

  /** 开始一次安装事务，写入安装前快照 */
  async begin(input: JournalBeginInput): Promise<InstallJournalSession> {
    const journalDir = this.journalDir
    await fs.mkdir(journalDir, { recursive: true })

    const profilePath = path.join(this.gameDir, 'launcher_profiles.json')
    const profileExisted = await pathExists(profilePath)
    const profileBackup = profileExisted ? `${input.taskId}.launcher_profiles.json` : undefined
    if (profileBackup) {
      await fs.copyFile(profilePath, path.join(journalDir, profileBackup))
    }

    const entry: JournalEntry = {
      taskId: input.taskId,
      loader: input.loader,
      mcVersion: input.mcVersion,
      loaderVersion: input.loaderVersion,
      startedAt: new Date().toISOString(),
      baselineVersionIds: await this.listVersionIds(),
      tempFiles: [],
      profileExisted,
      profileBackup
    }
    const entryPath = path.join(journalDir, `${input.taskId}.json`)
    await fs.writeFile(entryPath, JSON.stringify(entry, null, 2), 'utf8')
    await this.prune()
    return { entry, journalDir, entryPath }
  }

  /** 记录安装过程中产生的临时文件，供回滚清理 */
  async recordTempFile(session: InstallJournalSession, filePath: string): Promise<void> {
    if (session.entry.tempFiles.includes(filePath)) return
    session.entry.tempFiles.push(filePath)
    await this.persist(session)
  }

  /** 安装成功：清除本次日志与备份 */
  async commit(session: InstallJournalSession): Promise<void> {
    await removeIfExists(session.entryPath)
    await this.removeProfileBackup(session)
  }

  /**
   * 安装失败：回滚本次产生的版本目录与临时文件
   * 只删除安装后新增、且确实引用当前加载器的版本目录，不会动安装前已有的版本。
   */
  async rollback(session: InstallJournalSession): Promise<void> {
    for (const filePath of session.entry.tempFiles) {
      await removeIfExists(filePath)
    }

    const baseline = new Set(session.entry.baselineVersionIds)
    for (const versionId of await this.listVersionIds()) {
      if (baseline.has(versionId)) continue
      const versionDir = path.join(this.gameDir, 'versions', versionId)
      if (!(await versionDirectoryReferencesLoader(this.gameDir, versionId, session.entry.loader))) {
        continue
      }
      log.info(`[回滚] 删除本次安装的版本目录: ${versionDir}`)
      await removeIfExists(versionDir)
    }

    const profilePath = path.join(this.gameDir, 'launcher_profiles.json')
    if (session.entry.profileExisted && session.entry.profileBackup) {
      await fs.copyFile(
        path.join(session.journalDir, session.entry.profileBackup),
        profilePath
      )
    } else if (!session.entry.profileExisted) {
      await removeIfExists(profilePath)
    }

    await removeIfExists(session.entryPath)
    await this.removeProfileBackup(session)
  }

  private async persist(session: InstallJournalSession): Promise<void> {
    await fs.writeFile(session.entryPath, JSON.stringify(session.entry, null, 2), 'utf8')
  }

  private async removeProfileBackup(session: InstallJournalSession): Promise<void> {
    if (!session.entry.profileBackup) return
    await removeIfExists(path.join(session.journalDir, session.entry.profileBackup))
  }

  /** 读取 versions 目录下的版本名列表 */
  private async listVersionIds(): Promise<string[]> {
    try {
      const entries = await fs.readdir(path.join(this.gameDir, 'versions'), {
        withFileTypes: true
      })
      return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    } catch {
      return []
    }
  }

  /** 只保留最近 MAX_ENTRIES 个任务日志 */
  private async prune(): Promise<void> {
    try {
      const names = await fs.readdir(this.journalDir)
      const entryNames = names.filter(
        (name) => name.endsWith('.json') && !name.includes('.launcher_profiles.')
      )
      const entries = await Promise.all(
        entryNames.map(async (name) => {
          const filePath = path.join(this.journalDir, name)
          const stat = await fs.stat(filePath)
          return { name, mtimeMs: stat.mtimeMs }
        })
      )
      entries.sort((a, b) => b.mtimeMs - a.mtimeMs)
      for (const stale of entries.slice(MAX_ENTRIES)) {
        await removeIfExists(path.join(this.journalDir, stale.name))
        await removeIfExists(
          path.join(this.journalDir, stale.name.replace(/\.json$/, '.launcher_profiles.json'))
        )
      }
    } catch (error) {
      log.warn('清理历史安装日志失败', error)
    }
  }
}
