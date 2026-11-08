<template>
  <div style="padding:24px;color:#fff;font-size:20px">
    INSTANCES DEBUG OK — folders={{ folders.length }} instances={{ instancesStore.instances.length }}
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppStore, useInstancesStore } from '../stores'
import type { GameInstance, LoaderType } from '../types/instance'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()
const instancesStore = useInstancesStore()

const isKoring = computed(() => appStore.skin === 'koring')
const activeFolder = ref<string | null>(null)
const importing = ref(false)

/** 实例按游戏目录归组 */
const folders = computed(() => {
  const map = new Map<string, { key: string; name: string; path: string }>()
  for (const inst of instancesStore.instances) {
    const root = (inst.path || '').replace(/[\\/]+$/, '')
    if (!root || map.has(root)) continue
    const parts = root.split(/[\\/]/)
    map.set(root, { key: root, name: parts[parts.length - 1] || root, path: root })
  }
  return [...map.values()]
})

const visibleInstances = computed(() =>
  activeFolder.value
    ? instancesStore.instances.filter((i) => (i.path || '').replace(/[\\/]+$/, '') === activeFolder.value)
    : instancesStore.instances
)

function toggleFolder(key: string) {
  activeFolder.value = activeFolder.value === key ? null : key
}

function loaderLabel(loader: LoaderType): string {
  if (loader === 'vanilla') return t('instance.vanilla')
  if (loader === 'forge') return 'Forge'
  if (loader === 'fabric') return 'Fabric'
  if (loader === 'neoforge') return 'NeoForge'
  if (loader === 'quilt') return 'Quilt'
  return loader
}

function selectInstance(inst: GameInstance) {
  instancesStore.selectInstance(inst.id)
}

function openInstance(inst: GameInstance) {
  instancesStore.selectInstance(inst.id)
  router.push(`/instance/${inst.id}`)
}

/** 导入已有 .minecraft 文件夹：扫描后建实例 */
async function importFolder() {
  const dir = await window.electronAPI?.dialog.selectFolder({ title: t('instance.importFolder') })
  if (!dir) return
  importing.value = true
  try {
    const raw = await window.electronAPI?.instance.scanMinecraft(dir)
    const result = raw && (raw as { ok?: boolean }).ok ? (raw as { data?: unknown }).data : null
    const scan = (result || {}) as {
      valid?: boolean
      mcVersion?: string
      loaderType?: string
      loaderVersion?: string
    }
    const parts = dir.replace(/[\\/]+$/, '').split(/[\\/]/)
    await instancesStore.createInstance({
      name: parts[parts.length - 1] || 'minecraft',
      path: dir,
      mcVersion: scan.mcVersion || '1.20.1',
      loaderType: (scan.loaderType as LoaderType) || 'vanilla',
      loaderVersion: scan.loaderVersion || ''
    })
    await instancesStore.fetchInstances()
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  instancesStore.fetchInstances()
})
</script>

<style scoped>
.instances-page {
  position: relative;
  display: flex;
  gap: 20px;
  height: 100%;
  padding: 24px;
  overflow: hidden;
}

/* ===== Koring 背景 ===== */
.inst-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.instances-page.is-kor {
  background:
    radial-gradient(120% 90% at 78% 8%, rgba(255, 255, 255, 0.14), transparent 60%),
    linear-gradient(158deg, color-mix(in oklab, var(--voxver-primary) 82%, #0a1b3a) 0%, color-mix(in oklab, var(--voxver-primary) 46%, #061024) 62%, #050b16 100%);
}

.inst-ring {
  position: absolute;
  left: 50%;
  top: 54%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, transparent 56%, rgba(255, 255, 255, 0.28) 63%, rgba(255, 255, 255, 0.07) 100%);
  filter: blur(13px);
}

.inst-ring--outer {
  width: min(118vh, 118%);
  aspect-ratio: 1;
  opacity: 0.7;
}

.inst-ring--inner {
  width: min(66vh, 66%);
  aspect-ratio: 1;
  opacity: 0.5;
  filter: blur(20px);
}

/* ===== 左侧目录栏 ===== */
.inst-rail {
  position: relative;
  z-index: 2;
  flex: 0 0 236px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  overflow-y: auto;
}

.inst-rail__group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inst-rail__title {
  padding: 4px 10px 6px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--voxver-text-tertiary);
}

.instances-page.is-kor .inst-rail__title {
  color: rgba(255, 255, 255, 0.55);
}

.inst-folder,
.inst-action {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--voxver-text-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background 140ms ease;
}

.inst-folder:hover,
.inst-action:hover {
  background: var(--voxver-bg-tertiary);
}

.instances-page.is-kor .inst-folder,
.instances-page.is-kor .inst-action {
  color: #fff;
}

.instances-page.is-kor .inst-folder:hover,
.instances-page.is-kor .inst-action:hover {
  background: rgba(255, 255, 255, 0.1);
}

.inst-folder.is-active {
  background: color-mix(in oklab, var(--voxver-primary) 16%, transparent);
}

.instances-page.is-kor .inst-folder.is-active {
  background: rgba(255, 255, 255, 0.14);
}

.inst-folder__icon {
  flex: 0 0 auto;
  opacity: 0.8;
}

.inst-folder__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.inst-folder__name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inst-folder__path {
  font-size: 11px;
  color: var(--voxver-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.instances-page.is-kor .inst-folder__path {
  color: rgba(255, 255, 255, 0.5);
}

.inst-action:disabled {
  opacity: 0.6;
  cursor: default;
}

/* ===== 右侧列表 ===== */
.inst-main {
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  min-width: 0;
  overflow-y: auto;
}

.inst-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.inst-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--voxver-border-color);
  border-radius: 14px;
  background: var(--voxver-bg-secondary);
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
}

.inst-card:hover {
  background: var(--voxver-bg-tertiary);
}

.inst-card.is-active {
  border-color: color-mix(in oklab, var(--voxver-primary) 55%, transparent);
}

.instances-page.is-kor .inst-card {
  border-color: var(--kor-hairline, rgba(255, 255, 255, 0.09));
  background: rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(12px);
  color: #fff;
}

.instances-page.is-kor .inst-card:hover {
  background: rgba(0, 0, 0, 0.42);
}

.instances-page.is-kor .inst-card.is-active {
  border-color: rgba(255, 255, 255, 0.22);
  background: rgba(12, 26, 46, 0.6);
}

.inst-card__icon {
  display: inline-flex;
  flex: 0 0 auto;
}

.inst-card__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.inst-card__name {
  font-size: 14.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inst-card__meta {
  font-size: 12.5px;
  color: var(--voxver-text-secondary);
}

.instances-page.is-kor .inst-card__meta {
  color: rgba(255, 255, 255, 0.6);
}

.inst-card__check {
  flex: 0 0 auto;
  margin-left: auto;
  color: #4ade80;
}

.inst-state {
  padding: 40px 4px;
  font-size: 13px;
  color: var(--voxver-text-secondary);
}

.instances-page.is-kor .inst-state {
  color: rgba(255, 255, 255, 0.66);
}

.inst-state__title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.instances-page.is-kor .inst-state__title {
  color: #fff;
}

.inst-state__desc {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
}
</style>
