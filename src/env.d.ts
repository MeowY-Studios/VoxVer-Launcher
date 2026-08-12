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

export interface ScanMinecraftResult {
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
  const component: DefineComponent<{}, {}, Record<string, unknown>>
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

/** 导出选项 */
interface ExportOptions {
  includeMods?: boolean
  includeDisabledMods?: boolean
  includeConfigs?: boolean
  includeResourcePacks?: boolean
  includeShaderPacks?: boolean
  includeSaves?: boolean
}

/** 导出预览数据 */
interface ExportPreviewData {
  mods: Array<{
    id: string
    name: string
    version: string
    filePath: string
    fileName: string
    size: number
    enabled: boolean
    logoUrl?: string
  }>
  resourcePacks: Array<{ name: string; size: number }>
  shaderPacks: Array<{ name: string; size: number }>
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
    getPaths: () => Promise<{
      userData: string
      logs: string
      temp: string
      cache: string
      downloads: string
      home: string
    }>
    getRuntimeInfo: () => Promise<{
      appVersion: string
      electron: string
      chrome: string
      node: string
      v8: string
      platform: string
      arch: string
    }>
    clearCache: () => Promise<string[]>
    resetSettings: () => Promise<boolean>
    checkPermissions: () => Promise<{
      inProtectedDir: boolean
      canWriteToUserData: boolean
      exePath: string
      userDataPath: string
      isAdmin: boolean
    }>
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
    delete: (id: string, deleteFiles?: boolean) => Promise<void>
    getById: (id: string) => Promise<unknown | null>
    updateName: (id: string, name: string) => Promise<void>
    updateDescription: (id: string, description: string) => Promise<void>
    toggleFavorite: (id: string) => Promise<void>
    // 文件管理
    listMods: (id: string) => Promise<unknown[]>
    toggleMod: (id: string, filename: string, enabled: boolean) => Promise<boolean>
    deleteMod: (id: string, filename: string) => Promise<boolean>
    diskUsage: (id: string) => Promise<{
      total: number
      mods: number
      saves: number
      resourcepacks: number
      shaderpacks: number
      config: number
      others: number
    }>
    // 资源包
    listResourcePacks: (id: string) => Promise<Array<{
      filename: string
      size: number
      enabled: boolean
      modifiedAt: string
      isDir: boolean
    }>>
    toggleResourcePack: (id: string, filename: string, enabled: boolean) => Promise<boolean>
    deleteResourcePack: (id: string, filename: string) => Promise<boolean>
    // 光影包
    listShaderPacks: (id: string) => Promise<Array<{
      filename: string
      size: number
      enabled: boolean
      modifiedAt: string
      isDir: boolean
    }>>
    toggleShaderPack: (id: string, filename: string, enabled: boolean) => Promise<boolean>
    deleteShaderPack: (id: string, filename: string) => Promise<boolean>
    // 存档
    listSaves: (id: string) => Promise<Array<{
      filename: string
      size: number
      enabled: boolean
      modifiedAt: string
      isDir: boolean
    }>>
    renameSave: (id: string, oldName: string, newName: string) => Promise<boolean>
    backupSave: (id: string, name: string) => Promise<string | null>
    deleteSave: (id: string, name: string) => Promise<boolean>
    // 导入导出
    scanMinecraft: (dirPath: string) => Promise<IpcResult<ScanMinecraftResult>>
    exportInstance: (id: string, destPath: string, options?: ExportOptions) => Promise<IpcResult>
    importInstance: (mclaFilePath: string, targetDir: string) => Promise<IpcResult>
    exportPreview: (gameDir: string) => Promise<IpcResult<ExportPreviewData>>
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
    // 镜像源管理
    getMirrors: () => Promise<{ success: boolean; data: Array<{ name: string; url: string; ping: number }> }>
    getCurrentMirror: () => Promise<{ success: boolean; data: { name: string; url: string; ping: number } }>
    setMirror: (index: number) => Promise<{ success: boolean }>
    testMirrorSpeed: () => Promise<{ success: boolean; data: Array<{ name: string; url: string; ping: number }> }>
    autoSelectMirror: () => Promise<{ success: boolean; data: number }>
    // 下载设置
    getDownloadConfig: () => Promise<{ success: boolean; data: { maxConcurrent: number; maxThreadsPerFile: number; speedLimit: number; maxRetries: number; currentMirror: { name: string; url: string; ping: number }; mirrors: Array<{ name: string; url: string; ping: number }> } }>
    setMaxConcurrent: (max: number) => Promise<{ success: boolean }>
    setMaxThreads: (max: number) => Promise<{ success: boolean }>
    setSpeedLimit: (limit: number) => Promise<{ success: boolean }>
    setMaxRetries: (max: number) => Promise<{ success: boolean }>
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
    saveSettings: (instanceId: string, settings: Record<string, unknown>) => Promise<void>
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
    getVersions: (mcVersion: string, loaderType: string) => Promise<{ ok: boolean; data: string[]; error?: string }>
    install: (instanceId: string, loaderType: string, loaderVersion: string, gameDir: string) => Promise<void>
    onProgress: (callback: (data: unknown) => void) => () => void
  }
  game: {
    launch: (instanceId: string, accountId: string, versionId?: string) => Promise<IpcResult & { success?: boolean; pid?: number; needsFileDownload?: boolean; missingFiles?: Array<{ type: string; name: string; path: string; size?: number }> }>
    getLog: (instanceId: string) => Promise<string>
    terminate: () => Promise<void>
    isRunning: () => Promise<boolean>
    onProgress: (callback: (progress: unknown) => void) => () => void
    onLog: (callback: (log: { text: string; level: string }) => void) => () => void
    onExit: (callback: (code: { code: number; signal: string | null; instanceId?: string }) => void) => () => void
    checkMissingFiles: (versionId: string) => Promise<unknown[]>
    confirmDownloadAndLaunch: (versionId: string, accountId?: string) => Promise<IpcResult & { success?: boolean; pid?: number }>
  }
  dialog: {
    selectFolder: (options?: { title?: string }) => Promise<string | null>
    selectFile: (options?: { title?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>
    readAsDataURL: (filePath: string) => Promise<string | null>
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
    getHistory: (limit?: number) => Promise<{ ok: boolean; data: unknown[]; error?: string }>
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
    check: () => Promise<{ success: boolean }>
    download: () => Promise<{ success: boolean }>
    install: () => Promise<{ success: boolean }>
    getStatus: () => Promise<{ success: boolean; data: unknown }>
    getConfig: () => Promise<{ channel: string; autoCheck: boolean }>
    setChannel: (channel: string) => Promise<{ success: boolean }>
    setAutoCheck: (enabled: boolean) => Promise<{ success: boolean }>
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
    exportTheme: (settings: unknown) => Promise<{ ok: boolean; json?: string; error?: string }>
    importTheme: (json: string) => Promise<{ ok: boolean; settings?: unknown; cssVars?: unknown; backgroundDataUrl?: string | null; error?: string }>
    getPresets: () => Promise<Array<{ id: string; name: string; description: string; themeColor: string; accentColor: string }>>
  }
  backup: {
    create: (options?: unknown) => Promise<IpcResult & { filePath?: string; size?: number }>
    restore: (backupPath: string) => Promise<IpcResult>
    list: () => Promise<unknown[]>
    delete: (fileName: string) => Promise<void>
    getDir: () => Promise<string>
    onProgress: (callback: (progress: unknown) => void) => () => void
  }
  externalLauncher: {
    detect: () => Promise<{ success: boolean; data: Array<{ type: string; name: string; path: string; instances: Array<{ name: string; version: string; loaderType: string; loaderVersion: string; gameDir: string; modCount: number; source: string }>; detected: boolean }> }>
    scanDir: (gameDir: string) => Promise<{ success: boolean; data: { name: string; version: string; loaderType: string; loaderVersion: string; gameDir: string; modCount: number; source: string } | null }>
  }
  screenshot: {
    list: (gameDir: string) => Promise<{ ok: boolean; data: Array<{ fileName: string; filePath: string; size: number; createdAt: number; thumbnail: string | null }> }>
    listAll: (gameDir: string) => Promise<{ ok: boolean; data: Array<{ fileName: string; filePath: string; size: number; createdAt: number }> }>
    preview: (filePath: string) => Promise<{ ok: boolean; dataUrl: string | null }>
    thumbnail: (filePath: string) => Promise<{ ok: boolean; dataUrl: string | null }>
    delete: (filePath: string) => Promise<{ ok: boolean }>
    rename: (filePath: string, newName: string) => Promise<{ ok: boolean; newPath: string | null }>
    export: (filePath: string) => Promise<{ ok: boolean }>
    copy: (filePath: string) => Promise<{ ok: boolean }>
    open: (filePath: string) => Promise<void>
  }
  perfMonitor: {
    start: (pid: number) => Promise<{ ok: boolean }>
    stop: () => Promise<{ ok: boolean }>
    status: () => Promise<{ active: boolean; pid: number | null }>
    onSnapshot: (callback: (snap: { pid: number; alive: boolean; cpu: number; memoryMB: number; uptimeMs: number; timestamp: number }) => void) => () => void
  }
  share: {
    startInstance: (instanceId: string) => Promise<ShareStartResult>
    stopShare: (sessionId: string) => void
    closeSession: (sessionId: string) => void
    receiveInstance: (shareCode: string) => Promise<{ sessionId: string }>
    importReceived: (sessionId: string) => Promise<ShareImportResult>
    getSession: (sessionId: string) => Promise<unknown>
    onProtocolInvoke: (callback: (shareCode: string) => void) => () => void
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

  devTools: {
    open: () => Promise<void>
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
