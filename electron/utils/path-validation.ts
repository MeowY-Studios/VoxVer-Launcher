/**
 * 安全路径工具
 *
 * 防止路径遍历攻击：
 * - safeJoin: 确保子路径不离开基准目录
 * - validateVersionId: 校验版本号仅含安全字符
 */

import { resolve, join } from 'path'

/**
 * 安全拼合路径，确保结果不会逃逸出基准目录
 * @param baseDir 基准目录（受信任的根目录）
 * @param segments 子路径段
 * @returns 安全拼合后的绝对路径
 * @throws 如果拼接结果逃逸出 baseDir
 */
export function safeJoin(baseDir: string, ...segments: string[]): string {
  const fullPath = resolve(baseDir, join(...segments))
  const normalizedBase = resolve(baseDir)
  if (fullPath !== normalizedBase && !fullPath.startsWith(normalizedBase + '\\') && !fullPath.startsWith(normalizedBase + '/')) {
    throw new Error(`路径遍历检测: ${fullPath} 不在 ${normalizedBase} 内`)
  }
  return fullPath
}

/**
 * 校验版本号 ID 仅包含安全字符
 * 允许：字母、数字、点、下划线、连字符
 */
export function validateVersionId(versionId: string): void {
  if (!versionId || !/^[a-zA-Z0-9._-]+$/.test(versionId) || versionId.includes('..')) {
    throw new Error(`非法版本号: ${versionId}`)
  }
}

/**
 * 校验路径中不包含危险字符（用于命令拼接场景）
 */
export function validatePathSafe(path: string): void {
  if (path.includes('"') || path.includes("'") || path.includes(';') || path.includes('&') || path.includes('|')) {
    throw new Error(`路径包含危险字符: ${path}`)
  }
}
