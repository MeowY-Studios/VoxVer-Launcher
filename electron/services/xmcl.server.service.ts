/**
 * XMCL Client 服务器查询服务
 * 基于 @xmcl/client 提供 Minecraft 服务器状态查询（Ping）能力
 */
import { queryStatus } from '@xmcl/client'
import { logger } from '../utils/logger'

const log = logger.child('XMCL-Server')

export interface ServerStatus {
  online: boolean
  players?: { online: number; max: number }
  version?: string
  motd?: string
  ping?: number
}

export async function pingServer(host: string, port?: number): Promise<ServerStatus> {
  log.info(`[pingServer] 查询服务器: ${host}:${port ?? 25565}`)

  try {
    const startTime = Date.now()
    const status = await queryStatus(
      { host, port: port ?? 25565 },
      { timeout: 5000 }
    )

    const elapsed = Date.now() - startTime

    let motd: string | undefined
    if (status.description) {
      if (typeof status.description === 'string') {
        motd = status.description
      } else {
        motd = (status.description.extra ?? [])
          .map((e: { text?: string }) => e.text ?? '')
          .join('')
        if (status.description.text) {
          motd = status.description.text + motd
        }
      }
    }

    return {
      online: true,
      players: status.players
        ? {
            online: status.players.online ?? 0,
            max: status.players.max ?? 0
          }
        : undefined,
      version: status.version?.name,
      motd,
      ping: status.ping ?? elapsed
    }
  } catch (e: unknown) {
    log.warn(`[pingServer] 服务器 ${host}:${port ?? 25565} 离线: ${(e as Error).message}`)
    return { online: false }
  }
}

export { queryStatus }
