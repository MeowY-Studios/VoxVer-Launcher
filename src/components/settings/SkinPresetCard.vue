<script setup lang="ts">
/**
 * 主题预设卡（排版预置）：VoxVer 原版排版 / Koring 排版。
 * 与「显示模式」相互独立：显示模式只切明暗，这里决定界面结构与排版。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type ThemeSkin = 'voxver' | 'koring'

const props = defineProps<{ skin: ThemeSkin; selected: boolean }>()
const emit = defineEmits<{ select: [] }>()

const { t } = useI18n()

const label = computed(() => (props.skin === 'koring' ? t('settings.skinKoring') : t('settings.skinVoxver')))

const desc = computed(() =>
  props.skin === 'koring' ? t('settings.skinKoringDesc') : t('settings.skinVoxverDesc')
)
</script>

<template>
  <button
    type="button"
    class="kor-theme-card"
    :class="{ 'is-selected': selected }"
    :aria-pressed="selected"
    @click="emit('select')"
  >
    <div class="kor-theme-shot" :data-skin-shot="skin">
      <div class="kor-theme-titlebar">
        <span class="kor-theme-dot" style="background: #f87171" />
        <span class="kor-theme-dot" style="background: #fbbf24" />
        <span class="kor-theme-dot" style="background: #4ade80" />
      </div>
      <!-- VoxVer：经典左侧竖栏内联排版 -->
      <div v-if="skin === 'voxver'" class="kor-theme-body">
        <div class="kor-theme-bar" />
        <div class="kor-theme-bar is-short" style="width: 75%" />
        <div class="kor-theme-bar is-short" style="width: 50%" />
      </div>
      <!-- Koring：玻璃卡片堆叠排版 -->
      <div v-else class="kor-theme-body kor-theme-body--koring">
        <div class="kor-theme-glass">
          <div class="kor-theme-glass-line" />
          <div class="kor-theme-glass-line is-short" />
        </div>
        <div class="kor-theme-glass">
          <div class="kor-theme-glass-line is-short" />
        </div>
      </div>
    </div>
    <span class="kor-theme-label">{{ label }}</span>
    <span class="kor-theme-sub">{{ desc }}</span>
  </button>
</template>
