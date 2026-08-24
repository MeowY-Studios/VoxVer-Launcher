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

    <!-- 接收分享弹窗 -->
    <ReceiveModal
      v-model="showReceiveModal"
      :initial-share-code="initialShareCode"
      @imported="onInstanceImported"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useInstancesStore } from '../stores'
import ReceiveModal from '../components/share/ReceiveModal.vue'

const { t } = useI18n()

const instancesStore = useInstancesStore()
const router = useRouter()

const showReceiveModal = ref(false)
const initialShareCode = ref('')
let protocolCleanup: (() => void) | undefined

function openReceiveModal() {
  showReceiveModal.value = true
}

function onInstanceImported() {
  instancesStore.fetchInstances()
  router.push('/instances')
}

onMounted(async () => {
  await instancesStore.fetchInstances()

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

/* * ===== 响应式 ===== */
@media (max-width: 768px) {
  .home-page { padding: 16px 20px; }

  .bento-card--hero { padding: 24px; }

  .hero-title { font-size: 20px; }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
