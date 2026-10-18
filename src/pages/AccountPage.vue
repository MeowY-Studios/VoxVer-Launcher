<template>
  <div class="account-page">
    <div class="page-header">
      <h2 class="vox-sec-title">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        {{ $t('auth.accountManager') }}
      </h2>
    </div>

    <!-- 在线 / 离线 切换器 -->
    <div class="account-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'online' }"
        @click="activeTab = 'online'"
      >
        {{ $t('auth.tabOnline') }}
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'offline' }"
        @click="activeTab = 'offline'"
      >
        {{ $t('auth.tabOffline') }}
      </button>
    </div>

    <Transition name="tab-fade" mode="out-in">
      <!-- 在线面板 -->
      <div v-if="activeTab === 'online'" key="online" class="account-panel">
        <div class="online-layout">
          <!-- 微软账户卡片 -->
          <section class="account-section vox-card">
            <div class="section-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#00a4ef" style="flex-shrink: 0">
                <rect width="24" height="24" rx="4" />
                <text x="5" y="17.5" font-size="14" font-weight="bold" fill="#fff">M</text>
              </svg>
              <span class="section-title">{{ $t('auth.microsoftAccount') }}</span>
              <span class="status-badge" :class="msAccounts.length > 0 ? 'success' : 'default'">
                {{ msAccounts.length > 0 ? $t('auth.loggedIn') : $t('auth.notLoggedIn') }}
              </span>
            </div>

            <!-- 已登录账户卡堆（当前使用在最上，点击后面卡片切换） -->
            <div class="card-stack" :style="{ height: stackHeight }" v-if="msAccounts.length > 0">
              <div
                v-for="(acc, i) in stackedAccounts"
                :key="acc.id"
                class="profile-item id-card"
                :class="{ active: i === 0, clickable: i !== 0 }"
                :style="cardStyle(i)"
                @click="switchAccount(acc)"
                @mouseenter="hoverIndex = i"
                @mouseleave="hoverIndex = -1"
              >
                <div class="bc-top">
                  <img
                    v-if="avatarSrc(acc) && !skinLoadFailed[acc.uuid]"
                    :src="avatarSrc(acc)"
                    class="profile-avatar"
                    :alt="$t('auth.skin')"
                    @error="skinLoadFailed[acc.uuid] = true"
                  />
                  <div v-else class="profile-avatar placeholder">
                    {{ acc.name[0]?.toUpperCase() }}
                  </div>
                  <span v-if="acc.isActive === 1" class="active-badge">{{
                    $t('auth.active')
                  }}</span>
                </div>
                <p class="bc-uuid">{{ acc.uuid }}</p>
                <div class="bc-bottom">
                  <p class="profile-name">{{ acc.name }}</p>
                  <button
                    class="vox-btn vox-btn--destructive bc-logout"
                    @click.stop="logoutMicrosoft(acc.id)"
                  >
                    {{ $t('auth.logout') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 未登录状态 -->
            <div class="section-body empty-body" v-else>
              <p>{{ $t('auth.loginTip') }}</p>
            </div>

            <!-- 登录 / 添加账户按钮 -->
            <div class="section-footer">
              <button class="vox-btn vox-btn--primary" @click="showLoginModal = true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#00a4ef">
                  <rect width="24" height="24" rx="4" />
                  <text x="5" y="17.5" font-size="14" font-weight="bold" fill="#fff">M</text>
                </svg>
                {{
                  msAccounts.length > 0
                    ? $t('auth.addAnotherMicrosoftAccount')
                    : $t('auth.signInWithMicrosoft')
                }}
              </button>
            </div>
          </section>

          <!-- 3D 皮肤展示（当前使用账户） -->
          <section class="skin-3d-section vox-card">
            <div class="section-header">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                style="flex-shrink: 0"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span class="section-title">{{ $t('auth.skin3dPreview') }}</span>
            </div>
            <Transition name="skin-swap">
              <SkinViewer3D :key="activeSkinUuid" :skin="activeSkinRaw" />
            </Transition>
          </section>
        </div>
      </div>

      <!-- 离线路板 -->
      <div v-else key="offline" class="account-panel">
        <!-- 离线账户 -->
        <section class="account-section offline vox-card">
          <div class="section-header">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              style="flex-shrink: 0; color: var(--voxver-text-muted)"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path
                d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
              />
            </svg>
            <span class="section-title">{{ $t('auth.offlineAccount') }}</span>
          </div>

          <div class="section-body">
            <div class="form-group">
              <label>{{ $t('auth.playerName') }}</label>
              <input
                type="text"
                class="vox-input"
                v-model="offlineName"
                :placeholder="$t('auth.playerNamePlaceholder')"
                maxlength="16"
              />
            </div>

            <div class="form-group">
              <label>{{ $t('auth.uuid') }}（{{ $t('common.optional') }}）</label>
              <div class="input-row">
                <input
                  type="text"
                  class="vox-input"
                  v-model="offlineUuid"
                  :placeholder="$t('auth.uuidPlaceholder')"
                />
                <button class="vox-btn" @click="offlineUuid = generateUUID()">
                  {{ $t('common.generate') }}
                </button>
              </div>
            </div>

            <div class="form-actions">
              <span v-if="offlineError" class="form-error">{{ offlineError }}</span>
              <button
                class="vox-btn vox-btn--primary"
                @click="saveOffline"
                :disabled="savingOffline"
              >
                {{ savingOffline ? $t('common.saving') : $t('auth.saveOfflineAccount') }}
              </button>
            </div>
          </div>
        </section>

        <!-- 提示 -->
        <aside class="hint-box">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{{ $t('auth.offlineModeHint') }}</span>
        </aside>

        <!-- 外链入口（正版引导，置于离线路板内） -->
        <div class="external-links">
          <a
            class="vox-btn ext-link-btn"
            href="https://www.xbox.com/zh-cn/games/store/minecraft-java-bedrock-edition-for-pc/9nxp44l49shj"
            target="_blank"
            rel="noopener"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {{ $t('auth.buyOfficial') }}
          </a>
          <a
            class="vox-btn ext-link-btn"
            href="https://www.minecraft.net/zh-hans"
            target="_blank"
            rel="noopener"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 014-10z" />
            </svg>
            {{ $t('auth.goOfficialSite') }}
          </a>
        </div>
      </div>
    </Transition>

    <!-- ===== Microsoft 登录弹窗（Device Flow） ===== -->
    <MicrosoftLoginModal v-model="showLoginModal" @logged-in="onLoggedIn" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAccountsStore } from '../stores/accounts.store'
import MicrosoftLoginModal from '../components/auth/MicrosoftLoginModal.vue'
import SkinViewer3D from '../components/auth/SkinViewer3D.vue'

const { t } = useI18n()
const accountsStore = useAccountsStore()

// * ====== 微软登录弹窗显隐 ======
const showLoginModal = ref(false)

/** 登录成功后刷新账户列表（皮肤头像由 watch msAccounts 自动补载） */
async function onLoggedIn() {
  await accountsStore.fetchAccounts()
}

// * ====== 在线/离线路板切换状态 ======
const activeTab = ref<'online' | 'offline'>('online')

// * ====== 微软账户状态（支持多账户） ======
const msAccounts = computed(() => accountsStore.accounts.filter((a) => a.type === 'microsoft'))

// * ====== 账户皮肤（本地缓存，raw 为完整皮肤，head 为裁剪头像，按 uuid 索引） ======
const rawSkinUrls = ref<Record<string, string>>({})
const skinDataUrls = ref<Record<string, string>>({})
const skinLoadFailed = ref<Record<string, boolean>>({})

/** 当前使用账户的完整皮肤（供右侧 3D 展示） */
const activeSkinRaw = computed(() => {
  const active = msAccounts.value.find((a) => a.isActive === 1)
  return active ? rawSkinUrls.value[active.uuid] || '' : ''
})

/** 当前使用账户 uuid（作为 3D 组件 key，切换时触发左右滑动过渡） */
const activeSkinUuid = computed(
  () => msAccounts.value.find((a) => a.isActive === 1)?.uuid ?? 'none'
)

/** 为所有微软账户加载本地皮肤 */
async function loadAccountSkins() {
  for (const acc of msAccounts.value) {
    if (!acc.uuid || skinDataUrls.value[acc.uuid]) continue
    const result = await window.electronAPI?.account.getSkinDataUrl(acc.uuid)
    if (result?.ok && result.data) {
      rawSkinUrls.value[acc.uuid] = result.data
      skinDataUrls.value[acc.uuid] = await cropSkinHead(result.data)
      // * 本地缓存加载成功，清除此前的失败标记（首渲染时兜底源可能 404）
      delete skinLoadFailed.value[acc.uuid]
    }
  }
}

/** 头像地址：优先本地缓存 dataUrl，兜底仅接受 http(s) 远程 skin_url（DB 老数据可能是本地路径） */
function avatarSrc(acc: { uuid: string; skin_url: string | null }): string {
  if (skinDataUrls.value[acc.uuid]) return skinDataUrls.value[acc.uuid]
  return acc.skin_url?.startsWith('http') ? acc.skin_url : ''
}

/** 从完整皮肤图中裁剪头像区域（8x8 头部像素并放大） */
async function cropSkinHead(skinDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const SIZE = 8
      const canvasSize = 48
      canvas.width = canvasSize
      canvas.height = canvasSize
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      // * Minecraft 皮肤脸部在 (8, 8) 位置，8x8 像素
      ctx.drawImage(img, 8, 8, SIZE, SIZE, 0, 0, canvasSize, canvasSize)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(skinDataUrl)
    img.src = skinDataUrl
  })
}

// * ====== 离线账户状态 ======
const offlineName = ref('Steve')
const offlineUuid = ref('')
const savingOffline = ref(false)
const offlineError = ref('')

onMounted(async () => {
  await accountsStore.fetchAccounts()
  await loadAccountSkins()
})

// * 账户列表变化时（登录新增/退出删除），为新账户补充皮肤头像
watch(msAccounts, () => {
  void loadAccountSkins()
})

// * ====== 退出指定微软账户 ======
async function logoutMicrosoft(id: string) {
  await accountsStore.deleteAccount(id)
}

/** 点击卡片循环左移：该卡到最前，原先排它前面的卡按序移到尾部（ABC 点 B → BCA） */
async function switchAccount(acc: { id: string; isActive: number }) {
  if (acc.isActive === 1) return
  lastManualAt = Date.now()
  const i = displayOrder.value.indexOf(acc.id)
  if (i > 0) {
    displayOrder.value = [...displayOrder.value.slice(i), ...displayOrder.value.slice(0, i)]
  }
  await accountsStore.setActive(acc.id)
}

// * ====== 卡堆（循环顺序：点哪张哪张到最前，前面的卡按序移到尾部，ABC→BCA→CAB） ======
const CARD_HEIGHT = 162
const CARD_OFFSET = 24
const HOVER_LIFT = 12
const hoverIndex = ref(-1)

/** 显示顺序（账户 id，头部 = 卡堆最前）；与 isActive 解耦，切换时循环左移 */
const displayOrder = ref<string[]>([])
/** 最近一次手动切换时间戳：时间窗内 store 刷新不触发激活卡置顶，避免连点乱序 */
let lastManualAt = 0

/** 账户列表变化时同步顺序：移除已删、追加新增；外部激活（如新登录）时置顶 */
watch(
  msAccounts,
  (list) => {
    const ids = list.map((a) => a.id)
    const kept = displayOrder.value.filter((id) => ids.includes(id))
    const added = ids.filter((id) => !kept.includes(id))
    displayOrder.value = [...kept, ...added]
    const activeId = list.find((a) => a.isActive === 1)?.id
    if (activeId && displayOrder.value[0] !== activeId && Date.now() - lastManualAt > 800) {
      displayOrder.value = [activeId, ...displayOrder.value.filter((id) => id !== activeId)]
    }
  },
  { immediate: true }
)

/** 按显示顺序排列的账户卡片 */
const stackedAccounts = computed(() =>
  displayOrder.value
    .map((id) => msAccounts.value.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
)

/** 卡堆总高：一张完整卡 + 后面每张卡露出的边缘 */
const stackHeight = computed(
  () => `${CARD_HEIGHT + Math.max(0, stackedAccounts.value.length - 1) * CARD_OFFSET}px`
)

/** 每张卡的堆叠位置：最前卡位置最低且层级最高，后面的卡向上偏移露出顶边；悬停上抬方便点击 */
function cardStyle(i: number) {
  const n = stackedAccounts.value.length
  const baseY = (n - 1 - i) * CARD_OFFSET
  const lift = hoverIndex.value === i && i !== 0 ? HOVER_LIFT : 0
  return {
    transform: `translateY(${baseY - lift}px) scale(${1 - i * 0.03})`,
    zIndex: n - i,
    filter: i === 0 ? 'none' : 'brightness(0.93)'
  }
}

// * ====== 保存离线账户 ======
async function saveOffline() {
  offlineError.value = ''
  const name = offlineName.value.trim()
  if (!name || name.length < 2) {
    offlineError.value = t('auth.playerNameMinLength') as string
    return
  }
  savingOffline.value = true
  try {
    const result = await window.electronAPI?.account.loginOffline(name)
    if (result?.ok) {
      await accountsStore.fetchAccounts()
    } else {
      offlineError.value = result?.error || (t('auth.saveFailed') as string)
    }
  } catch (e: unknown) {
    offlineError.value = (e as Error).message || (t('auth.saveFailed') as string)
  } finally {
    savingOffline.value = false
  }
}

// * ====== 生成 UUID ======
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
</script>

<style scoped lang="scss">
.account-page {
  padding: 16px 28px;
  max-width: 520px;
}

.page-header {
  margin-bottom: 20px;
}

/* * ====== 在线/离线 切换器 ====== */
.account-tabs {
  display: flex;
  gap: 4px;
  width: fit-content;
  margin-bottom: 16px;
  padding: 4px;
  background: color-mix(in oklab, var(--voxver-text) 5%, transparent);
  border-radius: var(--voxver-radius-md);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  padding: 8px 20px;
  font-size: 13px;
  color: var(--voxver-text-secondary);
  border-radius: var(--voxver-radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--voxver-transition-fast);

  &:hover {
    color: var(--voxver-text-primary);
    background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  }

  &.active {
    background: var(--voxver-primary);
    color: #fff;
    font-weight: 500;
    box-shadow: 0 1px 2px var(--voxver-shadow-sm);
  }
}

/* * ====== 面板切换过渡 ====== */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition:
    opacity var(--voxver-transition-fast) var(--voxver-ease-out-quart),
    transform var(--voxver-transition-fast) var(--voxver-ease-out-quart);
}
.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* * ====== 账户区块（视觉样式由 .vox-card 提供） ====== */
.account-section {
  margin-bottom: 16px;
  overflow: hidden;

  &.offline .section-header svg {
    color: var(--voxver-text-secondary);
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--voxver-border-color);

  .section-title {
    flex: 1;
    font-size: 13px;
    font-weight: 700;
    color: var(--voxver-text-primary);
  }
}

.status-badge {
  padding: 2px 10px;
  border-radius: var(--voxver-radius-full);
  font-size: 11px;
  font-weight: 600;

  &.success {
    background: color-mix(in oklab, var(--voxver-success) 15%, transparent);
    color: var(--voxver-success);
  }
  &.default {
    background: color-mix(in oklab, var(--voxver-text-muted) 15%, transparent);
    color: var(--voxver-text-muted);
  }
}

.section-body {
  padding: 16px;

  &.empty-body {
    text-align: center;

    p {
      margin: 0 0 12px;
      font-size: 13px;
      color: var(--voxver-text-secondary);
    }
  }
}

/* * ====== 资料行 ====== */
.profile-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;

  & + & {
    border-top: 1px solid var(--voxver-border-color);
  }
}

/* * ====== 身份卡堆（银行卡风格，当前使用在最上，点击后面的卡切换） ====== */
.card-stack {
  position: relative;
  padding: 0 16px 16px;
}

.profile-item.id-card {
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 162px;
  display: flex;
  flex-direction: column;
  padding: 16px;
  border: 1px solid var(--voxver-border-color);
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--voxver-primary) 16%, var(--voxver-bg-elevated)) 0%,
    var(--voxver-bg-elevated) 65%
  );
  overflow: hidden;
  transform-origin: top center;
  /* * 切换卡片时的抽卡/落卡动画：弹性缓出让位移与缩放可感 */
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.5s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  /* * 卡面高光 */
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -25%;
    width: 65%;
    height: 130%;
    background: radial-gradient(ellipse, rgba(255, 255, 255, 0.09), transparent 70%);
    pointer-events: none;
  }

  &.clickable {
    cursor: pointer;

    &:hover {
      border-color: var(--voxver-primary);
    }
  }

  &.active {
    border-color: var(--voxver-success);
    background: linear-gradient(
      135deg,
      color-mix(in oklab, var(--voxver-success) 18%, var(--voxver-bg-elevated)) 0%,
      var(--voxver-bg-elevated) 65%
    );
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
  }
}

/* * 银行卡结构：顶部头像/徽标、卡号式 UUID、底部姓名/退出 */
.bc-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.bc-uuid {
  margin: 10px 0 8px;
  font-family: monospace;
  font-size: 12px;
  letter-spacing: 0.5px;
  color: var(--voxver-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bc-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;

  .profile-name {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--voxver-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.bc-logout {
  flex-shrink: 0;
  padding: 3px 10px;
  font-size: 12px;
}

/* * 在线面板左右分栏：账户列表 + 3D 皮肤展示（两列等高） */
.online-layout {
  display: flex;
  gap: 16px;
  align-items: stretch;
  width: 800px;
}

.online-layout .account-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  /* * 按钮贴底，与右列等高时底部对齐 */
  .section-footer {
    margin-top: auto;
  }
}

.skin-3d-section {
  position: relative;
  width: 190px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .skin-viewer {
    flex: 1;
  }
}

/* * 3D 皮肤左右切换：新模型从右滑入，旧模型向左滑出 */
.skin-swap-enter-active,
.skin-swap-leave-active {
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.45s ease;
}

.skin-swap-enter-from {
  transform: translateX(70px);
  opacity: 0;
}

.skin-swap-leave-to {
  transform: translateX(-70px);
  opacity: 0;
}

/* * 离场元素脱离文档流，避免与入场元素互相挤压 */
.skin-swap-leave-active {
  position: absolute;
  inset: 0;
}

.active-badge {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--voxver-success);
  background: color-mix(in oklab, var(--voxver-success) 15%, transparent);
  border-radius: var(--voxver-radius-xs);
}

.section-footer {
  padding: 0 16px 16px;

  .vox-btn {
    width: 100%;
  }
}

.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--voxver-radius-sm);
  object-fit: cover;
  flex-shrink: 0;

  &.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--voxver-primary);
    color: var(--voxver-text-inverse);
    font-size: 20px;
    font-weight: 700;
  }
}

img.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--voxver-radius-sm);
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid var(--voxver-border-color);
  image-rendering: pixelated;
  background: #8b5e3c;
}

/* * ====== 表单 ====== */
.form-group {
  margin-bottom: 14px;

  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--voxver-text-secondary);
    margin-bottom: 5px;
  }
}

.input-row {
  display: flex;
  gap: 6px;

  .vox-input {
    flex: 1;
  }
}

.form-actions {
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.form-error {
  font-size: 12px;
  color: var(--voxver-error);
}

/* * ====== 提示框 ====== */
.hint-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: color-mix(in oklab, var(--voxver-warning) 12%, transparent);
  border-left: 3px solid var(--voxver-warning);
  border-radius: 0 var(--voxver-radius-md) var(--voxver-radius-md) 0;
  font-size: 12px;
  color: var(--voxver-text-secondary);

  svg {
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--voxver-warning);
  }
}

/* * ====== 外链入口 ====== */
.external-links {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.ext-link-btn {
  flex: 1;
  text-decoration: none;

  svg {
    flex-shrink: 0;
    opacity: 0.7;
  }

  &:hover {
    svg {
      opacity: 1;
    }
  }
}
</style>
