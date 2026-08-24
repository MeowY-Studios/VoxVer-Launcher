/**
 * P2P 分享核心服务
 *
 * 基于 PeerJS + WebRTC 实现实例分享的点对点传输。
 *
 * 架构：
 * - 分享端（Sender）：打包实例 → 启动 Peer → 生成分享码 → 等待连接 → 发送分片
 * - 接收端（Receiver）：输入分享码 → 连接 Peer → 请求分片 → 接收并组装 → 校验 MD5
 *
 * 协议：
 * - type:info - 文件元数据（Sender → Receiver）
 * - type:request-chunk - 请求分片（Receiver → Sender）
 * - type:chunk - 分片数据（Sender → Receiver）
 * - type:complete - 传输完成（Receiver → Sender）
 * - type:error - 错误信息（双向）
 */

import Peer, { type DataConnection } from 'peerjs'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { logger } from '../utils/logger'
import { hashFile } from '../utils/hash'
import type { PackedInstance } from './instanceSharePack.service'
import { getChunk } from './instanceSharePack.service'
import { getDatabase } from './database'

const log = logger.child('p2pShare')

/**
 * 自定义信令服务器配置
 */
interface CustomSignalingConfig {
  host: string
  port: number
  path?: string
  secure?: boolean
  key?: string
}

/**
 * 获取用户配置的自定义信令服务器
 */
function getCustomSignalingConfig(): CustomSignalingConfig | null {
  try {
    const db = getDatabase()
    const row = db
      .prepare("SELECT value FROM configs WHERE key = 'p2p_signaling_server'")
      .get() as { value: string } | undefined

    if (!row?.value) return null

    const config = JSON.parse(row.value) as CustomSignalingConfig
    if (!config.host || !config.port) return null

    log.info('[getCustomSignalingConfig] 使用自定义信令服务器:', config)
    return config
  } catch (e: unknown) {
    log.warn('[getCustomSignalingConfig] 解析配置失败:', (e as Error).message)
    return null
  }
}

/**
 * 获取 P2P 传输设置（从数据库读取）
 */
export function getP2pSettings(): { chunkSize: number; connectionTimeout: number; signalingServer: string } {
  try {
    const db = getDatabase()
    const chunkRow = db.prepare("SELECT value FROM configs WHERE key = 'p2p_chunk_size'").get() as { value: string } | undefined
    const timeoutRow = db.prepare("SELECT value FROM configs WHERE key = 'p2p_connection_timeout'").get() as { value: string } | undefined
    const signalingRow = db.prepare("SELECT value FROM configs WHERE key = 'p2p_signaling_server'").get() as { value: string } | undefined

    return {
      chunkSize: chunkRow ? parseInt(chunkRow.value, 10) || 1024 : 1024,
      connectionTimeout: timeoutRow ? parseInt(timeoutRow.value, 10) * 1000 || 30000 : 30000,
      signalingServer: signalingRow?.value || ''
    }
  } catch {
    return { chunkSize: 1024, connectionTimeout: 30000, signalingServer: '' }
  }
}

/**
 * 保存 P2P 设置到数据库
 */
export function saveP2pSettings(settings: { chunkSize?: number; connectionTimeout?: number; signalingServer?: string }): void {
  const db = getDatabase()
  const upsert = db.prepare("INSERT INTO configs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
  if (settings.chunkSize !== undefined) upsert.run('p2p_chunk_size', String(settings.chunkSize))
  if (settings.connectionTimeout !== undefined) upsert.run('p2p_connection_timeout', String(settings.connectionTimeout))
  if (settings.signalingServer !== undefined) upsert.run('p2p_signaling_server', settings.signalingServer)
}

export interface ShareSession {
  sessionId: string
  shareCode: string
  type: 'sender' | 'receiver'
  status: 'idle' | 'waiting' | 'connecting' | 'transferring' | 'completed' | 'error'
  peerId?: string
  remotePeerId?: string
  packedInstance?: PackedInstance
  transferredChunks: number
  totalChunks: number
  startTime: number
  endTime?: number
  error?: string
  bytesPerSecond?: number
  estimatedRemaining?: number
  instanceName?: string
  mcVersion?: string
  loaderType?: string
}

export interface TransferProgress {
  sessionId: string
  transferredChunks: number
  totalChunks: number
  bytesPerSecond: number
  estimatedRemaining: number
}

type MessageType = 'info' | 'request-chunk' | 'chunk' | 'complete' | 'error'

interface P2PMessage {
  type: MessageType
  data?: unknown
}

interface InfoMessage extends P2PMessage {
  type: 'info'
  data: {
    instanceName: string
    mcVersion: string
    loaderType: string
    loaderVersion: string
    fileSize: number
    fileMd5: string
    totalChunks: number
    chunkSize: number
  }
}

interface RequestChunkMessage extends P2PMessage {
  type: 'request-chunk'
  data: {
    chunkIndex: number
  }
}

interface ChunkMessage extends P2PMessage {
  type: 'chunk'
  data: {
    chunkIndex: number
    buffer: ArrayBuffer
  }
}

interface CompleteMessage extends P2PMessage {
  type: 'complete'
  data: {
    receivedMd5: string
  }
}

interface ErrorMessage extends P2PMessage {
  type: 'error'
  data: {
    message: string
  }
}

const DEFAULT_PEER_CONFIG = {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  debug: 0,
  config: {
    iceServers: [
      // Google STUN（全球高可用）
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Cloudflare STUN
      { urls: 'stun:stun.cloudflare.com:3478' },
      // Open Relay TURN（免费公共 TURN 服务，提升 NAT 穿透成功率）
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turns:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      // Twilio STUN
      { urls: 'stun:stun.twilio.com:3478' }
    ]
  }
}

// 备用信令服务器（peerjs-server.herokuapp.com 已停服，仅保留官方和自定义）
const FALLBACK_PEER_CONFIGS = [
  {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    debug: 0,
    config: DEFAULT_PEER_CONFIG.config
  }
]

/**
 * 获取有效的 Peer 配置列表（优先自定义服务器）
 */
function getEffectivePeerConfigs(): Array<typeof DEFAULT_PEER_CONFIG> {
  const customConfig = getCustomSignalingConfig()

  if (customConfig) {
    // 用户配置了自定义服务器，优先使用
    const customPeerConfig = {
      host: customConfig.host,
      port: customConfig.port,
      path: customConfig.path || '/',
      secure: customConfig.secure ?? (customConfig.port === 443),
      debug: 0,
      key: customConfig.key || 'peerjs',
      config: DEFAULT_PEER_CONFIG.config
    }
    log.info('[getEffectivePeerConfigs] 优先使用自定义服务器:', customPeerConfig)
    return [customPeerConfig, DEFAULT_PEER_CONFIG, ...FALLBACK_PEER_CONFIGS]
  }

  return [DEFAULT_PEER_CONFIG, ...FALLBACK_PEER_CONFIGS]
}

const CONNECTION_TIMEOUT = 30000
const CHUNK_RETRY_COUNT = 3
const MAX_PEER_INIT_RETRIES = 2

class P2PShareService {
  private peer: Peer | null = null
  private senderSessions: Map<string, ShareSession> = new Map()
  private receiverSessions: Map<string, ShareSession> = new Map()
  private connections: Map<string, DataConnection> = new Map()
  private progressCallbacks: Map<string, (progress: TransferProgress) => void> = new Map()
  private statusCallbacks: Map<string, (session: ShareSession) => void> = new Map()
  private shareCodeToPeerId: Map<string, string> = new Map()

  generateShareCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  private async createPeerWithRetry(preferredId?: string): Promise<Peer> {
    let lastError: Error | null = null

    const configs = getEffectivePeerConfigs()

    for (let retry = 0; retry <= MAX_PEER_INIT_RETRIES; retry++) {
      for (const config of configs) {
        try {
          const peer = new Peer(preferredId as string, {
            ...config,
            config: DEFAULT_PEER_CONFIG.config
          })

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              peer.destroy()
              reject(new Error('Connection timeout'))
            }, CONNECTION_TIMEOUT)

            peer.on('open', () => {
              clearTimeout(timeout)
              resolve()
            })

            peer.on('error', (err) => {
              clearTimeout(timeout)
              reject(err)
            })
          })

          return peer
        } catch (e) {
          lastError = e as Error
          log.warn('Peer creation failed, trying next', {
            retry,
            host: config.host,
            error: lastError.message
          })
        }
      }
    }

    throw lastError || new Error('Failed to create peer connection')
  }

  private getTempReceiveDir(): string {
    const dir = path.join(app.getPath('temp'), 'mcla-receive')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    return dir
  }

  async startShareSession(
    packedInstance: PackedInstance
  ): Promise<{ sessionId: string; shareCode: string; peerId: string }> {
    log.info('Starting share session', { instanceId: packedInstance.instanceId })

    const sessionId = `sender_${Date.now()}`
    const shareCode = this.generateShareCode()

    try {
      const peer = await this.createPeerWithRetry(shareCode)
      const peerId = peer.id

      this.shareCodeToPeerId.set(shareCode, peerId)

      const session: ShareSession = {
        sessionId,
        shareCode,
        type: 'sender',
        status: 'waiting',
        peerId,
        packedInstance,
        transferredChunks: 0,
        totalChunks: packedInstance.totalChunks,
        startTime: Date.now()
      }

      this.senderSessions.set(sessionId, session)
      this.peer = peer

      peer.on('connection', (conn) => {
        this.handleSenderConnection(sessionId, conn, packedInstance)
      })

      peer.on('error', (err) => {
        log.error('Peer error', err)
        this.updateSessionStatus(sessionId, 'error', err.message)
      })

      peer.on('disconnected', () => {
        log.warn('Peer disconnected, attempting to reconnect', { sessionId })
        this.updateSessionStatus(sessionId, 'error', 'Connection lost, please retry')
      })

      log.info('Share session started', { sessionId, peerId, shareCode })
      return { sessionId, shareCode, peerId }
    } catch (e: unknown) {
      log.error('Failed to start share session', e)
      throw new Error(`Failed to start sharing: ${(e as Error).message || 'Check network connection'}`)
    }
  }

  private handleSenderConnection(
    sessionId: string,
    conn: DataConnection,
    packedInstance: PackedInstance
  ): void {
    log.info('New connection to sender', { sessionId, remotePeer: conn.peer })

    const session = this.senderSessions.get(sessionId)
    if (!session) return

    this.connections.set(sessionId, conn)
    this.updateSessionStatus(sessionId, 'connecting')

    conn.on('open', () => {
      log.info('Sender connection opened', { sessionId })
      this.updateSessionStatus(sessionId, 'transferring')

      const infoMsg: InfoMessage = {
        type: 'info',
        data: {
          instanceName: packedInstance.instanceName,
          mcVersion: packedInstance.mcVersion,
          loaderType: packedInstance.loaderType,
          loaderVersion: packedInstance.loaderVersion,
          fileSize: packedInstance.fileSize,
          fileMd5: packedInstance.fileMd5,
          totalChunks: packedInstance.totalChunks,
          chunkSize: packedInstance.chunkSize
        }
      }
      conn.send(infoMsg)
    })

    conn.on('data', (data: unknown) => {
      this.handleSenderMessage(sessionId, conn, data as P2PMessage, packedInstance)
    })

    conn.on('close', () => {
      log.info('Sender connection closed', { sessionId })
    })

    conn.on('error', (err) => {
      log.error('Sender connection error', sessionId, err)
      this.updateSessionStatus(sessionId, 'error', err.message)
    })
  }

  private handleSenderMessage(
    sessionId: string,
    conn: DataConnection,
    msg: P2PMessage,
    packedInstance: PackedInstance
  ): void {
    const session = this.senderSessions.get(sessionId)
    if (!session) return

    switch (msg.type) {
      case 'request-chunk': {
        const { chunkIndex } = (msg as RequestChunkMessage).data

        try {
          const chunkBuffer = getChunk(
            packedInstance.filePath,
            chunkIndex,
            packedInstance.chunkSize
          )

          const chunkMsg: ChunkMessage = {
            type: 'chunk',
            data: {
              chunkIndex,
              buffer: chunkBuffer.buffer.slice(
                chunkBuffer.byteOffset,
                chunkBuffer.byteOffset + chunkBuffer.length
              ) as ArrayBuffer
            }
          }

          conn.send(chunkMsg)

          session.transferredChunks = chunkIndex + 1
          this.notifyProgress(sessionId)

          if (chunkIndex + 1 >= packedInstance.totalChunks) {
            log.info('All chunks sent', { sessionId })
          }
        } catch (e) {
          log.error('Failed to send chunk', { sessionId, chunkIndex }, e)
          const errMsg: ErrorMessage = {
            type: 'error',
            data: { message: `Chunk ${chunkIndex} send failed` }
          }
          conn.send(errMsg)
        }
        break
      }

      case 'complete': {
        log.info('Receiver confirmed completion', { sessionId })
        saveShareHistory({
          id: `share_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'share',
          instanceName: session.packedInstance?.instanceName || '',
          mcVersion: session.packedInstance?.mcVersion || null,
          loaderType: session.packedInstance?.loaderType || null,
          shareCode: session.shareCode,
          fileSize: session.packedInstance?.fileSize || 0,
          status: 'completed',
          errorMsg: null
        })
        this.updateSessionStatus(sessionId, 'completed')
        break
      }

      case 'error': {
        const errData = (msg as ErrorMessage).data
        log.error('Receiver reported error', { sessionId, error: errData.message })
        this.updateSessionStatus(sessionId, 'error', errData.message)
        break
      }
    }
  }

  async startReceiveSession(
    shareCode: string,
    senderPeerId?: string
  ): Promise<{ sessionId: string; peerId: string }> {
    log.info('Starting receive session', { shareCode })

    const sessionId = `receiver_${Date.now()}`

    try {
      const peer = await this.createPeerWithRetry()
      const peerId = peer.id

      const session: ShareSession = {
        sessionId,
        shareCode,
        type: 'receiver',
        status: 'connecting',
        peerId,
        transferredChunks: 0,
        totalChunks: 0,
        startTime: Date.now()
      }

      this.receiverSessions.set(sessionId, session)
      this.peer = peer

      peer.on('error', (err) => {
        log.error('Peer error (receiver)', err)
        this.updateSessionStatus(sessionId, 'error', err.message)
      })

      peer.on('disconnected', () => {
        log.warn('Receiver peer disconnected, attempting to reconnect', { sessionId })
        // Auto-reconnect with exponential backoff
        this.attemptReconnect(sessionId, shareCode, senderPeerId)
      })

      const targetPeerId = senderPeerId || shareCode
      log.info('Connecting to sender', { targetPeerId, shareCode })

      const conn = peer.connect(targetPeerId, { reliable: true, serialization: 'binary' })
      this.connections.set(sessionId, conn)

      let connectionTimeout: NodeJS.Timeout | null = setTimeout(() => {
        if (session.status === 'connecting') {
          log.warn('Connection timeout, attempting to retry', { sessionId })
          this.updateSessionStatus(sessionId, 'error', 'Connection timeout, ensure share code is correct and sender is online')
        }
      }, CONNECTION_TIMEOUT)

      conn.on('open', () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
        log.info('Receiver connection opened', { sessionId })
        this.updateSessionStatus(sessionId, 'transferring')
      })

      conn.on('data', (data: unknown) => {
        this.handleReceiverMessage(sessionId, conn, data as P2PMessage)
      })

      conn.on('close', () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
        log.info('Receiver connection closed', { sessionId })
      })

      conn.on('error', (err) => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
        log.error('Receiver connection error', sessionId, err)
        this.updateSessionStatus(sessionId, 'error', err.message || 'Connection failed, check network')
      })

      log.info('Receive session initialized', { sessionId, peerId })
      return { sessionId, peerId }
    } catch (e: unknown) {
      log.error('Failed to start receive session', e)
      throw new Error(`Connection failed: ${(e as Error).message || 'Check network connection'}`)
    }
  }

  private fileInfo: Map<
    string,
    {
      instanceName: string
      mcVersion: string
      loaderType: string
      loaderVersion: string
      fileSize: number
      fileMd5: string
      totalChunks: number
      chunkSize: number
      tempFilePath: string
      receivedChunks: Set<number>
    }
  > = new Map()

  private handleReceiverMessage(sessionId: string, conn: DataConnection, msg: P2PMessage): void {
    const session = this.receiverSessions.get(sessionId)
    if (!session) return

    switch (msg.type) {
      case 'info': {
        const info = (msg as InfoMessage).data
        const tempDir = this.getTempReceiveDir()
        const tempFilePath = path.join(tempDir, `${sessionId}.mcla.tmp`)

        // Check for existing temp file (resume support)
        let existingChunks = new Set<number>()
        const metaPath = `${tempFilePath}.meta`
        if (fs.existsSync(tempFilePath) && fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
            if (meta.totalChunks === info.totalChunks && meta.chunkSize === info.chunkSize) {
              existingChunks = new Set(meta.receivedChunks as number[])
              log.info('Resuming transfer', { sessionId, existingChunks: existingChunks.size })
            }
          } catch {
            // Invalid meta, start fresh
          }
        }

        this.fileInfo.set(sessionId, {
          instanceName: info.instanceName,
          mcVersion: info.mcVersion,
          loaderType: info.loaderType,
          loaderVersion: info.loaderVersion,
          fileSize: info.fileSize,
          fileMd5: info.fileMd5,
          totalChunks: info.totalChunks,
          chunkSize: info.chunkSize,
          tempFilePath,
          receivedChunks: existingChunks
        })

        session.totalChunks = info.totalChunks
        log.info('Received file info', { sessionId, totalChunks: info.totalChunks })

        // Start from first missing chunk (resume support)
        const fi = this.fileInfo.get(sessionId)
        const firstMissing = fi ? this.findFirstMissingChunk(fi.totalChunks, fi.receivedChunks) : 0
        this.requestNextChunk(sessionId, conn, firstMissing)
        break
      }

      case 'chunk': {
        const { chunkIndex, buffer } = (msg as ChunkMessage).data
        const info = this.fileInfo.get(sessionId)
        if (!info) return

        try {
          const fd = fs.openSync(info.tempFilePath, 'a')
          const nodeBuffer = Buffer.from(buffer)
          fs.writeSync(fd, nodeBuffer, 0, nodeBuffer.length, chunkIndex * info.chunkSize)
          fs.closeSync(fd)

          info.receivedChunks.add(chunkIndex)
          session.transferredChunks = info.receivedChunks.size
          this.retryCount.delete(`${sessionId}_${chunkIndex}`)
          this.notifyProgress(sessionId)

          // Persist received chunks for resume
          try {
            const metaPath = `${info.tempFilePath}.meta`
            fs.writeFileSync(metaPath, JSON.stringify({
              totalChunks: info.totalChunks,
              chunkSize: info.chunkSize,
              receivedChunks: Array.from(info.receivedChunks)
            }))
          } catch { /* ignore */ }

          const nextChunk = chunkIndex + 1
          if (nextChunk < info.totalChunks) {
            this.requestNextChunk(sessionId, conn, nextChunk)
          } else {
            this.verifyAndComplete(sessionId, conn)
          }
        } catch (e) {
          log.error('Failed to write chunk', { sessionId, chunkIndex }, e)
          const retryKey = `${sessionId}_${chunkIndex}`
          const retries = (this.retryCount.get(retryKey) || 0) + 1
          this.retryCount.set(retryKey, retries)

          if (retries <= CHUNK_RETRY_COUNT) {
            log.warn('Retrying chunk', { sessionId, chunkIndex, retry: retries })
            // 重新请求当前分片
            setTimeout(() => this.requestNextChunk(sessionId, conn, chunkIndex), 500 * retries)
          } else {
            this.retryCount.delete(retryKey)
            const errMsg: ErrorMessage = {
              type: 'error',
              data: { message: `Chunk ${chunkIndex} write failed after ${CHUNK_RETRY_COUNT} retries` }
            }
            conn.send(errMsg)
            this.updateSessionStatus(sessionId, 'error', `Chunk ${chunkIndex} write failed`)
          }
        }
        break
      }

      case 'error': {
        const errData = (msg as ErrorMessage).data
        log.error('Sender reported error', { sessionId, error: errData.message })
        this.updateSessionStatus(sessionId, 'error', errData.message)
        break
      }
    }
  }

  private retryCount: Map<string, number> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private readonly MAX_RECONNECT_ATTEMPTS = 3

  private requestNextChunk(sessionId: string, conn: DataConnection, chunkIndex: number): void {
    const msg: RequestChunkMessage = {
      type: 'request-chunk',
      data: { chunkIndex }
    }
    conn.send(msg)
  }

  private findFirstMissingChunk(totalChunks: number, received: Set<number>): number {
    for (let i = 0; i < totalChunks; i++) {
      if (!received.has(i)) return i
    }
    return totalChunks - 1 // All received, will trigger verify
  }

  private attemptReconnect(sessionId: string, shareCode: string, senderPeerId?: string): void {
    const attempts = (this.reconnectAttempts.get(sessionId) || 0) + 1
    this.reconnectAttempts.set(sessionId, attempts)

    if (attempts > this.MAX_RECONNECT_ATTEMPTS) {
      this.updateSessionStatus(sessionId, 'error', 'Connection lost, max reconnect attempts reached')
      this.reconnectAttempts.delete(sessionId)
      return
    }

    const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000)
    log.info('Reconnecting', { sessionId, attempt: attempts, delay })

    setTimeout(async () => {
      try {
        // Destroy old peer and create new one
        const oldPeer = this.peer
        if (oldPeer) {
          oldPeer.destroy()
          this.peer = null
        }

        const peer = await this.createPeerWithRetry()
        this.peer = peer

        const targetPeerId = senderPeerId || shareCode
        const conn = peer.connect(targetPeerId, { reliable: true, serialization: 'binary' })
        this.connections.set(sessionId, conn)

        conn.on('open', () => {
          this.reconnectAttempts.delete(sessionId)
          log.info('Reconnected successfully', { sessionId })
          // Resume from first missing chunk
          const info = this.fileInfo.get(sessionId)
          if (info) {
            const firstMissing = this.findFirstMissingChunk(info.totalChunks, info.receivedChunks)
            this.requestNextChunk(sessionId, conn, firstMissing)
          }
        })

        conn.on('data', (data: unknown) => {
          this.handleReceiverMessage(sessionId, conn, data as P2PMessage)
        })

        conn.on('error', (err) => {
          log.error('Reconnect connection error', sessionId, err)
          this.attemptReconnect(sessionId, shareCode, senderPeerId)
        })
      } catch (e: unknown) {
        log.error('Reconnect failed', sessionId, e)
        this.attemptReconnect(sessionId, shareCode, senderPeerId)
      }
    }, delay)
  }

  private async verifyAndComplete(sessionId: string, conn: DataConnection): Promise<void> {
    const info = this.fileInfo.get(sessionId)
    if (!info) return
    const session = this.receiverSessions.get(sessionId)
    if (!session) return

    log.info('Verifying received file', { sessionId })

    try {
      const receivedMd5 = await hashFile(info.tempFilePath, 'md5')

      if (receivedMd5.toLowerCase() !== info.fileMd5.toLowerCase()) {
        throw new Error('MD5 verification failed')
      }

      const completeMsg: CompleteMessage = {
        type: 'complete',
        data: { receivedMd5 }
      }
      conn.send(completeMsg)

      saveShareHistory({
        id: `share_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'receive',
        instanceName: info.instanceName,
        mcVersion: info.mcVersion || null,
        loaderType: info.loaderType || null,
        shareCode: session.shareCode,
        fileSize: info.fileSize,
        status: 'completed',
        errorMsg: null
      })
      this.updateSessionStatus(sessionId, 'completed')
      log.info('Receive session completed successfully', { sessionId })
    } catch (e) {
      log.error('Verification failed', { sessionId }, e)
      const errMsg: ErrorMessage = {
        type: 'error',
        data: { message: 'File verification failed' }
      }
      conn.send(errMsg)
      this.updateSessionStatus(sessionId, 'error', 'File verification failed')
    }
  }

  private updateSessionStatus(
    sessionId: string,
    status: ShareSession['status'],
    error?: string
  ): void {
    let session = this.senderSessions.get(sessionId) || this.receiverSessions.get(sessionId)
    if (!session) return

    session = { ...session, status }
    if (error) {
      session.error = error
    }
    if (status === 'completed' || status === 'error') {
      session.endTime = Date.now()
    }

    if (this.senderSessions.has(sessionId)) {
      this.senderSessions.set(sessionId, session)
    } else {
      this.receiverSessions.set(sessionId, session)
    }

    const callback = this.statusCallbacks.get(sessionId)
    if (callback) {
      callback(session)
    }
  }

  private notifyProgress(sessionId: string): void {
    const session = this.senderSessions.get(sessionId) || this.receiverSessions.get(sessionId)
    if (!session) return

    const elapsed = (Date.now() - session.startTime) / 1000
    const bytesPerSecond = elapsed > 0 ? (session.transferredChunks * 1024 * 1024) / elapsed : 0

    const remainingChunks = session.totalChunks - session.transferredChunks
    const estimatedRemaining =
      bytesPerSecond > 0 ? (remainingChunks * 1024 * 1024) / bytesPerSecond : 0

    const progress: TransferProgress = {
      sessionId,
      transferredChunks: session.transferredChunks,
      totalChunks: session.totalChunks,
      bytesPerSecond,
      estimatedRemaining
    }

    // Store computed speed on session for session-update consumers
    session.bytesPerSecond = bytesPerSecond
    session.estimatedRemaining = estimatedRemaining

    const callback = this.progressCallbacks.get(sessionId)
    if (callback) {
      callback(progress)
    }
  }

  getSession(sessionId: string): ShareSession | undefined {
    return this.senderSessions.get(sessionId) || this.receiverSessions.get(sessionId)
  }

  getReceivedFilePath(sessionId: string): string | undefined {
    return this.fileInfo.get(sessionId)?.tempFilePath
  }

  getReceivedFileInfo(sessionId: string) {
    const info = this.fileInfo.get(sessionId)
    if (!info) return undefined
    return {
      instanceName: info.instanceName,
      mcVersion: info.mcVersion,
      loaderType: info.loaderType,
      loaderVersion: info.loaderVersion,
      filePath: info.tempFilePath,
      fileMd5: info.fileMd5
    }
  }

  onProgress(sessionId: string, callback: (progress: TransferProgress) => void): void {
    this.progressCallbacks.set(sessionId, callback)
  }

  onStatusChange(sessionId: string, callback: (session: ShareSession) => void): void {
    this.statusCallbacks.set(sessionId, callback)
  }

  closeSession(sessionId: string): void {
    log.info('Closing session', { sessionId })

    const conn = this.connections.get(sessionId)
    if (conn) {
      try {
        conn.close()
      } catch {
        // ignore
      }
      this.connections.delete(sessionId)
    }

    const receiverSession = this.receiverSessions.get(sessionId)
    const senderSession = this.senderSessions.get(sessionId)
    const session = receiverSession || senderSession

    // 保存分享历史记录
    if (session) {
      const info = this.fileInfo.get(sessionId)
      const packed = session.packedInstance
      saveShareHistory({
        id: sessionId,
        type: session.type,
        instanceName: info?.instanceName || packed?.instanceName || 'unknown',
        mcVersion: info?.mcVersion || packed?.mcVersion || null,
        loaderType: info?.loaderType || packed?.loaderType || null,
        shareCode: session.shareCode,
        fileSize: info?.fileSize || packed?.fileSize || 0,
        status: session.status,
        errorMsg: session.error || null
      })
    }

    if (receiverSession) {
      // 「稍后导入」场景下保留已完成会话的文件，等导入后再清理
      if (receiverSession.status !== 'completed') {
        const info = this.fileInfo.get(sessionId)
        if (info?.tempFilePath && fs.existsSync(info.tempFilePath)) {
          try {
            fs.unlinkSync(info.tempFilePath)
          } catch {
            // ignore
          }
        }
        this.fileInfo.delete(sessionId)
      }
      this.receiverSessions.delete(sessionId)
    }

    if (senderSession?.shareCode) {
      this.shareCodeToPeerId.delete(senderSession.shareCode)
    }

    this.senderSessions.delete(sessionId)
    this.progressCallbacks.delete(sessionId)
    this.statusCallbacks.delete(sessionId)
    this.reconnectAttempts.delete(sessionId)

    if (this.peer && this.senderSessions.size === 0 && this.receiverSessions.size === 0) {
      try {
        this.peer.destroy()
      } catch {
        // ignore
      }
      this.peer = null
    }

    log.info('Session closed', { sessionId })
  }

  closeAllSessions(): void {
    for (const sessionId of [...this.senderSessions.keys(), ...this.receiverSessions.keys()]) {
      this.closeSession(sessionId)
    }
  }
}

/**
 * 分享历史记录条目
 */
export interface ShareHistoryEntry {
  id: string
  type: string
  instanceName: string
  mcVersion: string | null
  loaderType: string | null
  shareCode: string
  fileSize: number
  status: string
  errorMsg: string | null
  createdAt: string
}

/**
 * 保存分享历史记录到数据库
 */
function saveShareHistory(entry: {
  id: string
  type: string
  instanceName: string
  mcVersion: string | null
  loaderType: string | null
  shareCode: string
  fileSize: number
  status: string
  errorMsg: string | null
}): void {
  try {
    const db = getDatabase()
    db.prepare(
      `INSERT INTO share_history (id, type, instance_name, mc_version, loader_type, share_code, file_size, status, error_msg)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(entry.id, entry.type, entry.instanceName, entry.mcVersion, entry.loaderType, entry.shareCode, entry.fileSize, entry.status, entry.errorMsg)
  } catch (e: unknown) {
    log.error('Failed to save share history', (e as Error).message)
  }
}

/**
 * 获取分享历史记录
 */
export function getShareHistory(limit: number = 50): ShareHistoryEntry[] {
  try {
    const db = getDatabase()
    const rows = db
      .prepare(
        `SELECT id, type, instance_name AS instanceName, mc_version AS mcVersion,
                loader_type AS loaderType, share_code AS shareCode, file_size AS fileSize,
                status, error_msg AS errorMsg, created_at AS createdAt
         FROM share_history
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(limit) as ShareHistoryEntry[]
    return rows
  } catch (e: unknown) {
    log.error('Failed to get share history', (e as Error).message)
    return []
  }
}

export const p2pShareService = new P2PShareService()
