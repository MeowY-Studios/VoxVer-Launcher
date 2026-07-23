/**
 * XMCL Game Data 服务
 * 封装 @xmcl/game-data 的存档/服务器数据处理功能
 */

import {
  WorldReader,
  LevelDataFrame,
  PlayerDataFrame,
  AdvancementDataFrame,
  GameType
} from '@xmcl/game-data'
import { readServerInfo, writeServerInfo, ServerInfo } from '@xmcl/game-data'
import { logger } from '../utils/logger'
import * as fs from 'fs'
import { join } from 'path'

const log = logger.child('XmclGameData')

export { LevelDataFrame, PlayerDataFrame, AdvancementDataFrame, GameType, ServerInfo }

/** 游戏模式中文映射 */
export const GAME_TYPE_LABELS_ZH: Record<number, string> = {
  [-1]: '无',
  [0]: '生存',
  [1]: '创造',
  [2]: '冒险',
  [3]: '旁观'
}

/** 游戏模式英文映射 */
export const GAME_TYPE_LABELS_EN: Record<number, string> = {
  [-1]: 'None',
  [0]: 'Survival',
  [1]: 'Creative',
  [2]: 'Adventure',
  [3]: 'Spectator'
}

export interface WorldSummary {
  /** 世界名称 */
  name: string
  /** 世界路径（相对于 saves 目录的文件夹名） */
  folderName: string
  /** 完整路径 */
  path: string
  /** 最后游玩时间（毫秒时间戳） */
  lastPlayed: number
  /** 游戏模式 */
  gameType: number
  /** 种子 */
  seed: bigint
  /** 是否开启作弊 */
  allowCommands: boolean
  /** 是否极限模式 */
  hardcore: boolean
  /** 难度 */
  difficulty: number
  /** 数据版本 */
  dataVersion: number
  /** 版本名称 */
  versionName: string
  /** 大小（字节） */
  sizeOnDisk: number
}

// ---- 世界存档 ----

/**
 * 打开世界存档读取器
 */
export async function openWorld(worldPath: string): Promise<WorldReader> {
  try {
    return await WorldReader.create(worldPath)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error(`[openWorld] 打开世界失败: ${worldPath} - ${msg}`)
    throw e
  }
}

/**
 * 读取世界的 level.dat 数据
 */
export async function readLevelData(worldPath: string): Promise<LevelDataFrame> {
  const reader = await openWorld(worldPath)
  return reader.getLevelData()
}

/**
 * 读取世界的玩家数据
 */
export async function readPlayerData(worldPath: string): Promise<PlayerDataFrame[]> {
  const reader = await openWorld(worldPath)
  return reader.getPlayerData()
}

/**
 * 读取世界的成就数据
 */
export async function readAdvancementsData(worldPath: string): Promise<AdvancementDataFrame[]> {
  const reader = await openWorld(worldPath)
  return reader.getAdvancementsData()
}

/**
 * 获取世界摘要信息（用于列表展示）
 * 从 level.dat 提取核心字段
 */
export async function getWorldSummary(worldPath: string): Promise<WorldSummary> {
  const data = await readLevelData(worldPath)
  const folderName = worldPath.split(/[\\/]/).pop() || worldPath

  return {
    name: data.LevelName,
    folderName,
    path: worldPath,
    lastPlayed: Number(data.LastPlayed),
    gameType: data.GameType,
    seed: data.RandomSeed,
    allowCommands: data.allowCommands === 1,
    hardcore: data.hardcore === 1,
    difficulty: data.Difficulty,
    dataVersion: data.DataVersion,
    versionName: data.Version?.Name || `DataVersion ${data.DataVersion}`,
    sizeOnDisk: Number(data.SizeOnDisk)
  }
}

/**
 * 扫描 saves 目录下所有世界并返回摘要列表
 */
export async function listWorlds(gamePath: string): Promise<WorldSummary[]> {
  const savesDir = join(gamePath, 'saves')
  if (!fs.existsSync(savesDir)) {
    return []
  }

  const entries = fs.readdirSync(savesDir, { withFileTypes: true })
  const worldFolders = entries.filter((e) => e.isDirectory()).map((e) => e.name)

  const results: WorldSummary[] = []
  for (const folder of worldFolders) {
    const worldPath = join(savesDir, folder)
    const levelDatPath = join(worldPath, 'level.dat')
    if (!fs.existsSync(levelDatPath)) continue

    try {
      const summary = await getWorldSummary(worldPath)
      results.push(summary)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.warn(`[listWorlds] 读取世界失败: ${worldPath} - ${msg}`)
    }
  }

  // 按最后游玩时间降序排列
  results.sort((a, b) => b.lastPlayed - a.lastPlayed)
  return results
}

// ---- 服务器列表 ----

/**
 * 读取 servers.dat 中的服务器列表
 */
export async function readServersDat(gamePath: string): Promise<ServerInfo[]> {
  const serversPath = join(gamePath, 'servers.dat')
  if (!fs.existsSync(serversPath)) {
    return []
  }

  try {
    const buff = fs.readFileSync(serversPath)
    return await readServerInfo(new Uint8Array(buff))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error(`[readServersDat] 读取失败: ${msg}`)
    return []
  }
}

/**
 * 写入服务器列表到 servers.dat
 */
export async function writeServersDat(gamePath: string, infos: ServerInfo[]): Promise<void> {
  const serversPath = join(gamePath, 'servers.dat')
  try {
    const buff = await writeServerInfo(infos)
    fs.writeFileSync(serversPath, Buffer.from(buff))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error(`[writeServersDat] 写入失败: ${msg}`)
    throw e
  }
}
