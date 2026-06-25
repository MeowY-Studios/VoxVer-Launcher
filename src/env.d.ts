/// <reference types="vite/client" />

import type { ShareSession, ShareImportResult, ShareStartResult } from './types/ipc'

interface IpcResult<T = void> {
  ok: boolean
  data?: T
  error?: string
}

interface DownloadProgress {
  taskId: string
  versionId: string
  phase: string
  phaseLabel: string
  progress: number
  downloaded: number
  total: number
  speed: number
  gameDir: string
}

interface DownloadComplete {
  taskId: string
  versionId: string
  gameDir: string
}

interface DownloadError {
  taskId: string
  versionId: string
  error: string
}

interface ScanMinecraftResult {
  valid: boolean
  suggestions?: string[]
  mcVersion?: string
  loaderType?: string
  loaderVersion?: string
  modsCount?: number
  configCount?: number
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/** IPC 通用响应格式 */
interface IpcResult<T = void> {
  ok: boolean
  data?: T
  error?: string
}

/** Download API 响应格式 */
interface DownloadResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/** 实例扫描结果 */
interface ScanMinecraftResult {
  valid: boolean
  suggestions?: string[]
  mcVersion?: string
  loaderType?: string
  loaderVersion?: string
  modsCount?: number
  configCount?: number
}

interface ElectronAPI {
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void
  }
  app: {
    getVersion: () => Promise<string>
  }
  config: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<void>
    getSecure: (key: string) => Promise<unknown>
    setSecure: (key: string, value: string) => Promise<void>
  }
  instance: {
    list: () => Promise<unknown[]>
    create: (data: unknown) => Promise<unknown>
    update: (id: string, data: unknown) => Promise<unknown>
    delete: (id: string) => Promise<void>
    getById: (id: string) => Promise<unknown | null>
    updateName: (id: string, name: string) => Promise<void>
    updateDescription: (id: string, description: string) => Promise<void>
    toggleFavorite: (id: string) => Promise<void>
    scanMinecraft: (dirPath: string) => Promise<IpcResult<ScanMinecraftResult>>
    exportInstance: (id: string, destPath: string, options?: unknown) => Promise<IpcResult>
    importInstance: (mclaFilePath: string, targetDir: string) => Promise<IpcResult>
  }
  account: {
    list: () => Promise<Account[]>
    getDeviceCode: () => Promise<IpcResult>
    loginMicrosoft: () => Promise<IpcResult<Account>>
    cancelLogin: () => Promise<IpcResult>
    loginOffline: (username: string) => Promise<IpcResult<Account>>
    delete: (id: string) => Promise<void>
    setActive: (id: string) => Promise<void>
    refreshToken: (id: string) => Promise<IpcResult>
    openVerificationUrl: () => Promise<IpcResult>
    getSkinDataUrl: (uuid: string) => Promise<IpcResult<string>>
    onLoginProgress: (callback: (payload: { stage: string; detail?: string }) => void) => () => void
  }
  download: {
    searchMods: (params: unknown) => Promise<unknown[]>
    getProject: (projectId: string, platform: string) => Promise<unknown>
    getFiles: (projectId: string, platform: string, options?: unknown) => Promise<unknown[]>
    downloadFile: (file: unknown, dest: string) => Promise<string>
    getActive: () => Promise<unknown[]>
    getQueue: () => Promise<unknown[]>
    onProgress: (callback: (progress: unknown) => void) => () => void
    cancelDownload: (id: string) => Promise<void>
  }
  java: {
    detect: () => Promise<unknown[]>
    getDefault: () => Promise<string | null>
    setDefault: (javaPath: string) => Promise<void>
    validate: (javaPath: string) => Promise<{ success: boolean; javaVersion?: string; javacVersion?: string; error?: string }>
    recommendedMajor: (mcVersion: string) => Promise<number>
  }
  version: {
    listVersions: () => Promise<unknown[]>
    listLoaders: (mcVersion: string) => Promise<unknown[]>
  }
  versions: {
    scanFolder: (gameDir: string) => Promise<IpcResult<unknown[]>>
    isInstalled: (versionId: string, gameDir: string) => Promise<boolean>
    list: () => Promise<unknown>
    getLatest: () => Promise<unknown>
    getInfo: (versionId: string) => Promise<unknown>
    download: (versionId: string, gameDir: string) => Promise<IpcResult>
    downloadServer: (versionId: string, filePath: string) => Promise<IpcResult>
    downloadStart: (versionId: string, gameDir: string) => Promise<IpcResult<{ taskId: string }>>
    delete: (versionId: string, gameDir: string) => Promise<void>
    validate: (versionId: string, gameDir: string) => Promise<unknown>
    downloadMissing: (versionId: string, gameDir: string) => Promise<IpcResult<{ downloaded: number; total?: number; message?: string }>>
    onDownloadProgress: (callback: (data: { taskId: string; versionId: string; phase: string; phaseLabel: string; progress: number; downloaded: number; total: number; speed: number; gameDir: string }) => void) => () => void
    onDownloadComplete: (callback: (data: { taskId: string; versionId: string; gameDir: string }) => void) => () => void
    onDownloadError: (callback: (data: { taskId: string; versionId: string; error: string }) => void) => () => void
  }
  modloader: {
    getLoaders: (mcVersion: string) => Promise<unknown[]>
    install: (instanceId: string, loaderType: string, loaderVersion: string, gameDir: string) => Promise<void>
    onProgress: (callback: (data: unknown) => void) => () => void
  }
  game: {
    launch: (instanceId: string, accountId: string, versionId?: string) => Promise<IpcResult & { success?: boolean }>
    getLog: (instanceId: string) => Promise<string>
    terminate: () => Promise<void>
    isRunning: () => Promise<boolean>
    onProgress: (callback: (progress: unknown) => void) => () => void
    onLog: (callback: (log: string) => void) => () => void
    onExit: (callback: (code: number) => void) => () => void
    checkMissingFiles: (versionId: string) => Promise<unknown[]>
    confirmDownloadAndLaunch: (versionId: string, accountId?: string) => Promise<void>
  }
  dialog: {
    selectFolder: (options?: { title?: string }) => Promise<string | null>
    selectFile: (options?: { title?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>
  }
  shell: {
    openPath: (absPath: string) => Promise<void>
    openExternal: (url: string) => Promise<void>
  }
  path: {
    getMinecraft: () => Promise<string>
    getDefault: () => Promise<string>
    getAppPath: () => Promise<string>
    exists: (p: string) => Promise<boolean>
    getCustom: () => Promise<string | null>
    setCustom: (path: string) => Promise<void>
    clearCustom: () => Promise<void>
    createDir: (path: string) => Promise<void>
  }
  folders: {
    list: () => Promise<string[]>
    save: (paths: string[]) => Promise<void>
    add: (path: string) => Promise<string[]>
    remove: (path: string) => Promise<string[]>
    getLast: () => Promise<string | null>
    setLast: (path: string) => Promise<void>
  }
  crash: {
    parse: (logPath: string, instanceId: string) => Promise<unknown>
    diagnose: (logPath: string, instanceId: string) => Promise<unknown>
    list: (gameDir: string) => Promise<unknown[]>
    latest: (gameDir: string) => Promise<unknown>
    onCrash: (callback: (data: unknown) => void) => () => void
  }
  notification: {
    send: (payload: unknown) => Promise<void>
    getHistory: (limit?: number) => Promise<unknown[]>
    markRead: (id: string) => Promise<void>
    markAllRead: () => Promise<void>
    clear: () => Promise<void>
    getUnreadCount: () => Promise<number>
    onNotify: (callback: (item: unknown) => void) => () => void
    onClicked: (callback: (data: unknown) => void) => () => void
  }
  mod: {
    list: (gameDir: string) => Promise<IpcResult<unknown[]>>
    install: (sourcePath: string, gameDir: string) => Promise<IpcResult>
    uninstall: (modPath: string) => Promise<IpcResult>
    enable: (modPath: string) => Promise<IpcResult>
    disable: (modPath: string) => Promise<IpcResult>
    installBatch: (sourcePaths: string[], gameDir: string) => Promise<IpcResult>
    checkCompat: (mods: unknown[], targetVersion: string, loader?: string) => Promise<IpcResult>
    ensureDir: (gameDir: string) => Promise<IpcResult>
    listConfigs: (gameDir: string) => Promise<IpcResult<unknown[]>>
    getConfigContent: (filePath: string) => Promise<IpcResult<string>>
    saveConfigContent: (filePath: string, content: string) => Promise<IpcResult>
    openConfigDir: (gameDir: string) => Promise<IpcResult<string>>
    checkUpdate: (mods: unknown[], mcVersion?: string, loader?: string) => Promise<IpcResult>
    update: (mod: unknown, updateInfo: unknown) => Promise<IpcResult>
    onUpdateProgress: (callback: (data: unknown) => void) => () => void
    checkDependencies: (mods: unknown[], mcVersion?: string, loader?: string) => Promise<IpcResult>
    installDependencies: (mod: unknown, gameDir: string, mcVersion?: string, loader?: string) => Promise<IpcResult>
    onDependencyProgress: (callback: (data: unknown) => void) => () => void
  }
  updater: {
    check: () => Promise<unknown>
    download: () => Promise<void>
    install: () => Promise<void>
    getStatus: () => Promise<unknown>
    onStatusChange: (callback: (status: unknown) => void) => () => void
  }
  modpack: {
    pack: (payload: unknown) => Promise<IpcResult & { filePath?: string }>
    import: (payload: unknown) => Promise<IpcResult & { instancePath?: string }>
    getDefaultOutputDir: () => Promise<string>
    onProgress: (callback: (progress: unknown) => void) => () => void
  }
  hotkey: {
    list: () => Promise<unknown[]>
    update: (hotkey: unknown) => Promise<IpcResult>
    toggle: (id: string, enabled: boolean) => Promise<void>
    validate: (accelerator: string) => Promise<{ valid: boolean }>
    reload: () => Promise<void>
    onTrigger: (callback: (data: unknown) => void) => () => void
  }
  theme: {
    load: () => Promise<unknown>
    save: (settings: unknown) => Promise<void>
    importBackground: (sourcePath: string) => Promise<string | null>
    deleteBackground: (localPath: string) => Promise<void>
    computeVars: (hex: string) => Promise<unknown>
  }
  backup: {
    create: (options?: unknown) => Promise<IpcResult & { filePath?: string; size?: number }>
    restore: (backupPath: string) => Promise<IpcResult>
    list: () => Promise<unknown[]>
    delete: (fileName: string) => Promise<void>
    getDir: () => Promise<string>
    onProgress: (callback: (progress: unknown) => void) => () => void
  }
  share: {
    startInstance: (instanceId: string) => Promise<ShareStartResult>
    stopShare: (sessionId: string) => void
    closeSession: (sessionId: string) => void
    receiveInstance: (shareCode: string) => Promise<{ sessionId: string }>
    importReceived: (sessionId: string) => Promise<ShareImportResult>
    getSession: (sessionId: string) => Promise<unknown>
    onPackProgress: (callback: (event: Event, data: { instanceId: string; stage: string; progress: number }) => void) => () => void
    onSessionUpdate: (callback: (event: Event, data: { sessionId: string; session: ShareSession }) => void) => () => void
    onProgressUpdate: (callback: (event: Event, data: { sessionId: string; progress: { transferredChunks: number; totalChunks: number; bytesPerSecond: number; estimatedRemaining: number } }) => void) => () => void
    removePackProgressListener: (callback: (event: Event, data: { instanceId: string; stage: string; progress: number }) => void) => void
    removeSessionUpdateListener: (callback: (event: Event, data: { sessionId: string; session: ShareSession }) => void) => void
    removeProgressUpdateListener: (callback: (event: Event, data: { sessionId: string; progress: { transferredChunks: number; totalChunks: number; bytesPerSecond: number; estimatedRemaining: number } }) => void) => void
  }
  logger: {
    setLevel: (level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR') => Promise<void>
    exportDiagnostics: () => Promise<IpcResult & { path?: string }>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

// Extend vue-i18n types without overriding
import type { LocaleMessages } from './locale'

declare module 'vue-i18n' {
  export * from 'vue-i18n'
  interface DefineLocaleMessage extends LocaleMessages {}
}
