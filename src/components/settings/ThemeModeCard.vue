<script setup lang="ts">
/**
 * 显示模式预览卡（复刻 Koring 的 ThemePreviewCard）：
 * 140 × 96 的窗口示意，浅色 / 跟随系统 / 深色三种。
 * 只表达界面明暗，不涉及内容排版（排版由「主题预设」决定）。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type ThemeMode = 'light' | 'auto' | 'dark'

const props = defineProps<{ mode: ThemeMode; selected: boolean }>()
const emit = defineEmits<{ select: [] }>()

const { t } = useI18n()

const label = computed(() => {
  if (props.mode === 'auto') return t('settings.themeAuto')
  if (props.mode === 'dark') return t('settings.themeDark')
  return t('settings.themeLight')
})
</script>

<template>
  <button
    type="button"
    class="kor-theme-card"
    :class="{ 'is-selected': selected }"
    :aria-pressed="selected"
    @click="emit('select')"
  >
    <div class="kor-theme-shot" :class="{ 'is-auto': mode === 'auto' }" :data-mode="mode">
      <template v-if="mode === 'auto'">
        <div class="kor-theme-shot-half" data-mode="light">
          <div class="kor-theme-titlebar">
            <span class="kor-theme-dot" style="background: #f87171" />
            <span class="kor-theme-dot" style="background: #fbbf24" />
            <span class="kor-theme-dot" style="background: #4ade80" />
          </div>
          <div class="kor-theme-body">
            <div class="kor-theme-bar" />
            <div class="kor-theme-bar is-short" style="width: 75%" />
          </div>
        </div>
        <div class="kor-theme-shot-half" data-mode="dark">
          <div class="kor-theme-titlebar">
            <span class="kor-theme-dot" style="background: #f87171" />
            <span class="kor-theme-dot" style="background: #fbbf24" />
            <span class="kor-theme-dot" style="background: #4ade80" />
          </div>
          <div class="kor-theme-body">
            <div class="kor-theme-bar" />
            <div class="kor-theme-bar is-short" style="width: 75%" />
          </div>
        </div>
      </template>
      <template v-else>
        <div class="kor-theme-titlebar">
          <span class="kor-theme-dot" style="background: #f87171" />
          <span class="kor-theme-dot" style="background: #fbbf24" />
          <span class="kor-theme-dot" style="background: #4ade80" />
        </div>
        <div class="kor-theme-body">
          <div class="kor-theme-bar" />
          <div class="kor-theme-bar is-short" style="width: 75%" />
          <div class="kor-theme-bar is-short" style="width: 50%" />
        </div>
      </template>
    </div>
    <span class="kor-theme-label">{{ label }}</span>
  </button>
</template>
