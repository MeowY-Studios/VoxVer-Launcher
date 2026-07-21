import { authenticateWithXmcl } from './xmcl.auth.service'
import { logger } from '../utils/logger'
const log = logger.child('OAuth')
/**
 * 微软 OAuth Device Flow 认证服务
 *
 * 认证链：
 *   1. MS Device Code  →  MS Access Token + Refresh Token
 *   2. MS Access Token →  Xbox Live + XSTS + Minecraft Token（由 @xmcl/user 处理）
 */

// ======= 常量 =======
const CLIENT_ID = 'a12fb152-fc1f-412f-8512-fe4ed9f96511' //  VoxVer Launcher ClientId
const DEVICE_CODE_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode'
const TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token'
const LIVE_TOKEN_URL = 'https://login.live.com/oauth20_token.srf' // 刷新 token 专用

// ======= 类型 =======
export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
  message: string
}

export interface MicrosoftTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface MinecraftProfile {
  name: string
  uuid: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  skinUrl?: string
  xuid?: string
}

// 进度回调类型（供 IPC 使用）
export type AuthProgressCallback = (stage: string, detail?: string) => void

// ======= 工具函数 =======

/** 用 Electron net 模块发送 HTTP 请求（避免 Node.js http 模块在 Electron 中的限制） */
async function httpPost(
  url: string,
  body: Record<string, string>,
  headers?: Record<string, string>
): Promise<Record<string, unknown>> {
  const isFormEncoded =
    !headers?.['Content-Type'] || headers['Content-Type'].includes('x-www-form-urlencoded')
  const bodyStr = isFormEncoded
    ? Object.entries(body)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    : JSON.stringify(body)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': isFormEncoded ? 'application/x-www-form-urlencoded' : 'application/json',
      Accept: 'application/json',
      // 微软 OAuth 必需 headers，防止 AADSTS900023 错误
      'x-client-SKU': 'VoxVer',
      'x-client-Ver': '0.3.0',
      'x-client-CPU': 'x64',
      'x-client-OS': 'Win32',
      ...headers
    },
    body: bodyStr
  })

  if (!res.ok) {
    const text = await res.text()
    // 解析 OAuth 错误（device_code 轮询的正常响应）
    const oauthErrorMatch = text.match(/"error"\s*:\s*"([^"]+)"/)
    const oauthError = oauthErrorMatch ? oauthErrorMatch[1] : null
    if (oauthError) {
      // authorization_pending / slow_down 是轮询的正常状态，不抛出异常
      if (oauthError === 'authorization_pending' || oauthError === 'slow_down') {
        return { error: oauthError }
      }
      // 其他 OAuth 错误（authorization_declined, expired_token 等）
      const descMatch = text.match(/"error_description"\s*:\s*"([^"]+)"/)
      throw new Error(`${oauthError}: ${descMatch ? descMatch[1].replace(/\\u0027/g, "'") : text}`)
    }
    // 解析 AADSTS 错误（Azure 层面的错误）
    const errorMatch = text.match(/AADSTS\d+/)
    const descMatch = text.match(/"error_description"\s*:\s*"([^"]+)"/)
    if (errorMatch) {
      const code = errorMatch[0]
      const desc = descMatch ? descMatch[1].replace(/\\u0027/g, "'") : text
      throw new Error(`${code}: ${desc}`)
    }
    // Xbox/XSTS/Minecraft 错误
    const xerrMatch = text.match(/"XErr"\s*:\s*(\d+)/)
    const errMsgMatch = text.match(/"message"\s*:\s*"([^"]+)"/)
    const detail =
      xerrMatch || errMsgMatch
        ? ` (${xerrMatch ? 'XErr=' + xerrMatch[1] : ''}${errMsgMatch ? ' ' + errMsgMatch[1] : ''})`
        : ''
    throw new Error(`HTTP ${res.status}: ${text}${detail}`)
  }

  return res.json()
}

// ======= 请求 Device Code =======

/**
 * Step 1: 请求 Device Code
 * 返回给用户展示的 user_code 和 verification_uri
 */
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const data = await httpPost(DEVICE_CODE_URL, {
    client_id: CLIENT_ID,
    scope: 'XboxLive.signin offline_access openid profile email'
  })
  return data as unknown as DeviceCodeResponse
}

/**
 * Step 2: 轮询 token endpoint，直到用户完成授权或超时
 * 返回 MS Access Token + Refresh Token
 */
export async function pollForToken(
  deviceCode: string,
  intervalSec: number,
  expiresSec: number,
  onProgress?: AuthProgressCallback,
  signal?: AbortSignal
): Promise<MicrosoftTokens> {
  const deadline = Date.now() + expiresSec * 1000
  const pollInterval = Math.max(intervalSec, 5) * 1000

  while (Date.now() < deadline) {
    if (signal?.aborted) {
      throw new Error('LOGIN_CANCELLED')
    }

    await sleep(pollInterval)

    if (signal?.aborted) {
      throw new Error('LOGIN_CANCELLED')
    }

    try {
      const data = await httpPost(TOKEN_URL, {
        client_id: CLIENT_ID,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceCode
      }) as Record<string, string>

      if (data.error) {
        // authorization_pending / slow_down = 用户还没操作，继续等
        if (data.error === 'authorization_pending') continue
        if (data.error === 'slow_down') {
          await sleep(5000)
          continue
        }
        // authorization_declined 等其他错误直接抛出
        throw new Error(`${data.error}: ${data.error_description || ''}`)
      }

      if (data.access_token) {
        onProgress?.('token_received', '微软令牌获取成功')
        return {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: Number(data.expires_in)
        }
      }
    } catch (e: unknown) {
      throw e
    }
  }

  throw new Error('LOGIN_TIMEOUT')
}

// ======= 刷新 Token =======

/**
 * 用 Refresh Token 静默刷新 Access Token（参考 StarLight.Core，使用 live.com 端点）
 */
export async function refreshMicrosoftToken(refreshToken: string): Promise<MicrosoftTokens> {
  const data = await httpPost(LIVE_TOKEN_URL, {
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    redirect_uri: 'https://login.live.com/oauth20_desktop.srf'
  }) as Record<string, string>

  if (!data.access_token) throw new Error('TOKEN_REFRESH_FAILED')
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_in: Number(data.expires_in)
  }
}

// ======= 完整登录流程（第 3-6 步，由 @xmcl/user 处理） =======

/**
 * 拿到 MS Access Token 后，走完整个认证链到 MC 档案
 * 使用 @xmcl/user 替代原来的手动 HTTP 调用
 */
export async function authenticateWithMicrosoftToken(
  msTokens: MicrosoftTokens,
  onProgress?: AuthProgressCallback
): Promise<MinecraftProfile> {
  onProgress?.('xbox_live', '正在连接 Xbox Live...')
  const result = await authenticateWithXmcl(msTokens.access_token)

  onProgress?.('profile', '正在获取游戏档案...')

  return {
    name: result.name,
    uuid: result.uuid,
    accessToken: result.mcAccessToken,
    refreshToken: msTokens.refresh_token,
    expiresIn: msTokens.expires_in,
    skinUrl: result.skinUrl,
    xuid: result.xuid
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
