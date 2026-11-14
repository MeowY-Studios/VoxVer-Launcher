<script setup lang="ts">
/**
 * Kor 版本卡（移植自 Koring Launcher `VersionCard.tsx` 的设置页用法）。
 *
 * 组成：主色渐变卡 + 丝绸水波层（KorSilk）+ 版本标识 + 白环 logo + 两行名称
 *       + 版本号 + commit 哈希 + 更新入口。
 * 与 Koring 原版的差异：模式（正式/测试/开发）改为 label 传入，不接开发者预览覆盖。
 */
import { computed } from 'vue'
import KorSilk from '../silk/KorSilk.vue'

const props = withDefaults(
  defineProps<{
    label?: string
    name?: string
    subName?: string
    version?: string
    commit?: string
    buildId?: string
    updateState?: 'latest' | 'hasUpdate' | 'installed'
    clickable?: boolean
    actionText?: string
  }>(),
  {
    label: '正式版',
    name: 'VoxVer',
    subName: 'Launcher',
    version: '',
    commit: '',
    buildId: '',
    updateState: 'latest',
    clickable: true,
    actionText: '查看更新'
  }
)

const emit = defineEmits<{ update: [] }>()

const stateText = computed(() => {
  if (props.updateState === 'hasUpdate') return '发现新版本'
  if (props.updateState === 'installed') return '已安装最新版'
  return ''
})

const commitText = computed(() => {
  const parts: string[] = []
  if (props.commit) parts.push(`commit ${props.commit}`)
  if (props.buildId) parts.push(`#${props.buildId}`)
  return parts.join(' · ')
})

function onClick() {
  if (props.clickable) emit('update')
}
</script>

<template>
  <button
    type="button"
    class="kor-version-card"
    :class="{ 'is-clickable': clickable }"
    @click="onClick"
  >
    <KorSilk :speed="3" :scale="1.2" :rotation="0.3" :noise-intensity="1.2" />
    <span class="kor-version-card__shine" aria-hidden="true" />
    <span class="kor-version-card__content">
      <span class="kor-version-card__label">{{ label }}</span>
      <span class="kor-version-card__brand">
        <span class="kor-version-card__logo" aria-hidden="true" />
        <span class="kor-version-card__name">
          <span>{{ name }}</span>
          <span v-if="subName">{{ subName }}</span>
        </span>
      </span>
      <span v-if="version" class="kor-version-card__version">v{{ version }}</span>
      <span v-if="commitText" class="kor-version-card__meta">{{ commitText }}</span>
      <span v-if="stateText" class="kor-version-card__state">{{ stateText }}</span>
      <span v-if="clickable" class="kor-version-card__link">
        {{ actionText }}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          aria-hidden="true"
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </span>
    </span>
  </button>
</template>

<style scoped>
.kor-version-card {
  position: relative;
  display: block;
  width: 100%;
  min-height: 220px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--voxver-primary) 86%, #1b2b6b),
    color-mix(in oklab, var(--voxver-primary) 40%, #16308f)
  );
  color: #fff;
  font: inherit;
  text-align: center;
  cursor: default;
  transition:
    transform 220ms var(--voxver-ease-out-quart),
    box-shadow 220ms var(--voxver-ease-out-quart);
}

.kor-version-card.is-clickable {
  cursor: pointer;
}

.kor-version-card.is-clickable:hover {
  transform: scale(1.005);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
}

.kor-version-card.is-clickable:active {
  transform: scale(0.995);
}

.kor-version-card__shine {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 90% at 12% 0%, rgba(255, 255, 255, 0.28), transparent 60%);
  pointer-events: none;
}

.kor-version-card__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 22px 20px;
}

.kor-version-card__label {
  font-size: 11px;
  letter-spacing: 0.08em;
  opacity: 0.85;
}

.kor-version-card__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}

.kor-version-card__logo {
  width: 34px;
  height: 34px;
  border: 5px solid #fff;
  border-radius: 999px;
  opacity: 0.96;
}

.kor-version-card__name {
  display: flex;
  flex-direction: column;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.01em;
  text-align: left;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.28);
}

.kor-version-card__version {
  font-size: 13px;
  opacity: 0.9;
}

.kor-version-card__meta {
  font-family: var(--voxver-font-mono, ui-monospace, monospace);
  font-size: 11px;
  opacity: 0.85;
}

.kor-version-card__state {
  font-size: 11.5px;
  opacity: 0.85;
}

.kor-version-card__link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: 2px;
  font-size: 11.5px;
  opacity: 0.9;
  transition: opacity 160ms ease;
}

.kor-version-card.is-clickable:hover .kor-version-card__link {
  opacity: 1;
}
</style>
