/**
 * Instances Store - 游戏实例管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameInstance, CreateInstanceParams, LoaderType } from '../types/instance'
import { $t } from '../utils/i18n'

export const useInstancesStore = defineStore('instances', () => {
  // * ====== 状态 ======
  const instances = ref<GameInstance[]>([])
  const currentInstanceId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // * ====== 计算属性 ======

  /** 当前选中的实例 */
  const currentInstance = computed(
    () => instances.value.find((i) => i.id === currentInstanceId.value) ?? null
  )

  /** 最近游玩的实例（按 lastPlayed 排序） */
  const recentInstances = computed(() =>
    [...instances.value]
      .filter((i) => i.lastPlayed)
      .sort((a, b) => new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime())
      .slice(0, 5)
  )

  /** 收藏的实例 */
  const favoritedInstances = computed(() => instances.value.filter((i) => i.isFavorited === 1))

  // * ====== 操作 ======

  /** 从主进程加载实例列表 */
  async function fetchInstances() {
    loading.value = true
    error.value = null
    try {
      const rawList = await window.electronAPI?.instance.list()
      // * 映射 snake_case -> camelCase
      instances.value = ((rawList as unknown[]) || []).map(
        (raw) => mapRawToInstance(raw as unknown as Record<string, unknown>)
      )
    } catch (e: unknown) {
      error.value = (e as Error).message || $t('instance.loadFailed')
    } finally {
      loading.value = false
    }
  }

  /** 创建新实例 */
  async function createInstance(params: CreateInstanceParams) {
    const result = await window.electronAPI?.instance.create(
      params as unknown as Record<string, unknown>
    )
    if (result) {
      instances.value.unshift(
        mapRawToInstance(result as unknown as Record<string, unknown>)
      )
      return result
    }
    return null
  }

  /** 更新实例 */
  async function updateInstance(id: string, data: Partial<GameInstance>) {
    await window.electronAPI?.instance.update(id, data as Record<string, unknown>)
    await fetchInstances() // * 刷新列表
  }

  /** 删除实例 */
  async function deleteInstance(id: string) {
    await window.electronAPI?.instance.delete(id)
    instances.value = instances.value.filter((i) => i.id !== id)
    if (currentInstanceId.value === id) {
      currentInstanceId.value = null
    }
  }

  /** 选择实例 */
  function selectInstance(id: string | null) {
    currentInstanceId.value = id
  }

  /** 切换收藏状态 */
  async function toggleFavorite(id: string) {
    const inst = instances.value.find((i) => i.id === id)
    if (inst) {
      await updateInstance(id, { isFavorited: inst.isFavorited ? 0 : 1 })
    }
  }

  return {
    instances,
    currentInstanceId,
    loading,
    error,
    currentInstance,
    recentInstances,
    favoritedInstances,
    fetchInstances,
    createInstance,
    updateInstance,
    deleteInstance,
    selectInstance,
    toggleFavorite
  }
})

// * ====== 工具函数 ======

/** 主进程返回的 snake_case 数据转前端 camelCase */
function mapRawToInstance(raw: Record<string, unknown>): GameInstance {
  const d = raw as unknown as Record<string, unknown>
  return {
    id: d.id as string,
    name: d.name as string,
    path: d.path as string,
    mcVersion: d.mc_version as string,
    loaderType: (d.loader_type as LoaderType) || 'vanilla',
    loaderVersion: (d.loader_version as string) || '',
    icon: (d.icon as string) || '',
    javaPath: (d.java_path as string) || '',
    jvmArgs: (d.jvm_args as string) || '',
    minMemory: (d.min_memory as number) || 1024,
    maxMemory: (d.max_memory as number) || 4096,
    width: (d.width as number) || 854,
    height: (d.height as number) || 480,
    fullscreen: ((d.fullscreen as number) || 0) as 0 | 1,
    isFavorited: ((d.is_favorited as number) || 0) as 0 | 1,
    lastPlayed: (d.last_played as string) || (null as string | null),
    playTime: (d.play_time as number) || 0,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string
  }
}
