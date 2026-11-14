<template>
  <!-- Koring 皮肤：满屏主色背景 + V 水印，账户在左上，实例名/版本名贴左下 -->
  <div v-if="appStore.skin === 'koring'" class="kor-home">
    <button type="button" class="kor-home__account" @click="router.push('/account')">
      <span class="kor-home__avatar">{{ korAccountInitial }}</span>
      <span class="kor-home__account-text">
        <span class="kor-home__account-name">{{ korAccountName }}</span>
        <span class="kor-home__account-desc">{{ korAccountDesc }}</span>
      </span>
      <svg
        class="kor-home__chev"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </button>

    <!-- 左下：版本名占住按钮位；hover 时名称上移、启动胶囊滑出；点名称去实例页 -->
    <div class="kor-home__bottom">
      <button
        type="button"
        class="kor-home__title"
        @click="router.push('/instances')"
        @contextmenu.prevent.stop="openVersionMenu"
      >
        {{ korTitle }}
      </button>
      <button v-if="korVersionSelected" type="button" class="kor-home__start" @click="korLaunch">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5.14v13.72L19 12z" />
        </svg>
        <span>{{ $t('home.koringLaunchGame') }}</span>
      </button>
    </div>
  </div>

  <div v-else class="c-page home-page home-blank">
    <!-- 原版首页：右侧内容区留空，一切操作都在左侧边栏与顶部导航上 -->
    <ReceiveModal
      v-model="showReceiveModal"
      :initial-share-code="initialShareCode"
      @imported="onInstanceImported"
    />
  </div>

  <!-- 右键版本号：版本设置菜单 -->
  <Teleport to="body">
    <div
      v-if="versionMenu"
      class="kor-ver-menu"
      :style="{ left: `${versionMenu.x}px`, top: `${versionMenu.y}px` }"
      @click.stop
    >
      <button type="button" class="kor-ver-menu__item" @click="goVersionSettings">
        {{ $t('home.versionSettings') }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore, useAccountsStore, useInstancesStore, useVersionsStore } from '../stores'
import ReceiveModal from '../components/share/ReceiveModal.vue'

const { t } = useI18n()

const instancesStore = useInstancesStore()
const accountsStore = useAccountsStore()
const appStore = useAppStore()
const versionsStore = useVersionsStore()
const router = useRouter()

/** 是否已选中具体版本：决定左下角是否出现「启动游戏」胶囊 */
const korVersionSelected = computed(() => Boolean(versionsStore.currentVersionId))

/** Koring 首页左下大标题：显示当前选中的具体版本号，未选则提示选择版本 */
const korTitle = computed(() => versionsStore.currentVersionId || t('home.koringPickVersion'))

/** 左下「启动游戏」：进启动页并自动开始启动 */
function korLaunch() {
  router.push({ path: '/launch', query: { autostart: '1' } })
}

/** 右键版本号 → 「版本设置」菜单（只对当前选中的版本生效） */
const versionMenu = ref<{ x: number; y: number } | null>(null)

function openVersionMenu(e: MouseEvent) {
  if (!versionsStore.currentVersionId) return
  // 贴边时向内收，避免菜单超出窗口
  versionMenu.value = {
    x: Math.min(e.clientX, window.innerWidth - 148),
    y: Math.min(e.clientY, window.innerHeight - 40)
  }
}

function goVersionSettings() {
  versionMenu.value = null
  void router.push('/versions')
}

function closeVersionMenu() {
  versionMenu.value = null
}

/** Koring 首页左上账户卡：显示当前账号名与类型 */
const korAccountName = computed(
  () => accountsStore.activeAccount?.name || t('home.koringNotSignedIn')
)
const korAccountDesc = computed(() => {
  const account = accountsStore.activeAccount
  if (!account) return t('home.koringAccountHint')
  return account.type === 'microsoft' ? t('home.koringMicrosoft') : t('home.koringOffline')
})
const korAccountInitial = computed(() =>
  (accountsStore.activeAccount?.name || 'V').slice(0, 1).toUpperCase()
)

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

  window.addEventListener('click', closeVersionMenu)
  window.addEventListener('keydown', closeVersionMenu)
})

onUnmounted(() => {
  protocolCleanup?.()
  window.removeEventListener('click', closeVersionMenu)
  window.removeEventListener('keydown', closeVersionMenu)
})
</script>

<style scoped lang="scss">
/* ===== Koring 首页（原 skin-koring.scss 的 .kor-home* 段，仅 Koring 皮肤渲染） ===== */
.kor-home {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

/* 左上账户卡 */
.kor-home__account {
  position: absolute;
  left: 22px;
  top: 20px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 320px;
  padding: 10px 16px 10px 10px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: var(--kor-ink);
  text-align: left;
  cursor: pointer;
  transition: background 160ms ease;
}

.kor-home__account:hover {
  background: rgba(var(--kor-fg-rgb), 0.1);
}

.kor-home__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(var(--kor-fg-rgb), 0.18);
  color: var(--kor-ink);
  font-size: 16px;
  font-weight: 700;
}

.kor-home__account-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.kor-home__account-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--kor-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kor-home__account-desc {
  font-size: 12px;
  color: rgba(var(--kor-fg-rgb), 0.62);
}

.kor-home__chev {
  flex: 0 0 auto;
  margin-left: 6px;
  color: rgba(var(--kor-fg-rgb), 0.55);
}

/* 左下：标题 + 启动胶囊（底部感应区，悬停滑出按钮） */
.kor-home__bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  height: 160px;
  padding: 0 24px 24px;
  text-align: left;
}

/* 版本名：静止时占住「启动游戏」按钮的位置，hover 时整体上移 */
.kor-home__title {
  max-width: 100%;
  margin: 0;
  padding: 6px 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 48px;
  line-height: 1.05;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--kor-ink);
  text-align: left;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transform-origin: left center;
  transform: translateY(0);
  transition:
    background-color 200ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.kor-home__bottom:hover .kor-home__title,
.kor-home__title:focus-visible {
  background: rgba(0, 0, 0, 0.16);
  transform: translateY(-46px) scale(1.01);
}

/* 启动游戏胶囊：静止时藏在版本名下方，hover 时向上滑出 */
.kor-home__start {
  position: absolute;
  left: 24px;
  bottom: 24px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(var(--kor-fg-rgb), 0.16);
  background: rgba(10, 14, 22, 0.42);
  backdrop-filter: blur(5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  font-size: 14px;
  font-weight: 500;
  color: var(--kor-ink);
  cursor: pointer;
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
  transition:
    opacity 220ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 150ms ease;
}

.kor-home__start svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.kor-home__bottom:hover .kor-home__start,
.kor-home__start:focus-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.kor-home__start:hover {
  background: rgba(10, 14, 22, 0.62);
  transform: translateY(0) scale(1.02);
}

.kor-home__start:active {
  transform: translateY(0) scale(0.97);
}

/* 右键版本号 → 版本设置菜单 */
.kor-ver-menu {
  position: fixed;
  z-index: 4000;
  min-width: 132px;
  padding: 4px;
  border: 1px solid rgba(var(--kor-fg-rgb), 0.08);
  border-radius: 10px;
  background: var(--kor-popover);
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
}

.kor-ver-menu__item {
  display: block;
  width: 100%;
  padding: 7px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--voxver-text-primary);
  font-size: 12.5px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background var(--voxver-transition-fast);
}

.kor-ver-menu__item:hover {
  background: rgba(var(--kor-fg-rgb), 0.1);
}

/* 浅色模式微调 */
html[data-theme='light'] .kor-ver-menu {
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
}

html[data-theme='light'] .kor-home__title {
  text-shadow: 0 2px 20px rgba(255, 255, 255, 0.65);
}

html[data-theme='light'] .kor-home__bottom:hover .kor-home__title,
html[data-theme='light'] .kor-home__title:focus-visible {
  background: rgba(var(--kor-fg-rgb), 0.06);
}

html[data-theme='light'] .kor-home__start {
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

html[data-theme='light'] .kor-home__start:hover {
  background: #ffffff;
}

html[data-theme='light'] .kor-home__account:hover {
  background: rgba(var(--kor-fg-rgb), 0.06);
}

html[data-theme='light'] .kor-home__avatar {
  background: rgba(var(--kor-fg-rgb), 0.1);
}

html[data-theme='light'] .kor-home__account-desc {
  color: rgba(var(--kor-fg-rgb), 0.68);
}

html[data-theme='light'] .kor-home__chev {
  color: rgba(var(--kor-fg-rgb), 0.6);
}
</style>
