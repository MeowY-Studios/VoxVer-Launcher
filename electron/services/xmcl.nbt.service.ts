/**
 * XMCL NBT 解析服务
 * 封装 @xmcl/nbt 的序列化/反序列化功能
 */

import { serialize, deserialize, SerializationOption, DeserializationOption } from '@xmcl/nbt'
import { logger } from '../utils/logger'

const log = logger.child('XmclNbt')

export interface NbtSerializeOptions {
  compressed?: boolean | 'deflate' | 'gzip'
  filename?: string
}

export interface NbtDeserializeOptions<T = Record<string, unknown>> {
  compressed?: boolean | 'deflate' | 'gzip'
  type?: new () => T
}

/**
 * 将 JSON 对象序列化为 NBT 二进制数据
 */
export async function serializeToNbt(
  data: Record<string, unknown>,
  options?: NbtSerializeOptions
): Promise<Uint8Array> {
  try {
    return await serialize(data, options as SerializationOption)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error(`[serializeToNbt] 序列化失败: ${msg}`)
    throw e
  }
}

/**
 * 将 NBT 二进制数据反序列化为 JSON 对象
 */
export async function deserializeNbt<T = Record<string, unknown>>(
  fileData: Uint8Array,
  options?: NbtDeserializeOptions<T>
): Promise<T> {
  try {
    return await deserialize<T>(fileData, options as DeserializationOption<T>)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error(`[deserializeNbt] 反序列化失败: ${msg}`)
    throw e
  }
}
