<template>
  <div
    class="instance-card vox-card"
    :class="{ selected: selected, 'is-favorite': instance.is_favorited === 1 }"
    @click="$emit('select', instance)"
    @dblclick="$emit('open', instance)"
  >
    <!-- 封面 -->
    <div class="card-cover" :style="{ background: coverGradient }">
      <div v-if="loaderLabel" class="cover-loader-tag">{{ loaderLabel }}</div>
      <div class="cover-version-tag">{{ instance.mc_version }}</div>
      <button
        v-if="showFavorite"
        class="favorite-btn"
        :class="{ active: instance.is_favorited === 1 }"
        @click.stop="$emit('toggle-favorite', instance)"
        :title="instance.is_favorited === 1 ? $t('instance.unfavorite') : $t('instance.favorite')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" :fill="instance.is_favorited === 1 ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>
    </div>

    <!-- 信息区 -->
    <div class="card-body">
      <h3 class="card-name" :title="instance.name">{{ instance.name }}</h3>
      <p class="card-meta">
        <span class="meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ lastPlayedText }}
        </span>
      </p>
    </div>

    <!-- 操作按钮 -->
    <div class="card-actions">
      <button class="action-btn launch" @click.stop="$emit('launch', instance)" :title="$t('instance.launch')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
      <button class="action-btn" @click.stop="$emit('open-folder', instance)" :title="$t('instance.openFolder')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      </button>
      <button class="action-btn" @click.stop="$emit('edit', instance)" :title="$t('instance.edit')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button class="action-btn danger" @click.stop="$emit('delete', instance)" :title="$t('instance.delete')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LoaderType } from '../types/instance'

interface InstanceCardProps {
  instance: {
    id: string
    name: string
    path: string
    mc_version: string
    loader_type: LoaderType
    loader_version: string
    icon: string
    java_path: string
    jvm_args: string
    min_memory: number
    max_memory: number
    width: number
    height: number
    fullscreen: number
    is_favorited: number
    last_played: string | null
    play_time: number
    created_at: string
    updated_at: string
  }
  selected?: boolean
  showFavorite?: boolean
}

const props = withDefaults(defineProps<InstanceCardProps>(), {
  selected: false,
  showFavorite: true
})

const emit = defineEmits<{
  (e: 'select', inst: InstanceCardProps['instance']): void
  (e: 'open', inst: InstanceCardProps['instance']): void
  (e: 'launch', inst: InstanceCardProps['instance']): void
  (e: 'open-folder', inst: InstanceCardProps['instance']): void
  (e: 'edit', inst: InstanceCardProps['instance']): void
  (e: 'delete', inst: InstanceCardProps['instance']): void
  (e: 'toggle-favorite', inst: InstanceCardProps['instance']): void
}>()

const { t } = useI18n()

const gradients = [
  'var(--voxver-primary)',
  'var(--voxver-success)',
  'var(--voxver-warning)',
  'var(--voxver-error)',
  '#0071e3',
  '#30b350',
  '#e08600',
  '#e0352b'
]

const coverGradient = computed(() => {
  let hash = 0
  for (let i = 0; i < props.instance.id.length; i++) {
    hash = (hash << 5) - hash + props.instance.id.charCodeAt(i)
    hash |= 0
  }
  return gradients[Math.abs(hash) % gradients.length]
})

const loaderLabel = computed(() => {
  const lt = props.instance.loader_type
  if (!lt || lt === 'vanilla') return ''
  const lv = props.instance.loader_version
  const cap = lt.charAt(0).toUpperCase() + lt.slice(1)
  return lv ? `${cap} ${lv}` : cap
})

const lastPlayedText = computed(() => {
  if (!props.instance.last_played) return t('instance.neverPlayed')
  const ts = new Date(props.instance.last_played).getTime()
  if (isNaN(ts)) return t('instance.unknown')
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return t('instance.minutesAgo', { n: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('instance.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days < 30) return t('instance.daysAgo', { n: days })
  return t('instance.monthsAgo', { n: Math.floor(days / 30) })
})
</script>

<style scoped lang="scss">
.instance-card {
  overflow: hidden;
  cursor: pointer;
  transition:
    transform var(--voxver-transition-fast),
    box-shadow var(--voxver-transition-fast);
  display: flex;
  flex-direction: column;
  height: 180px;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--voxver-shadow-md);
  }

  &.selected {
    outline: 2px solid var(--voxver-primary);
    outline-offset: -1px;
  }
}

/* 封面 */
.card-cover {
  height: 88px;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: oklch(0% 0 0 / 0.15);
  }
}

.cover-loader-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: var(--voxver-z-raised);
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--voxver-text-inverse);
  background: oklch(0% 0 0 / 0.4);
  backdrop-filter: blur(4px);
  border-radius: var(--voxver-radius-xs);
  letter-spacing: 0.3px;
}

.cover-version-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: var(--voxver-z-raised);
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--voxver-text-inverse);
  background: oklch(0% 0 0 / 0.45);
  backdrop-filter: blur(4px);
  border-radius: var(--voxver-radius-xs);
}

.favorite-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: var(--voxver-z-above);
  width: 26px;
  height: 26px;
  border: none;
  background: oklch(0% 0 0 / 0.35);
  backdrop-filter: blur(4px);
  color: var(--voxver-text-inverse);
  cursor: pointer;
  border-radius: var(--voxver-radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition:
    opacity var(--voxver-transition-fast),
    background var(--voxver-transition-fast),
    color var(--voxver-transition-fast);

  .instance-card:hover & {
    opacity: 1;
  }

  &:hover {
    background: oklch(0% 0 0 / 0.55);
  }

  &.active {
    opacity: 1;
    color: var(--voxver-warning);
  }
}

/* 信息区 */
.card-body {
  padding: 10px 14px 8px;
  flex: 1;

  .card-name {
    margin: 0;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--voxver-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-meta {
    margin: 4px 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: var(--voxver-text-muted);

    svg {
      flex-shrink: 0;
      opacity: 0.7;
    }
  }
}

/* 操作按钮 */
.card-actions {
  display: flex;
  border-top: 1px solid var(--voxver-border-color);
  padding: 2px;

  .action-btn {
    flex: 1;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--voxver-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--voxver-radius-sm);
    transition:
      background var(--voxver-transition-fast),
      color var(--voxver-transition-fast);

    &:hover {
      background: var(--voxver-bg-tertiary);
      color: var(--voxver-primary);
    }

    &.launch {
      &:hover {
        background: var(--voxver-primary);
        color: var(--voxver-text-inverse);
      }
    }

    &.danger {
      &:hover {
        background: var(--voxver-error-light);
        color: var(--voxver-error);
      }
    }
  }
}
</style>
