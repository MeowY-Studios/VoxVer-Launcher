import { MicrosoftAuthenticator, MojangClient, offline as xmclOffline } from '@xmcl/user'
import { logger } from '../utils/logger'

const log = logger.child('XmclAuth')

// Re-export the offline function
export { xmclOffline }

/** MicrosoftMinecraftProfile 精简结果 */
export interface XmclMinecraftProfile {
  id: string
  name: string
  skinUrl?: string
}

/** XMCL 认证链结果 */
export interface XmclAuthResult {
  name: string
  uuid: string
  mcAccessToken: string
  skinUrl?: string
  xuid?: string
}

const authenticator = new MicrosoftAuthenticator({})
const mojangClient = new MojangClient({})

/**
 * 使用 XMCL 完成 Xbox Live → XSTS → Minecraft 认证链
 * 替换原来的 authenticateWithMicrosoftToken 中的第 3-5 步
 *
 * @param msAccessToken 微软 OAuth Access Token
 * @returns Minecraft 档案信息 + MC Access Token
 */
export async function authenticateWithXmcl(
  msAccessToken: string
): Promise<XmclAuthResult> {
  // Step 1: Xbox Live 认证
  log.info('[XmclAuth] Step 1: authenticateXboxLive...')
  const xblRes = await authenticator.authenticateXboxLive(msAccessToken)
  const xblToken = xblRes.Token
  const uhs = xblRes.DisplayClaims?.xui?.[0]?.uhs ?? ''
  const xuid = xblRes.DisplayClaims?.xui?.[0]?.xid ?? uhs

  log.info('[XmclAuth] XBL response received, uhs:', uhs, 'xuid:', xuid)
  if (!xblToken || !uhs) throw new Error('XBL_AUTH_FAILED')

  // Step 2: XSTS 认证
  log.info('[XmclAuth] Step 2: authorizeXboxLive...')
  const xstsRes = await authenticator.authorizeXboxLive(
    xblToken,
    'rp://api.minecraftservices.com/'
  )
  const xstsToken = xstsRes.Token

  log.info('[XmclAuth] XSTS response received')
  if (!xstsToken) throw new Error('XSTS_AUTH_FAILED')

  // Step 3: Minecraft 认证
  log.info('[XmclAuth] Step 3: loginMinecraftWithXBox...')
  const mcRes = await authenticator.loginMinecraftWithXBox(uhs, xstsToken)
  const mcAccessToken = mcRes.access_token

  log.info('[XmclAuth] MC auth response received')
  if (!mcAccessToken) throw new Error('MC_AUTH_FAILED')

  // Step 4: 获取 Minecraft 档案
  log.info('[XmclAuth] Step 4: getProfile...')
  const profile = await fetchProfileWithXmcl(mcAccessToken)

  return {
    name: profile.name,
    uuid: profile.id,
    mcAccessToken,
    skinUrl: profile.skinUrl,
    xuid
  }
}

/**
 * 使用 XMCL 的 MojangClient 获取 Minecraft 游戏档案
 * 替换原来的 fetchMinecraftProfile
 *
 * @param accessToken Minecraft Access Token
 * @returns 档案信息（name, uuid, skinUrl）
 */
export async function fetchProfileWithXmcl(
  accessToken: string
): Promise<XmclMinecraftProfile> {
  const profile = await mojangClient.getProfile(accessToken)

  // id 格式为不带横杠的 UUID，转成标准格式
  const rawId: string = profile.id
  const uuid = `${rawId.slice(0, 8)}-${rawId.slice(8, 12)}-${rawId.slice(12, 16)}-${rawId.slice(16, 20)}-${rawId.slice(20)}`

  const skinUrl = profile.skins?.[0]?.url

  return {
    id: uuid,
    name: profile.name,
    skinUrl
  }
}
