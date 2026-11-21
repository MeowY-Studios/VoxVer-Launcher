/**
 * 版本号比较工具
 * 统一使用数字段比较，避免 26.x / 1.21.11 这类版本被字符串比较误判。
 */
import type { LoaderBuild } from './types'

/** 解析版本号中的数字段 */
function numericSegments(version: string): number[] {
  return version
    .split(/[.-]/)
    .map((part) => parseInt(part, 10))
    .filter((part) => !Number.isNaN(part))
}

/** 版本号升序比较；无法解析时按原字符串比较 */
export function compareNumericVersion(a: string, b: string): number {
  const aSegments = numericSegments(a)
  const bSegments = numericSegments(b)
  if (aSegments.length === 0 || bSegments.length === 0) {
    return a.localeCompare(b)
  }
  const length = Math.max(aSegments.length, bSegments.length)
  for (let i = 0; i < length; i++) {
    const aNum = aSegments[i] ?? 0
    const bNum = bSegments[i] ?? 0
    if (aNum !== bNum) return aNum - bNum
  }
  return 0
}

/** 是否为预发布版本 */
export function isPrereleaseVersion(version: string): boolean {
  return /(?:^|[-.+])(?:alpha|beta|snapshot|pre|rc)/i.test(version)
}

/** 构建列表排序：稳定版优先，其次版本号倒序 */
export function sortBuilds(builds: LoaderBuild[]): LoaderBuild[] {
  return [...builds].sort((a, b) => {
    const aPre = a.prerelease ? 1 : 0
    const bPre = b.prerelease ? 1 : 0
    if (aPre !== bPre) return aPre - bPre
    return compareNumericVersion(b.version, a.version)
  })
}
