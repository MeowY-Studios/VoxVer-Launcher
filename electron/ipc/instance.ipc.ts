/**
 * 实例管理 IPC（接入增强服务）
 */
import { ipcMain } from 'electron'
import * as instanceService from '../services/instances'
import type { Instance } from '../services/instances'
import * as enhanced from '../services/instance.enhanced.service'
import type { ModService } from '../services/mod.service'

export function registerInstanceHandlers(modService?: ModService): void {
  // ===== 基础 CRUD =====
  ipcMain.handle('instance:list', () => instanceService.listInstances())
  ipcMain.handle('instance:get-by-id', (_event, id: string) => instanceService.getInstanceById(id))
  ipcMain.handle('instance:update', (_event, id: string, data: unknown) =>
    instanceService.updateInstance(id, data as Partial<Instance>)
  )

  // ===== 单字段快捷更新 =====
  ipcMain.handle('instance:update-name', (_event, id: string, name: string) =>
    instanceService.updateInstance(id, { name })
  )
  ipcMain.handle('instance:update-description', (_event, id: string, description: string) =>
    instanceService.updateInstance(id, { description })
  )
  ipcMain.handle('instance:toggle-favorite', (_event, id: string) => {
    const inst = instanceService.getInstanceById(id)
    if (!inst) return null
    return instanceService.updateInstance(id, { is_favorited: inst.is_favorited === 1 ? 0 : 1 })
  })

  // ===== 创建（带目录初始化） =====
  ipcMain.handle('instance:create', (_event, input) => enhanced.createInstanceWithDir(input))

  // ===== 删除（可选删文件） =====
  ipcMain.handle('instance:delete', (_event, id: string, deleteFiles = false) =>
    enhanced.deleteInstanceWithDir(id, deleteFiles)
  )

  // ===== 文件系统操作 =====
  ipcMain.handle('instance:open-folder', (_event, id: string) => enhanced.openInstanceFolder(id))

  ipcMain.handle('instance:open-mods-folder', (_event, id: string) => enhanced.openModsFolder(id))

  // ===== Mod 文件管理 =====
  ipcMain.handle('instance:list-mods', (_event, id: string) => enhanced.listModFiles(id))

  ipcMain.handle('instance:toggle-mod', (_event, id: string, filename: string, enabled: boolean) =>
    enhanced.toggleMod(id, filename, enabled)
  )

  ipcMain.handle('instance:delete-mod', (_event, id: string, filename: string) =>
    enhanced.deleteMod(id, filename)
  )

  // ===== 统计 =====
  ipcMain.handle('instance:disk-usage', (_event, id: string) => enhanced.getInstanceDiskUsage(id))

  // ===== 资源包 =====
  ipcMain.handle('instance:list-resourcepacks', (_e, id: string) => enhanced.listResourcePacks(id))
  ipcMain.handle('instance:toggle-resourcepack', (_e, id: string, f: string, enabled: boolean) =>
    enhanced.toggleResourcePack(id, f, enabled)
  )
  ipcMain.handle('instance:delete-resourcepack', (_e, id: string, f: string) =>
    enhanced.deleteResourcePack(id, f)
  )
  // ===== 光影包 =====
  ipcMain.handle('instance:list-shaderpacks', (_e, id: string) => enhanced.listShaderPacks(id))
  ipcMain.handle('instance:toggle-shaderpack', (_e, id: string, f: string, enabled: boolean) =>
    enhanced.toggleShaderPack(id, f, enabled)
  )
  ipcMain.handle('instance:delete-shaderpack', (_e, id: string, f: string) =>
    enhanced.deleteShaderPack(id, f)
  )
  // ===== 存档 =====
  ipcMain.handle('instance:list-saves', (_e, id: string) => enhanced.listSaves(id))
  ipcMain.handle('instance:delete-save', (_e, id: string, name: string) => enhanced.deleteSave(id, name))
  ipcMain.handle('instance:rename-save', (_e, id: string, oldN: string, newN: string) =>
    enhanced.renameSave(id, oldN, newN)
  )
  ipcMain.handle('instance:backup-save', (_e, id: string, name: string) => enhanced.backupSave(id, name))

  // ===== 导入导出 =====
  ipcMain.handle('instance:scan-minecraft', async (_event, dirPath: string) => {
    try {
      const result = await import('../services/instance.export').then((m) =>
        m.scanMinecraftDir(dirPath)
      )
      return { ok: true, data: result }
    } catch (e: unknown) {
      return { ok: false, error: (e as Error).message }
    }
  })

  ipcMain.handle(
    'instance:export',
    async (
      _event,
      instanceId: string,
      destPath: string,
      options?: {
      includeMods?: boolean
      includeDisabledMods?: boolean
      includeConfigs?: boolean
      includeResourcePacks?: boolean
      includeShaderPacks?: boolean
      includeSaves?: boolean
    }
    ) => {
      try {
        const { exportInstance } = await import('../services/instance.export')
        const result = await exportInstance(instanceId, destPath, options)
        return result
      } catch (e: unknown) {
        return { ok: false, error: (e as Error).message }
      }
    }
  )

  ipcMain.handle('instance:import', async (_event, mclaFilePath: string, targetDir: string) => {
    try {
      const { importInstance } = await import('../services/instance.export')
      const result = await importInstance(mclaFilePath, targetDir)
      return result
    } catch (e: unknown) {
      return { ok: false, error: (e as Error).message }
    }
  })

  ipcMain.handle('instance:export-preview', async (_event, gameDir: string) => {
    try {
      const { getExportPreview } = await import('../services/instance.export')
      const result = await getExportPreview(gameDir, modService)
      return { ok: true, data: result }
    } catch (e: unknown) {
      return { ok: false, error: (e as Error).message }
    }
  })
}
