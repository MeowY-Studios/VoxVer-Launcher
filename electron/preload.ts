import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

// ===== 暴露给前端的局部类型定义（仅用于 preload 参数/回调约束） =====

/** 本地 Mod 信息（用于 mod API 参数约束） */
interface LocalMod {
  id?: string
  name?: string
  fileName?: string
  filePath?: string
  size?: number
  enabled?: boolean
  gameVersions?: string[]
  loaders?: string[]
  platform?: string
  version?: string
}

/** Mod 更新信息（用于 mod.update 参数约束） */
interface ModUpdateInfo {
  id?: string
  fileName?: string
  url?: string
  version?: string
}

/** 全局快捷键配置（用于 hotkey API 参数约束） */
interface HotkeyConfig {
  id?: string
  accelerator?: string
  action?: string
  enabled?: boolean
  description?: string
  label?: string
}

/** 主题设置（用于 theme API 参数约束） */
interface ThemeSettings {
  mode?: 'light' | 'dark' | 'system'
  primaryColor?: string
  backgroundUrl?: string
  useCustomBackground?: boolean
}

/** 备份选项（用于 backup API 参数约束） */
interface BackupOptions {
  includeInstances?: boolean
  includeAccounts?: boolean
  includeDownloads?: boolean
  includeSettings?: boolean
  outputPath?: string
}

/** Modpack 打包选项（用于 modpack API 参数约束） */
interface ModpackOptions {
  includeMods?: boolean
  includeConfigs?: boolean
  includeSaves?: boolean
  includeResourcePacks?: boolean
  includeResourcepacks?: boolean
  includeShaderPacks?: boolean
  overrides?: Record<string, unknown>
  name?: string
  author?: string
  version?: string
}

/** 更新器状态（用于 updater.onStatusChange 回调约束） */
interface UpdaterStatus {
  checking: boolean
  available: boolean
  downloading: boolean
  downloadProgress: number
  downloaded: boolean
  error: string | null
  version: string | null
  releaseNotes: string | null
}

/** 缺失文件信息（用于 game API 参数约束） */
interface MissingFileInfo {
  type: 'library' | 'asset' | 'natives' | 'version'
  name: string
  path: string
  size?: number
}

interface Account {
  id: string
  type: 'microsoft' | 'offline'
  name: string
  uuid: string
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  is_active: number
  skin_url: string | null
  xuid: string | null
  created_at: string
  updated_at: string
}

interface ApiResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

const api = {
  // 窗口控制
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onMaximizedChange: (callback: (isMaximized: boolean) => void) => {
      const listener = (_event: IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
      ipcRenderer.on('window:maximized-changed', listener)
      return () => ipcRenderer.removeListener('window:maximized-changed', listener)
    }
  },

  // 应用信息
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPaths: () => ipcRenderer.invoke('app:get-paths'),
    getRuntimeInfo: () => ipcRenderer.invoke('app:get-runtime-info'),
    clearCache: () => ipcRenderer.invoke('app:clear-cache'),
    resetSettings: () => ipcRenderer.invoke('app:reset-settings'),
    checkPermissions: () => ipcRenderer.invoke('app:check-permissions')
  },

  // 应用配置
  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
    getSecure: (key: string) => ipcRenderer.invoke('config:get-secure', key),
    setSecure: (key: string, value: string) => ipcRenderer.invoke('config:set-secure', key, value)
  },

  // 实例管理
  instance: {
    list: () => ipcRenderer.invoke('instance:list'),
    create: (data: unknown) => ipcRenderer.invoke('instance:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('instance:update', id, data),
    delete: (id: string, deleteFiles?: boolean) =>
      ipcRenderer.invoke('instance:delete', id, deleteFiles),
    getById: (id: string) => ipcRenderer.invoke('instance:get-by-id', id),
    // 快捷更新
    updateName: (id: string, name: string) => ipcRenderer.invoke('instance:update-name', id, name),
    updateDescription: (id: string, description: string) =>
      ipcRenderer.invoke('instance:update-description', id, description),
    toggleFavorite: (id: string) => ipcRenderer.invoke('instance:toggle-favorite', id),
    // 文件管理
    listMods: (id: string) => ipcRenderer.invoke('instance:list-mods', id),
    toggleMod: (id: string, filename: string, enabled: boolean) =>
      ipcRenderer.invoke('instance:toggle-mod', id, filename, enabled),
    deleteMod: (id: string, filename: string) =>
      ipcRenderer.invoke('instance:delete-mod', id, filename),
    diskUsage: (id: string) => ipcRenderer.invoke('instance:disk-usage', id),
    // 资源包
    listResourcePacks: (id: string) => ipcRenderer.invoke('instance:list-resourcepacks', id),
    toggleResourcePack: (id: string, filename: string, enabled: boolean) =>
      ipcRenderer.invoke('instance:toggle-resourcepack', id, filename, enabled),
    deleteResourcePack: (id: string, filename: string) =>
      ipcRenderer.invoke('instance:delete-resourcepack', id, filename),
    // 光影包
    listShaderPacks: (id: string) => ipcRenderer.invoke('instance:list-shaderpacks', id),
    toggleShaderPack: (id: string, filename: string, enabled: boolean) =>
      ipcRenderer.invoke('instance:toggle-shaderpack', id, filename, enabled),
    deleteShaderPack: (id: string, filename: string) =>
      ipcRenderer.invoke('instance:delete-shaderpack', id, filename),
    // 存档
    listSaves: (id: string) => ipcRenderer.invoke('instance:list-saves', id),
    deleteSave: (id: string, name: string) => ipcRenderer.invoke('instance:delete-save', id, name),
    renameSave: (id: string, oldName: string, newName: string) =>
      ipcRenderer.invoke('instance:rename-save', id, oldName, newName),
    backupSave: (id: string, name: string) => ipcRenderer.invoke('instance:backup-save', id, name),
    // 导入导出
    scanMinecraft: (dirPath: string) => ipcRenderer.invoke('instance:scan-minecraft', dirPath),
    exportInstance: (
      id: string,
      destPath: string,
      options?: { includeMods?: boolean; includeConfigs?: boolean; includeSaves?: boolean }
    ) => ipcRenderer.invoke('instance:export', id, destPath, options),
    importInstance: (mclaFilePath: string, targetDir: string) =>
      ipcRenderer.invoke('instance:import', mclaFilePath, targetDir),
    exportPreview: (gameDir: string) =>
      ipcRenderer.invoke('instance:export-preview', gameDir)
  },

  // 账户管理
  account: {
    list: () => ipcRenderer.invoke('account:list') as Promise<Account[]>,
    getDeviceCode: () => ipcRenderer.invoke('account:get-device-code') as Promise<ApiResult>,
    loginMicrosoft: () => ipcRenderer.invoke('account:login-microsoft') as Promise<ApiResult<Account>>,
    cancelLogin: () => ipcRenderer.invoke('account:cancel-login') as Promise<ApiResult>,
    loginOffline: (username: string) => ipcRenderer.invoke('account:login-offline', username) as Promise<ApiResult<Account>>,
    delete: (id: string) => ipcRenderer.invoke('account:delete', id),
    setActive: (id: string) => ipcRenderer.invoke('account:set-active', id),
    refreshToken: (id: string) => ipcRenderer.invoke('account:refresh-token', id) as Promise<ApiResult>,
    openVerificationUrl: () => ipcRenderer.invoke('account:open-verification-url') as Promise<ApiResult>,
    getSkinDataUrl: (uuid: string) => ipcRenderer.invoke('account:get-skin-data-url', uuid) as Promise<ApiResult<string>>,
    onLoginProgress: (callback: (payload: { stage: string; detail?: string }) => void) => {
      const listener = (_event: IpcRendererEvent, payload: { stage: string; detail?: string }) =>
        callback(payload)
      ipcRenderer.on('account:login-progress', listener)
      return () => ipcRenderer.removeListener('account:login-progress', listener)
    }
  },

  // 下载管理
  download: {
    searchMods: (params: {
      query?: string
      source?: string
      platform?: string
      offset?: number
      limit?: number
      gameVersion?: string
      loader?: string
      category?: string
      projectType?: string
    }) => ipcRenderer.invoke('download:search-mods', params),
    getProject: (projectId: string, platform: string) =>
      ipcRenderer.invoke('download:get-project', projectId, platform),
    getFiles: (projectId: string, platform: string, options?: Record<string, unknown>) =>
      ipcRenderer.invoke('download:get-files', projectId, platform, options ?? {}),
    /** 下载 Mod 文件到指定目录 */
    downloadFile: (
      file: {
        id: string
        fileName: string
        url: string
        gameVersions: string[]
        loaders: string[]
        releaseType: string
        datePublished: string
        size: number
        downloads: number
        platform: string
      },
      dest: string
    ) => ipcRenderer.invoke('download:file', file, dest),
    getActive: () => ipcRenderer.invoke('download:get-active'),
    getQueue: () => ipcRenderer.invoke('download:get-queue'),
    onProgress: (callback: (progress: unknown) => void) => {
      const listener = (_event: IpcRendererEvent, progress: unknown) => callback(progress)
      ipcRenderer.on('download:progress', listener)
      return () => ipcRenderer.removeListener('download:progress', listener)
    },
    onStarted: (callback: (data: unknown) => void) => {
      const listener = (_event: IpcRendererEvent, data: unknown) => callback(data)
      ipcRenderer.on('download:started', listener)
      return () => ipcRenderer.removeListener('download:started', listener)
    },
    onCompleted: (callback: (data: unknown) => void) => {
      const listener = (_event: IpcRendererEvent, data: unknown) => callback(data)
      ipcRenderer.on('download:completed', listener)
      return () => ipcRenderer.removeListener('download:completed', listener)
    },
    onError: (callback: (data: unknown) => void) => {
      const listener = (_event: IpcRendererEvent, data: unknown) => callback(data)
      ipcRenderer.on('download:error', listener)
      return () => ipcRenderer.removeListener('download:error', listener)
    },
    onCancelled: (callback: (data: unknown) => void) => {
      const listener = (_event: IpcRendererEvent, data: unknown) => callback(data)
      ipcRenderer.on('download:cancelled', listener)
      return () => ipcRenderer.removeListener('download:cancelled', listener)
    },
    cancelDownload: (id: string) => ipcRenderer.invoke('download:cancel', id),
    // 镜像源管理
    getMirrors: () => ipcRenderer.invoke('download:mirrors:list'),
    getCurrentMirror: () => ipcRenderer.invoke('download:mirrors:get-current'),
    setMirror: (index: number) => ipcRenderer.invoke('download:mirrors:set', index),
    testMirrorSpeed: () => ipcRenderer.invoke('download:mirrors:test'),
    autoSelectMirror: () => ipcRenderer.invoke('download:mirrors:auto-select'),
    // 下载设置
    getDownloadConfig: () => ipcRenderer.invoke('download:settings:get-config'),
    setMaxConcurrent: (max: number) => ipcRenderer.invoke('download:settings:set-concurrent', max),
    setMaxThreads: (max: number) => ipcRenderer.invoke('download:settings:set-threads', max),
    setSpeedLimit: (limit: number) => ipcRenderer.invoke('download:settings:set-speed-limit', limit),
    setMaxRetries: (max: number) => ipcRenderer.invoke('download:settings:set-retries', max)
  },

  // Java 管理
  java: {
    detect: () => ipcRenderer.invoke('java:detect'),
    getDefault: () => ipcRenderer.invoke('java:get-default'),
    setDefault: (javaPath: string) => ipcRenderer.invoke('java:set-default', javaPath),
    validate: (javaPath: string) => ipcRenderer.invoke('java:validate', javaPath),
    recommendedMajor: (mcVersion: string) => ipcRenderer.invoke('java:recommended-major', mcVersion)
  },

  // 游戏版本
  version: {
    listVersions: () => ipcRenderer.invoke('version:list'),
    listLoaders: (mcVersion: string) => ipcRenderer.invoke('version:list-loaders', mcVersion)
  },

  // 已安装版本扫描
  versions: {
    scanFolder: (gameDir: string) => ipcRenderer.invoke('versions:scan-folder', { gameDir }),
    /** 检查单个版本是否已安装（支持 ModLoader 继承版本） */
    isInstalled: (versionId: string, gameDir: string) =>
      ipcRenderer.invoke('versions:is-installed', { versionId, gameDir }),
    list: () => ipcRenderer.invoke('versions:list'),
    getLatest: () => ipcRenderer.invoke('versions:get-latest'),
    getInfo: (versionId: string) => ipcRenderer.invoke('versions:get-info', versionId),
    /** 阻塞式下载 MC 版本 */
    download: (versionId: string, gameDir: string) =>
      ipcRenderer.invoke('versions:download', { versionId, gameDir }),
    /** 启动带进度的后台下载（立即返回 taskId） */
    downloadStart: (versionId: string, gameDir: string) =>
      ipcRenderer.invoke('versions:download-start', { versionId, gameDir }),
    /** 删除目录下的 MC 版本 */
    delete: (versionId: string, gameDir: string) =>
      ipcRenderer.invoke('versions:delete', { versionId, gameDir }),
    /** 检测缺失的文件 */
    validate: (versionId: string, gameDir: string) =>
      ipcRenderer.invoke('versions:validate', { versionId, gameDir }),
    /** 下载缺失的文件 */
    downloadMissing: (versionId: string, gameDir: string) =>
      ipcRenderer.invoke('versions:download-missing', { versionId, gameDir }),
    /** 监听版本下载进度（带 phase/speed 的详细进度） */
    onDownloadProgress: (
      callback: (data: {
        taskId: string
        versionId: string
        phase: string
        phaseLabel: string
        progress: number
        downloaded: number
        total: number
        speed: number
        gameDir: string
      }) => void
    ) => {
      const listener = (
        _event: IpcRendererEvent,
        data: {
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
      ) => callback(data)
      ipcRenderer.on('version:download-progress', listener)
      return () => ipcRenderer.removeListener('version:download-progress', listener)
    },
    /** 监听版本下载完成 */
    onDownloadComplete: (
      callback: (data: { taskId: string; versionId: string; gameDir: string }) => void
    ) => {
      const listener = (
        _event: IpcRendererEvent,
        data: { taskId: string; versionId: string; gameDir: string }
      ) => callback(data)
      ipcRenderer.on('version:download-complete', listener)
      return () => ipcRenderer.removeListener('version:download-complete', listener)
    },
    /** 监听版本下载失败 */
    onDownloadError: (
      callback: (data: { taskId: string; versionId: string; error: string }) => void
    ) => {
      const listener = (
        _event: IpcRendererEvent,
        data: { taskId: string; versionId: string; error: string }
      ) => callback(data)
      ipcRenderer.on('version:download-error', listener)
      return () => ipcRenderer.removeListener('version:download-error', listener)
    }
  },

  // ModLoader
  modloader: {
    getLoaders: (mcVersion: string) =>
      ipcRenderer.invoke('modloader:get-loaders', { minecraftVersion: mcVersion }),
    getVersions: (mcVersion: string, loaderType: string) =>
      ipcRenderer.invoke('modloader:get-versions', { minecraftVersion: mcVersion, loaderType }),
    install: (instanceId: string, loaderType: string, loaderVersion: string, gameDir: string) =>
      ipcRenderer.invoke('modloader:install', {
        instanceId,
        loaderType,
        loaderVersion,
        gameDir
      }),
    onProgress: (
      callback: (data: {
        instanceId: string
        stage: string
        progress: number
        message: string
      }) => void
    ) => {
      const listener = (
        _event: IpcRendererEvent,
        data: {
          instanceId: string
          stage: string
          progress: number
          message: string
        }
      ) => callback(data)
      ipcRenderer.on('modloader:progress', listener)
      return () => ipcRenderer.removeListener('modloader:progress', listener)
    }
  },

  // 游戏启动
  game: {
    launch: (instanceId: string, accountId: string, versionId?: string) =>
      ipcRenderer.invoke('game:launch', { instanceId, accountId, versionId }),
    getLog: (instanceId: string) => ipcRenderer.invoke('game:get-log', { instanceId }),
    terminate: () => ipcRenderer.invoke('game:terminate'),
    isRunning: () => ipcRenderer.invoke('game:is-running'),
    onProgress: (
      callback: (progress: { phase: string; message: string; detail?: string }) => void
    ) => {
      const listener = (
        _event: IpcRendererEvent,
        progress: { phase: string; message: string; detail?: string }
      ) => callback(progress)
      ipcRenderer.on('game:progress', listener)
      return () => ipcRenderer.removeListener('game:progress', listener)
    },
    onLog: (callback: (log: string) => void) => {
      const listener = (_event: IpcRendererEvent, log: string) => callback(log)
      ipcRenderer.on('game:log', listener)
      return () => ipcRenderer.removeListener('game:log', listener)
    },
    onExit: (callback: (data: { code: number; signal: string | null; instanceId?: string }) => void) => {
      const listener = (_event: IpcRendererEvent, data: { code: number; signal: string | null; instanceId?: string }) => callback(data)
      ipcRenderer.on('game:exit', listener)
      return () => ipcRenderer.removeListener('game:exit', listener)
    },
    /** 检测缺失文件 */
    checkMissingFiles: (versionId: string): Promise<MissingFileInfo[]> =>
      ipcRenderer.invoke('game:check-missing-files', { versionId }),
    /** 确认下载缺失文件并继续启动 */
    confirmDownloadAndLaunch: (versionId: string, accountId?: string) =>
      ipcRenderer.invoke('game:confirm-download-and-launch', { versionId, accountId })
  },

  // 文件对话框
  dialog: {
    selectFolder: (options?: { title?: string }) =>
      ipcRenderer.invoke('dialog:select-folder', options ?? {}),
    selectFile: (options?: {
      title?: string
      filters?: Array<{ name: string; extensions: string[] }>
    }) => ipcRenderer.invoke('dialog:select-file', options ?? {}),
    readAsDataURL: (filePath: string) =>
      ipcRenderer.invoke('file:read-as-data-url', filePath) as Promise<string | null>
  },

  // Shell 操作
  shell: {
    openPath: (absPath: string) => ipcRenderer.invoke('shell:open-path', absPath),
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url)
  },

  // 路径工具
  path: {
    getMinecraft: () => ipcRenderer.invoke('path:minecraft'),
    getDefault: () => ipcRenderer.invoke('path:get-default'),
    getAppPath: () => ipcRenderer.invoke('path:app-path'),
    exists: (p: string) => ipcRenderer.invoke('path:exists', p),
    /** 获取自定义 .minecraft 路径（null=未设置） */
    getCustom: () => ipcRenderer.invoke('path:custom:get') as Promise<string | null>,
    /** 设置自定义 .minecraft 路径 */
    setCustom: (path: string) => ipcRenderer.invoke('path:custom:set', path),
    /** 清除自定义路径，恢复默认 */
    clearCustom: () => ipcRenderer.invoke('path:custom:clear'),
    /** 创建目录 */
    createDir: (path: string) => ipcRenderer.invoke('path:create-dir', path)
  },

  // 版本选择器文件夹列表
  folders: {
    /** 获取已保存的文件夹列表 */
    list: () => ipcRenderer.invoke('folders:list') as Promise<string[]>,
    /** 保存完整文件夹列表 */
    save: (paths: string[]) => ipcRenderer.invoke('folders:save', paths),
    /** 添加一个文件夹 */
    add: (path: string) => ipcRenderer.invoke('folders:add', path) as Promise<string[]>,
    /** 移除一个文件夹 */
    remove: (path: string) => ipcRenderer.invoke('folders:remove', path) as Promise<string[]>,
    /** 获取上次选中的文件夹 */
    getLast: () => ipcRenderer.invoke('folders:last:get') as Promise<string | null>,
    /** 保存上次选中的文件夹 */
    setLast: (path: string) => ipcRenderer.invoke('folders:last:set', path)
  },

  // 崩溃分析
  crash: {
    parse: (logPath: string, instanceId: string) =>
      ipcRenderer.invoke('crash:parse', { logPath, instanceId }),
    diagnose: (logPath: string, instanceId: string) =>
      ipcRenderer.invoke('crash:diagnose', { logPath, instanceId }),
    list: (gameDir: string) => ipcRenderer.invoke('crash:list', { gameDir }),
    latest: (gameDir: string) => ipcRenderer.invoke('crash:latest', { gameDir }),
    onCrash: (callback: (data: { reason: string; crashReportPath?: string }) => void) => {
      const listener = (
        _event: IpcRendererEvent,
        data: { reason: string; crashReportPath?: string }
      ) => callback(data)
      ipcRenderer.on('crash:detected', listener)
      return () => ipcRenderer.removeListener('crash:detected', listener)
    }
  },

  // 通知系统
  notification: {
    send: (payload: {
      title: string
      body?: string
      type?: 'info' | 'success' | 'warning' | 'error'
      route?: string
    }) => ipcRenderer.invoke('notification:send', payload),
    getHistory: (limit?: number) => ipcRenderer.invoke('notification:get-history', limit),
    markRead: (id: string) => ipcRenderer.invoke('notification:mark-read', id),
    markAllRead: () => ipcRenderer.invoke('notification:mark-all-read'),
    clear: () => ipcRenderer.invoke('notification:clear'),
    getUnreadCount: () => ipcRenderer.invoke('notification:get-unread-count') as Promise<number>,
    onNotify: (
      callback: (item: {
        id: string
        title: string
        body: string
        type: string
        timestamp: number
        route?: string
      }) => void
    ) => {
      const listener = (
        _event: IpcRendererEvent,
        item: {
          id: string
          title: string
          body: string
          type: string
          timestamp: number
          route?: string
        }
      ) => callback(item)
      ipcRenderer.on('notification:new', listener)
      return () => ipcRenderer.removeListener('notification:new', listener)
    },
    onClicked: (callback: (data: { id: string; route?: string }) => void) => {
      const listener = (_event: IpcRendererEvent, data: { id: string; route?: string }) =>
        callback(data)
      ipcRenderer.on('notification:clicked', listener)
      return () => ipcRenderer.removeListener('notification:clicked', listener)
    }
  },

  // Mod 管理
  mod: {
    list: (gameDir: string) => ipcRenderer.invoke('mod:list', { gameDir }),
    install: (sourcePath: string, gameDir: string) =>
      ipcRenderer.invoke('mod:install', { sourcePath, gameDir }),
    uninstall: (modPath: string) => ipcRenderer.invoke('mod:uninstall', { modPath }),
    enable: (modPath: string) => ipcRenderer.invoke('mod:enable', { modPath }),
    disable: (modPath: string) => ipcRenderer.invoke('mod:disable', { modPath }),
    installBatch: (sourcePaths: string[], gameDir: string) =>
      ipcRenderer.invoke('mod:install-batch', { sourcePaths, gameDir }),
    checkCompat: (mods: LocalMod[], targetVersion: string, loader?: string) =>
      ipcRenderer.invoke('mod:check-compat', { mods, targetVersion, loader }),
    ensureDir: (gameDir: string) => ipcRenderer.invoke('mod:ensure-dir', { gameDir }),
    // Config 文件读写
    listConfigs: (gameDir: string) => ipcRenderer.invoke('mod:read-config', { gameDir }),
    getConfigContent: (filePath: string) =>
      ipcRenderer.invoke('mod:get-config-content', { filePath }),
    saveConfigContent: (filePath: string, content: string) =>
      ipcRenderer.invoke('mod:save-config-content', { filePath, content }),
    openConfigDir: (gameDir: string) => ipcRenderer.invoke('mod:open-config-dir', { gameDir }),
    // 更新检测
    checkUpdate: (mods: LocalMod[], mcVersion?: string, loader?: string) =>
      ipcRenderer.invoke('mod:check-update', { mods, mcVersion, loader }),
    update: (mod: LocalMod, updateInfo: ModUpdateInfo) =>
      ipcRenderer.invoke('mod:update', { mod, updateInfo }),
    onUpdateProgress: (callback: (data: { filePath: string; progress: number }) => void) => {
      const listener = (_event: IpcRendererEvent, data: { filePath: string; progress: number }) =>
        callback(data)
      ipcRenderer.on('mod:update-progress', listener)
      return () => ipcRenderer.removeListener('mod:update-progress', listener)
    },
    // 依赖管理
    checkDependencies: (mods: LocalMod[], mcVersion?: string, loader?: string) =>
      ipcRenderer.invoke('mod:check-dependencies', { mods, mcVersion, loader }),
    installDependencies: (mod: LocalMod, gameDir: string, mcVersion?: string, loader?: string) =>
      ipcRenderer.invoke('mod:install-dependencies', { mod, gameDir, mcVersion, loader }),
    onDependencyProgress: (
      callback: (data: { modPath: string; depName: string; progress: number }) => void
    ) => {
      const listener = (
        _event: IpcRendererEvent,
        data: { modPath: string; depName: string; progress: number }
      ) => callback(data)
      ipcRenderer.on('mod:dependency-progress', listener)
      return () => ipcRenderer.removeListener('mod:dependency-progress', listener)
    },
    exportMods: (filePaths: string[]) => ipcRenderer.invoke('mod:export', { filePaths })
  },

  // 自动更新
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    getStatus: () => ipcRenderer.invoke('updater:status'),
    getConfig: () => ipcRenderer.invoke('updater:get-config'),
    setChannel: (channel: string) => ipcRenderer.invoke('updater:set-channel', channel),
    setAutoCheck: (enabled: boolean) => ipcRenderer.invoke('updater:set-auto-check', enabled),
    onStatusChange: (
      callback: (status: UpdaterStatus) => void
    ) => {
      const listener = (
        _event: IpcRendererEvent,
        status: UpdaterStatus
      ) => callback(status)
      ipcRenderer.on('updater:status', listener)
      return () => ipcRenderer.removeListener('updater:status', listener)
    }
  },

  // 整合包（mrpack）
  modpack: {
    pack: (payload: { instancePath: string; outputPath?: string; options: ModpackOptions }) =>
      ipcRenderer.invoke('modpack:pack', payload),
    import: (payload: { mrpackPath: string; targetParentDir: string; instanceName: string }) =>
      ipcRenderer.invoke('modpack:import', payload),
    getDefaultOutputDir: () => ipcRenderer.invoke('modpack:get-default-output-dir'),
    onProgress: (
      callback: (progress: { stage: string; progress: number; currentFile: string }) => void
    ) => {
      const listener = (
        _event: IpcRendererEvent,
        data: { stage: string; progress: number; currentFile: string }
      ) => callback(data)
      ipcRenderer.on('modpack:progress', listener)
      return () => ipcRenderer.removeListener('modpack:progress', listener)
    }
  },

  // 全局快捷键
  hotkey: {
    list: () => ipcRenderer.invoke('hotkey:list'),
    update: (hotkey: HotkeyConfig) => ipcRenderer.invoke('hotkey:update', { hotkey }),
    toggle: (id: string, enabled: boolean) => ipcRenderer.invoke('hotkey:toggle', { id, enabled }),
    validate: (accelerator: string) => ipcRenderer.invoke('hotkey:validate', { accelerator }),
    reload: () => ipcRenderer.invoke('hotkey:reload'),
    onTrigger: (callback: (data: { action: string }) => void) => {
      const listener = (_event: IpcRendererEvent, data: { action: string }) => callback(data)
      ipcRenderer.on('hotkey:trigger', listener)
      return () => ipcRenderer.removeListener('hotkey:trigger', listener)
    }
  },

  // 主题与背景
  theme: {
    load: () => ipcRenderer.invoke('theme:load'),
    save: (settings: ThemeSettings) => ipcRenderer.invoke('theme:save', { settings }),
    importBackground: (sourcePath: string) =>
      ipcRenderer.invoke('theme:import-background', { sourcePath }),
    deleteBackground: (localPath: string) =>
      ipcRenderer.invoke('theme:delete-background', { localPath }),
    computeVars: (hex: string) => ipcRenderer.invoke('theme:compute-vars', { hex }),
    exportTheme: (settings: ThemeSettings) => ipcRenderer.invoke('theme:export', { settings }),
    importTheme: (json: string) => ipcRenderer.invoke('theme:import', { json }),
    getPresets: () => ipcRenderer.invoke('theme:presets')
  },

  // 数据备份与迁移
  backup: {
    create: (options?: BackupOptions) => ipcRenderer.invoke('backup:create', { options }),
    restore: (backupPath: string) => ipcRenderer.invoke('backup:restore', { backupPath }),
    list: () => ipcRenderer.invoke('backup:list'),
    delete: (fileName: string) => ipcRenderer.invoke('backup:delete', fileName),
    getDir: () => ipcRenderer.invoke('backup:get-dir'),
    onProgress: (
      callback: (progress: { stage: string; progress: number; currentItem: string }) => void
    ) => {
      const listener = (
        _event: IpcRendererEvent,
        data: { stage: string; progress: number; currentItem: string }
      ) => callback(data)
      ipcRenderer.on('backup:progress', listener)
      return () => ipcRenderer.removeListener('backup:progress', listener)
    }
  },

  // 外部启动器数据导入（HMCL/PCL2）
  externalLauncher: {
    detect: () => ipcRenderer.invoke('external-launcher:detect'),
    scanDir: (gameDir: string) => ipcRenderer.invoke('external-launcher:scan-dir', gameDir)
  },

  // 游戏截图
  screenshot: {
    list: (gameDir: string) => ipcRenderer.invoke('screenshot:list', gameDir),
    listAll: (gameDir: string) => ipcRenderer.invoke('screenshot:list-all', gameDir),
    preview: (filePath: string) => ipcRenderer.invoke('screenshot:preview', filePath),
    thumbnail: (filePath: string) => ipcRenderer.invoke('screenshot:thumbnail', filePath),
    delete: (filePath: string) => ipcRenderer.invoke('screenshot:delete', filePath),
    rename: (filePath: string, newName: string) =>
      ipcRenderer.invoke('screenshot:rename', { filePath, newName }),
    export: (filePath: string) => ipcRenderer.invoke('screenshot:export', filePath),
    copy: (filePath: string) => ipcRenderer.invoke('screenshot:copy', filePath),
    open: (filePath: string) => ipcRenderer.invoke('screenshot:open', filePath)
  },

  // 性能监控
  perfMonitor: {
    start: (pid: number) => ipcRenderer.invoke('perf-monitor:start', pid),
    stop: () => ipcRenderer.invoke('perf-monitor:stop'),
    status: () => ipcRenderer.invoke('perf-monitor:status'),
    onSnapshot: (callback: (snap: { pid: number; alive: boolean; cpu: number; memoryMB: number; uptimeMs: number; timestamp: number }) => void) => {
      const handler = (_event: unknown, snap: unknown) => callback(snap as { pid: number; alive: boolean; cpu: number; memoryMB: number; uptimeMs: number; timestamp: number })
      ipcRenderer.on('perf-monitor:snapshot', handler)
      return () => ipcRenderer.removeListener('perf-monitor:snapshot', handler)
    }
  },

  // 分享功能（P2P 实例分享）
  share: (() => {
    const packListeners = new Map<Function, Function>()
    const sessionListeners = new Map<Function, Function>()
    const progressListeners = new Map<Function, Function>()

    return {
      startInstance: (instanceId: string) =>
        ipcRenderer.invoke('share:start-instance', { instanceId }),
      stopShare: (sessionId: string) =>
        ipcRenderer.invoke('share:stop-share', { sessionId }),
      receiveInstance: (shareCode: string) =>
        ipcRenderer.invoke('share:receive-instance', { shareCode }),
      importReceived: (sessionId: string) =>
        ipcRenderer.invoke('share:import-received', { sessionId }),
      closeSession: (sessionId: string) =>
        ipcRenderer.invoke('share:close-session', { sessionId }),
      getSession: (sessionId: string) =>
        ipcRenderer.invoke('share:get-session', { sessionId }),
      saveSettings: (settings: { chunkSize?: number; connectionTimeout?: number; signalingServer?: string }) =>
        ipcRenderer.invoke('share:save-settings', settings),
      getSettings: () => ipcRenderer.invoke('share:get-settings'),
      getHistory: (options?: { limit?: number }) =>
        ipcRenderer.invoke('share:get-history', options || {}),
      onProtocolInvoke: (callback: (shareCode: string) => void) => {
        const listener = (_event: IpcRendererEvent, data: { shareCode: string }) =>
          callback(data.shareCode)
        ipcRenderer.on('share:protocol-invoke', listener)
        return () => ipcRenderer.removeListener('share:protocol-invoke', listener)
      },
      onPackProgress: (
        callback: (event: IpcRendererEvent, data: { instanceId: string; stage: string; progress: number }) => void
      ) => {
        const listener = (
          _event: IpcRendererEvent,
          data: { instanceId: string; stage: string; progress: number }
        ) => callback(_event, data)
        packListeners.set(callback, listener)
        ipcRenderer.on('share:pack-progress', listener)
        return () => ipcRenderer.removeListener('share:pack-progress', listener)
      },
      onSessionUpdate: (
        callback: (event: IpcRendererEvent, data: { sessionId: string; session: { sessionId: string; shareCode?: string; type?: string; status: string; transferredChunks: number; totalChunks: number; error?: string; instanceName?: string; mcVersion?: string; loaderType?: string } }) => void
      ) => {
        const listener = (
          _event: IpcRendererEvent,
          data: { sessionId: string; session: { sessionId: string; shareCode?: string; type?: string; status: string; transferredChunks: number; totalChunks: number; error?: string; instanceName?: string; mcVersion?: string; loaderType?: string } }
        ) => callback(_event, data)
        sessionListeners.set(callback, listener)
        ipcRenderer.on('share:session-update', listener)
        return () => ipcRenderer.removeListener('share:session-update', listener)
      },
      onProgressUpdate: (
        callback: (
          event: IpcRendererEvent,
          data: {
            sessionId: string
            progress: {
              transferredChunks: number
              totalChunks: number
              bytesPerSecond: number
              estimatedRemaining: number
            }
          }
        ) => void
      ) => {
        const listener = (
          _event: IpcRendererEvent,
          data: {
            sessionId: string
            progress: {
              transferredChunks: number
              totalChunks: number
              bytesPerSecond: number
              estimatedRemaining: number
            }
          }
        ) => callback(_event, data)
        progressListeners.set(callback, listener)
        ipcRenderer.on('share:progress-update', listener)
        return () => ipcRenderer.removeListener('share:progress-update', listener)
      },
      removePackProgressListener: (
        callback: (event: IpcRendererEvent, data: { instanceId: string; stage: string; progress: number }) => void
      ) => {
        const listener = packListeners.get(callback)
        if (listener) {
          ipcRenderer.removeListener('share:pack-progress', listener as (...args: unknown[]) => void)
          packListeners.delete(callback)
        }
      },
      removeSessionUpdateListener: (
        callback: (
          event: IpcRendererEvent,
          data: { sessionId: string; session: { sessionId: string; status: string; transferredChunks: number; totalChunks: number; error?: string } }
        ) => void
      ) => {
        const listener = sessionListeners.get(callback)
        if (listener) {
          ipcRenderer.removeListener('share:session-update', listener as (...args: unknown[]) => void)
          sessionListeners.delete(callback)
        }
      },
      removeProgressUpdateListener: (
        callback: (
          event: Event,
          data: { sessionId: string; progress: { transferredChunks: number; totalChunks: number; bytesPerSecond: number; estimatedRemaining: number } }
        ) => void
      ) => {
        const listener = progressListeners.get(callback)
        if (listener) {
          ipcRenderer.removeListener('share:progress-update', listener as (...args: unknown[]) => void)
          progressListeners.delete(callback)
        }
      }
    }
  })(),

  // 日志系统（诊断导出 + 日志级别控制）
  logger: {
    setLevel: (level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR') =>
      ipcRenderer.invoke('logger:set-level', level),
    exportDiagnostics: () => ipcRenderer.invoke('logger:export-diagnostics')
  },

  // 开发者工具
  devTools: {
    open: () => ipcRenderer.invoke('devtools:open')
  }
}

export type MclaAPI = typeof api

contextBridge.exposeInMainWorld('electronAPI', api)
