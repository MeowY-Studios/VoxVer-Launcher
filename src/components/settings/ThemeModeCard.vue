<script setup lang="ts">
/**
 * 主题模式预览卡（复刻 Koring 的 ThemePreviewCard）：
 * 140 × 96 的窗口示意，浅色 / 跟随系统 / 深色 / Koring 四种，选中态为主色描边 + 微光环。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type ThemeMode = 'light' | 'auto' | 'dark' | 'koring'

const props = defineProps<{ mode: ThemeMode; selected: boolean }>()
const emit = defineEmits<{ select: [] }>()

const { t } = useI18n()

const label = computed(() => {
  if (props.mode === 'auto') return t('settings.themeAuto')
  if (props.mode === 'dark') return t('settings.themeDark')
  if (props.mode === 'koring') return t('settings.themeKoring')
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
      <!-- * Koring：深色玻璃卡 + 品牌色块，示意新排版 -->
      <template v-else-if="mode === 'koring'">
        <div class="kor-theme-titlebar">
          <span class="kor-theme-dot" style="background: #f87171" />
          <span class="kor-theme-dot" style="background: #fbbf24" />
          <span class="kor-theme-dot" style="background: #4ade80" />
        </div>
        <div class="kor-theme-body kor-theme-body--koring">
          <div class="kor-theme-glass">
            <div class="kor-theme-glass-line" />
            <div class="kor-theme-glass-line is-short" />
          </div>
          <div class="kor-theme-glass">
            <div class="kor-theme-glass-line is-short" />
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
