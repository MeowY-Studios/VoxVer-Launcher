<template>
  <div class="home-page">
    <!-- Bento Grid 布局 -->
    <div class="bento-grid">
      <!-- 欢迎卡片 - 占 4 列 -->
      <div class="bento-card bento-card--span-4 bento-card--hero">
        <div class="hero-content">
          <div class="hero-icon">
            <img src="/Alogo.png" alt="VoxVer" class="hero-logo-img" />
          </div>
          <div class="hero-text">
            <h1 class="hero-title">{{ $t('home.welcomeTip') }}</h1>
          </div>

        </div>
      </div>



      <!-- 快捷操作 - 占 4 列 -->
      <div class="bento-card bento-card--span-4 bento-card--actions">
        <div class="actions-grid">
          <button class="action-btn" @click="$router.push('/downloads')">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>{{ $t('download.downloads') }}</span>
          </button>
          <button class="action-btn" @click="$router.push('/settings')">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span>{{ $t('settings.settings') }}</span>
          </button>
          <button class="action-btn" @click="$router.push('/account')">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{{ $t('auth.account') }}</span>
          </button>
          <button class="action-btn" @click="openReceiveModal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>{{ $t('home.receiveShare') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 最近游玩的实例 -->
    <div v-if="recentInstances.length" class="recent-section">
      <div class="section-header">
        <h3 class="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ $t('home.recent') }}
        </h3>
        <button class="section-link" @click="$router.push('/instances')">
          {{ $t('home.viewAll') }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      <div class="recent-grid">
        <div
          v-for="inst in recentInstances"
          :key="inst.id"
          class="recent-card vox-card--game"
          @click="$router.push('/instances')"
        >
          <div class="rc-icon">{{ inst.name[0] }}</div>
          <div class="rc-info">
            <p class="rc-name">{{ inst.name }}</p>
            <p class="rc-meta">{{ inst.mcVersion }} · {{ getLoaderLabel(inst) }}</p>
          </div>
          <div class="rc-play">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <span class="rc-time">{{ formatTime(inst.lastPlayed) }}</span>
        </div>
      </div>
    </div>

    <!-- 接收分享弹窗 -->
    <ReceiveModal
      v-model="showReceiveModal"
      :initial-share-code="initialShareCode"
      @imported="onInstanceImported"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useInstancesStore } from '../stores'
import type { GameInstance } from '../types/instance'

const { t } = useI18n()

interface Instance {
  id: string
  name: string
  mcVersion: string
  loaderType?: string
  lastPlayed?: string
}

const instancesStore = useInstancesStore()
const router = useRouter()

const showReceiveModal = ref(false)
const initialShareCode = ref('')
let protocolCleanup: (() => void) | undefined

const recentInstances = computed(() => {
  return instancesStore.recentInstances.map((inst: GameInstance) => ({
    id: inst.id,
    name: inst.name,
    mcVersion: inst.mcVersion || t('home.unknown'),
    loaderType: inst.loaderType || '',
    lastPlayed: inst.lastPlayed ?? undefined
  }))
})

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return t('instance.neverPlayed')
  const ts = new Date(dateStr).getTime()
  if (isNaN(ts)) return t('home.unknown')
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('home.justNow')
  if (mins < 60) return t('home.minutesAgo', { n: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('home.hoursAgo', { n: hours })
  return t('home.daysAgo', { n: Math.floor(hours / 24) })
}

function getLoaderLabel(inst: { loaderType: string }): string {
  if (!inst.loaderType || inst.loaderType === 'vanilla') return t('game.vanilla') as string
  return inst.loaderType.charAt(0).toUpperCase() + inst.loaderType.slice(1)
}

function openReceiveModal() {
  showReceiveModal.value = true
}

function onInstanceImported() {
  instancesStore.fetchInstances()
  router.push('/instances')
}

onMounted(() => {
  instancesStore.fetchInstances()

  // * 监听协议唤起（voxver://share:CODE）
  protocolCleanup = window.electronAPI?.share?.onProtocolInvoke((code: string) => {
    initialShareCode.value = code
    showReceiveModal.value = true
  })
})

onUnmounted(() => {
  protocolCleanup?.()
})
</script>

<style scoped lang="scss">
.home-page {
  padding: 28px 32px;
  min-height: 100%;
}

/* * ===== Hero 卡片 ===== */
.bento-card--hero {
  background: var(--voxver-bg-tertiary);
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 20px;
  height: 100%;
}

.hero-icon {
  .hero-logo-img {
    height: 80px;
    width: auto;
    object-fit: contain;
    display: block;
  }
}

.hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--voxver-text-primary);
  letter-spacing: -0.01em;
}

.hero-desc {
  margin: 0;
  font-size: 13px;
  color: var(--voxver-text-tertiary);
  max-width: 380px;
  line-height: 1.5;
}

/* * ===== 操作卡片（全宽） ===== */
.bento-card--actions {
  padding: 16px 24px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 8px;
  border: 1px solid var(--voxver-border-color);
  border-radius: 14px;
  background: var(--voxver-bg-elevated);
  color: var(--voxver-text-secondary);
  cursor: pointer;
  transition: all var(--voxver-transition-fast);

  &:hover {
    border-color: var(--voxver-border-strong);
    background: var(--voxver-bg-hover);
    color: var(--voxver-text-primary);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.96);
  }

  svg {
    flex-shrink: 0;
  }

  span {
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    line-height: 1.2;
  }
}

/* * ===== 最近实例 ===== */
.recent-section {
  margin-top: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--voxver-text-primary);

  svg { color: var(--voxver-accent); }
}

.section-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid var(--voxver-border-color);
  border-radius: 20px;
  background: transparent;
  color: var(--voxver-text-tertiary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--voxver-transition-fast);

  &:hover {
    border-color: var(--voxver-border-strong);
    color: var(--voxver-text-primary);
  }
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.recent-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  position: relative;
}

.rc-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--voxver-launch-gradient);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rc-info {
  flex: 1;
  min-width: 0;

  .rc-name {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--voxver-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rc-meta {
    margin: 2px 0 0;
    font-size: 11px;
    color: var(--voxver-text-muted);
  }
}

.rc-play {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--voxver-accent-soft);
  color: var(--voxver-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
  transition: all var(--voxver-transition-fast);
  flex-shrink: 0;
}

.recent-card:hover .rc-play {
  opacity: 1;
  transform: scale(1);
}

.rc-time {
  font-size: 11px;
  color: var(--voxver-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

/* * ===== 响应式 ===== */
@media (max-width: 768px) {
  .home-page { padding: 16px 20px; }

  .bento-card--hero { padding: 24px; }

  .hero-title { font-size: 20px; }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .recent-grid {
    grid-template-columns: 1fr;
  }
}
</style>
