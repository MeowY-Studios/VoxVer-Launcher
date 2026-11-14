<template>
  <!-- 版本设置：内嵌展示当前选中版本的设置内容，不带启动器侧边栏 -->
  <VersionSettings
    inline
    :visible="true"
    :version-name="versionName"
    :game-dir="gameDir"
    :instance-id="instanceId"
    @back="router.push('/')"
  />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import VersionSettings from '../components/VersionSettings.vue'
import { useInstancesStore } from '../stores/instances.store'
import { useVersionsStore } from '../stores/versions.store'

const router = useRouter()
const { t } = useI18n()
const versionsStore = useVersionsStore()
const instancesStore = useInstancesStore()

/** 当前选中的版本（首页 / 实例页选择后写入 store） */
const versionName = computed(() => versionsStore.currentVersionId || t('game.selectVersion'))

/** 版本目录：优先完整路径，其次按实例记录匹配 */
const gameDir = computed(() => {
  const id = versionsStore.currentVersionId
  if (!id) return ''
  if (id.includes('\\') || id.includes('/')) return id
  return instancesStore.instances.find((i) => i.id === id || i.path?.includes(id))?.path || ''
})

const instanceId = computed(
  () => instancesStore.instances.find((i) => i.path === gameDir.value)?.id || ''
)

onMounted(() => {
  // 未选择版本时没有可设置的对象，直接回主页
  if (!versionsStore.currentVersionId) {
    void router.replace('/')
    return
  }
  void instancesStore.fetchInstances()
})
</script>
