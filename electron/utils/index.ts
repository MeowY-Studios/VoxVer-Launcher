/**
 * electron/utils/ 工具模块统一导出
 */

export { logger, setLevel, setFileLogging, getLogDir } from './logger'
export type { Logger } from './logger'

export { encrypt, decrypt, encryptToHex, decryptFromHex } from './crypto'

export { hashFile, hashFileSync, hashString, verifyFileHash } from './hash'

export { safeJoin, validateVersionId, validatePathSafe } from './path-validation'

export {
  findVersionJsonPath,
  readVersionMeta,
  detectMcVersion,
  detectLoader,
  detectVersionInfo,
  formatLoaderInfo
} from './version-meta'
export type { LoaderKind, LoaderInfo, VersionJsonMeta, VersionDetection } from './version-meta'

export {
  platform,
  detectJavaInstallations,
  normalizePath,
  buildShellCommand,
  revealInExplorer
} from './platform'
export type { PlatformInfo, OSType, JavaEntry } from './platform'
