<template>
  <Teleport to="body">
    <transition name="modal-slide">
      <div v-if="visible" class="acc-overlay" @click.self="close">
        <div class="acc-window">
          <!-- 标题栏 -->
          <header class="acc-header">
            <button class="acc-back" @click="close">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span class="acc-title">{{ $t('auth.accountManager') }}</span>
            <div class="acc-wc">
              <button class="acc-wc-btn" @click="minimize">
                <svg width="10" height="1" viewBox="0 0 10 1">
                  <rect width="10" height="1" fill="currentColor" />
                </svg>
              </button>
              <button class="acc-wc-btn acc-close" @click="close">
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.2" />
                </svg>
              </button>
            </div>
          </header>

          <!-- 主体 -->
          <div class="acc-body">
            <!-- 微软账户 -->
            <section class="acc-section">
              <div class="acc-section-header">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="#00a4ef"
                  style="flex-shrink: 0"
                >
                  <rect width="24" height="24" rx="4" />
                  <text x="5" y="17.5" font-size="14" font-weight="bold" fill="#fff">M</text>
                </svg>
                <span class="acc-section-title">{{ $t('auth.microsoftAccount') }}</span>
                <span class="acc-badge">{{ $t('auth.accountCount', { count: msAccounts.length }) }}</span>
              </div>

              <!-- 已保存的微软账户列表 -->
              <div class="acc-section-body" v-if="msAccounts.length > 0">
                <div
                  v-for="acc in msAccounts"
                  :key="acc.id"
                  class="acc-profile"
                  :class="{ 'acc-profile-active': acc.isActive === 1 }"
                >
                  <div class="acc-avatar" style="background: #00a4ef">
                    {{ acc.name[0]?.toUpperCase() }}
                  </div>
                  <div class="acc-profile-info">
                    <p class="acc-name">{{ acc.name }}</p>
                    <p class="acc-uuid">{{ acc.uuid }}</p>
                  </div>
                  <div class="acc-profile-actions">
                    <button
                      v-if="acc.isActive !== 1"
                      class="acc-btn-ghost"
                      @click="switchMsAccount(acc.id)"
                    >
                      {{ $t('auth.useAccount') }}
                    </button>
                    <span v-else class="acc-badge success">{{ $t('auth.currentAccount') }}</span>
                    <button
                      class="acc-btn-ghost acc-btn-danger"
                      @click="removeMicrosoftAccount(acc.id)"
                    >
                      {{ $t('common.delete') }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 无账户提示 -->
              <div class="acc-section-body acc-empty" v-else>
                <p class="acc-empty-hint">{{ $t('auth.loginTip') }}</p>
              </div>

              <!-- 添加新账户 -->
              <div class="acc-section-body">
                <button
                  class="acc-btn-primary"
                  @click="startMicrosoftLogin"
                  :disabled="loginState !== 'idle'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#00a4ef">
                    <rect width="24" height="24" rx="4" />
                    <text x="5" y="17.5" font-size="14" font-weight="bold" fill="#fff">M</text>
                  </svg>
                  {{ msAccounts.length > 0 ? $t('auth.addAnotherMicrosoftAccount') : $t('auth.loginMicrosoftAccount') }}
                </button>
              </div>
            </section>

            <!-- 离线账户 -->
            <section class="acc-section">
              <div class="acc-section-header">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  style="color: var(--voxver-text-muted)"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path
                    d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
                  />
                </svg>
                <span class="acc-section-title">{{ $t('auth.offlineAccount') }}</span>
                <span class="acc-badge">{{ $t('auth.accountCount', { count: offlineAccounts.length }) }}</span>
              </div>

              <!-- 已保存的离线账户列表 -->
              <div class="acc-section-body" v-if="offlineAccounts.length > 0">
                <div
                  v-for="acc in offlineAccounts"
                  :key="acc.id"
                  class="acc-profile"
                  :class="{ 'acc-profile-active': acc.isActive === 1 }"
                >
                  <div class="acc-avatar" style="background: #8b5e3c">
                    {{ acc.name[0]?.toUpperCase() }}
                  </div>
                  <div class="acc-profile-info">
                    <p class="acc-name">{{ acc.name }}</p>
                    <p class="acc-uuid">{{ acc.uuid }}</p>
                  </div>
                  <div class="acc-profile-actions">
                    <button
                      v-if="acc.isActive !== 1"
                      class="acc-btn-ghost"
                      @click="switchToAccount(acc.id)"
                      :title="$t('auth.switchToAccount')"
                    >
                      {{ $t('auth.useAccount') }}
                    </button>
                    <span v-else class="acc-badge success">{{ $t('auth.currentAccount') }}</span>
                    <button
                      class="acc-btn-ghost acc-btn-danger"
                      @click="deleteOffline(acc.id)"
                      :title="$t('auth.deleteAccount')"
                    >
                      {{ $t('common.delete') }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 添加新离线账户 -->
              <div class="acc-section-body">
                <div class="acc-form-group">
                  <label class="acc-label">{{ $t('auth.playerName') }}</label>
                  <input
                    type="text"
                    class="acc-input"
                    v-model="offlineName"
                    :placeholder="$t('auth.playerNamePlaceholderShort')"
                    maxlength="16"
                  />
                </div>
                <div class="acc-form-group">
                  <label class="acc-label">{{ $t('auth.uuidOptional') }}</label>
                  <div class="acc-input-row">
                    <input
                      type="text"
                      class="acc-input"
                      v-model="offlineUuid"
                      :placeholder="$t('auth.uuidPlaceholder')"
                    />
                    <button class="acc-btn-ghost" @click="offlineUuid = generateUUID()">
                      {{ $t('common.generate') }}
                    </button>
                  </div>
                </div>
                <div class="acc-form-actions">
                  <span v-if="offlineError" class="acc-error">{{ offlineError }}</span>
                  <button class="acc-btn-primary" @click="saveOffline" :disabled="savingOffline">
                    {{ savingOffline ? $t('common.saving') : $t('auth.addOfflineAccount') }}
                  </button>
                </div>
              </div>
            </section>

            <!-- 提示 -->
            <aside class="acc-hint">
              <svg
                width="14"
                height="14"
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
          </div>
        </div>
      </div>
    </transition>

    <!-- OAuth 弹窗（独立于抽屉） -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="loginState !== 'idle'" @click.self="cancelLogin">
        <div class="modal-card">
          <div class="modal-header">
            <span class="modal-title">{{ $t('auth.loginMicrosoftAccount') }}</span>
            <button class="modal-close" @click="cancelLogin">✕</button>
          </div>
          <div class="modal-body">
            <!-- 等待用户访问链接 -->
            <template v-if="loginState === 'waiting_user'">
              <div class="device-flow">
                <p class="device-flow-hint">{{ $t('auth.deviceFlowHint') }}</p>
                <a class="device-flow-link" :href="deviceCodeInfo.verificationUri" target="_blank">
                  {{ deviceCodeInfo.verificationUri }}
                </a>
                <div class="device-code-box">
                  <span class="device-code">{{ deviceCodeInfo.userCode }}</span>
                  <button class="btn-ghost btn-sm" @click="copyCode">
                    {{ codeCopied ? $t('common.copied') : $t('common.copy') }}
                  </button>
                </div>
                <p class="device-flow-tip">
                  {{ $t('auth.deviceFlowTip') }}
                </p>
                <div class="loader-row">
                  <span class="loader"></span>
                  <span class="loader-text">{{ $t('auth.waitingAuthorization') }}</span>
                </div>
              </div>
            </template>
            <!-- 处理中 -->
            <template v-else-if="loginState === 'processing'">
              <div class="processing">
                <span class="loader loader-lg"></span>
                <p class="processing-text">{{ loginProgressText }}</p>
              </div>
            </template>
            <!-- 成功 -->
            <template v-else-if="loginState === 'done'">
              <div class="result-box success">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#34a853"
                  stroke-width="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <p>{{ $t('auth.loginSuccess') }} {{ newAccountName }}！</p>
              </div>
            </template>
            <!-- 错误 -->
            <template v-else-if="loginState === 'error'">
              <div class="result-box error-box">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ea4335"
                  stroke-width="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>{{ loginError }}</p>
                <button
                  class="acc-btn-primary btn-sm"
                  style="margin-top: 12px"
                  @click="startMicrosoftLogin"
                >
                  {{ $t('common.retry') }}
                </button>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button v-if="loginState === 'done'" class="acc-btn-outline" @click="closeOAuthModal">
              {{ $t('common.finish') }}
            </button>
            <button
              v-else-if="loginState === 'error'"
              class="acc-btn-outline"
              @click="closeOAuthModal"
            >
              {{ $t('common.close') }}
            </button>
            <button v-else class="acc-btn-outline" @click="cancelLogin">{{ $t('common.cancel') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAccountsStore } from '../stores/accounts.store'
import type { Account } from '../types/account'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [val: boolean] }>()

const accountsStore = useAccountsStore()
const { t } = useI18n()

// ====== 微软账户列表 ======
const msAccounts = computed(() => accountsStore.accounts.filter((a: Account) => a.type === 'microsoft'))

// ====== 离线账户列表 ======
const offlineAccounts = computed(() =>
  accountsStore.accounts.filter((a: Account) => a.type === 'offline')
)

// 切换微软账户
async function switchMsAccount(id: string) {
  await accountsStore.setActive(id)
  await accountsStore.fetchAccounts()
}

// 切换离线账户
async function switchToAccount(id: string) {
  await accountsStore.setActive(id)
  await accountsStore.fetchAccounts()
}

// 删除离线账户
async function deleteOffline(id: string) {
  const confirmMsg = t('account.confirmDelete') || '确认删除该账户？此操作不可撤销。'
  if (!confirm(confirmMsg)) return
  await accountsStore.deleteAccount(id)
  await accountsStore.fetchAccounts()
}

// 删除微软账户
async function removeMicrosoftAccount(id: string) {
  const confirmMsg = t('account.confirmDelete') || '确认删除该账户？此操作不可撤销。'
  if (!confirm(confirmMsg)) return
  await accountsStore.deleteAccount(id)
  await accountsStore.fetchAccounts()
}

// ====== 登录流程状态 ======
type LoginState = 'idle' | 'waiting_user' | 'processing' | 'done' | 'error'
const loginState = ref<LoginState>('idle')
const loginProgressText = ref('')
const loginError = ref('')
const newAccountName = ref('')
const deviceCodeInfo = ref({ userCode: '', verificationUri: '', message: '' })
const codeCopied = ref(false)

// ====== 离线账户状态 ======
const offlineName = ref('Steve')
const offlineUuid = ref('')
const savingOffline = ref(false)
const offlineError = ref('')

// ====== 事件监听 ======
let progressUnlisten: (() => void) | null = null

onMounted(async () => {
  await accountsStore.fetchAccounts()

  progressUnlisten = window.electronAPI?.account.onLoginProgress((payload: { stage: string; detail?: string }) => {
    handleLoginProgress(payload.stage, payload.detail)
  })
})

onUnmounted(() => {
  progressUnlisten?.()
})

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await accountsStore.fetchAccounts()
    }
  }
)

function close() {
  emit('update:visible', false)
}
function minimize() {
  window.electronAPI?.window?.minimize?.()
}

function handleLoginProgress(stage: string, detail?: string) {
  switch (stage) {
    case 'device_code':
      loginState.value = 'processing'
      loginProgressText.value = t('auth.fetchingDeviceCode')
      break
    case 'waiting_user': {
      try {
        const info = JSON.parse(detail || '{}')
        deviceCodeInfo.value = {
          userCode: info.userCode || '',
          verificationUri: info.verificationUri || 'https://microsoft.com/link',
          message: info.message || ''
        }
        loginState.value = 'waiting_user'
      } catch {
        loginState.value = 'waiting_user'
      }
      break
    }
    case 'token_received':
      loginState.value = 'processing'
      loginProgressText.value = t('auth.tokenReceivedVerifyingXbox')
      break
    case 'xbox_live':
      loginProgressText.value = detail || t('auth.connectingXboxLive')
      break
    case 'xsts':
      loginProgressText.value = detail || t('auth.fetchingXstsToken')
      break
    case 'minecraft':
      loginProgressText.value = detail || t('auth.verifyingMinecraft')
      break
    case 'profile':
      loginProgressText.value = detail || t('auth.fetchingProfile')
      break
    case 'saving':
      loginProgressText.value = t('auth.savingAccount')
      break
    case 'done':
      loginState.value = 'done'
      newAccountName.value = detail || ''
      break
    case 'error':
      loginState.value = 'error'
      loginError.value = detail || t('auth.loginFailedRetry')
      break
    case 'timeout':
      loginState.value = 'error'
      loginError.value = t('auth.deviceCodeExpired')
      break
    case 'cancelled':
      loginState.value = 'idle'
      break
  }
}

async function startMicrosoftLogin() {
  loginState.value = 'processing'
  loginProgressText.value = t('auth.initializing')
  loginError.value = ''
  newAccountName.value = ''
  codeCopied.value = false

  const result = await window.electronAPI?.account.loginMicrosoft()

  if (result && typeof result === 'object' && 'ok' in result && result.ok && 'data' in result && result.data) {
    newAccountName.value = result.data.name || t('auth.newAccount')
    loginState.value = 'done'
    await accountsStore.fetchAccounts()
  } else if (result && 'error' in result && result.error === 'LOGIN_CANCELLED') {
    loginState.value = 'idle'
  } else {
    loginState.value = 'error'
    loginError.value = result.error || t('auth.loginFailedRetry')
  }
}

async function cancelLogin() {
  await window.electronAPI?.account.cancelLogin()
  loginState.value = 'idle'
}

function closeOAuthModal() {
  loginState.value = 'idle'
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(deviceCodeInfo.value.userCode)
    codeCopied.value = true
    setTimeout(() => {
      codeCopied.value = false
    }, 2000)
  } catch {
    /* ignore */
  }
}

async function saveOffline() {
  offlineError.value = ''
  const name = offlineName.value.trim()
  if (!name || name.length < 2) {
    offlineError.value = t('auth.playerNameMinLength')
    return
  }
  savingOffline.value = true
  try {
    const result = await window.electronAPI?.account.loginOffline(name)
    if (result?.ok) {
      await accountsStore.fetchAccounts()
    } else {
      offlineError.value = result?.error || t('auth.saveFailed')
    }
  } catch (e: unknown) {
    offlineError.value = (e as Error).message || t('auth.saveFailed')
  } finally {
    savingOffline.value = false
  }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
</script>

<style scoped lang="scss">
/* ===== 抽屉主体 ===== */
.acc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9000;
  backdrop-filter: blur(1px);
  overflow: hidden;
}

.acc-window {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 420px;
  max-width: 100%;
  background: var(--voxver-bg-elevated);
  border-left: 1px solid var(--voxver-border-color, rgba(255, 255, 255, 0.08));
  display: flex;
  flex-direction: column;
  overflow: visible;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);
}

/* * ===== 标题栏 ===== */
.acc-header {
  height: 44px;
  background: var(--voxver-gradient-primary);
  display: flex;
  align-items: center;
  padding: 0 12px;
  flex-shrink: 0;
  gap: 10px;
}

.acc-back {
  background: none;
  border: none;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--voxver-radius-sm);
  display: flex;
  align-items: center;
  transition: all 0.15s;
  &:hover {
    background: var(--voxver-bg-hover);
    color: #fff;
  }
}

.acc-title {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}

.acc-wc {
  display: flex;
  gap: 4px;
}

.acc-wc-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--voxver-radius-sm);
  background: var(--voxver-bg-hover);
  color: var(--voxver-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  &:hover {
    background: var(--voxver-bg-hover);
    color: #fff;
  }
  &.acc-close:hover {
    background: #e81123;
  }
}

/* ===== 主体 ===== */
.acc-body {
  flex: 1;
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ===== 区块 ===== */
.acc-section {
  background: var(--voxver-bg-primary, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--voxver-border-color, rgba(255, 255, 255, 0.06));
  border-radius: 10px;
  overflow: visible;
  min-width: 0;
}

.acc-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--voxver-border-color, rgba(255, 255, 255, 0.06));
}

.acc-section-title {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
}

.acc-badge {
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--voxver-border-color, rgba(255, 255, 255, 0.1));
  background: var(--voxver-bg-hover);
  color: var(--voxver-text-muted);
  &.success {
    background: var(--voxver-bg-hover);
    color: var(--voxver-text-secondary);
  }
  &.default {
    background: var(--voxver-bg-hover);
    color: var(--voxver-text-muted);
  }
}

.acc-section-body {
  padding: 14px;

  &.acc-empty {
    text-align: center;
    .acc-empty-hint {
      margin: 0 0 12px;
      font-size: 12px;
      color: var(--voxver-text-secondary);
    }
  }
}

/* * ===== 资料行 ===== */
.acc-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--voxver-bg-hover);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  &.acc-profile-active {
    border-color: #22c55e;
  }
}

.acc-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00a4ef, #0078d4);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.acc-profile-info {
  flex: 1;
  min-width: 0;
  .acc-name {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .acc-uuid {
    margin: 2px 0 0;
    font-size: 10px;
    color: var(--voxver-text-muted);
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.acc-profile-actions {
  display: flex;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
}

/* ===== 表单 ===== */
.acc-form-group {
  margin-bottom: 12px;
  &:last-child {
    margin-bottom: 0;
  }
}

.acc-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--voxver-text-secondary);
  margin-bottom: 5px;
}

.acc-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--voxver-border-color, rgba(255, 255, 255, 0.1));
  border-radius: 7px;
  font-size: 13px;
  color: var(--voxver-text-primary);
  background: rgba(0, 0, 0, 0.2);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  &:focus {
    border-color: var(--voxver-primary-400);
  }
  &::placeholder {
    color: var(--voxver-text-muted);
  }
}

.acc-input-row {
  display: flex;
  gap: 6px;
  .acc-input {
    flex: 1;
  }
}

.acc-form-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.acc-error {
  font-size: 11px;
  color: var(--voxver-error);
}

/* * ===== 按钮 ===== */
.acc-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid var(--voxver-border-color, rgba(255, 255, 255, 0.1));
  background: var(--voxver-bg-hover);
  color: var(--voxver-text-secondary);
  &:hover {
    border-color: var(--voxver-primary-400);
    color: var(--voxver-primary-400);
  }
  &.acc-btn-danger {
    color: var(--voxver-error);
    &:hover {
      background: rgba(248, 113, 113, 0.1);
      border-color: #f87171;
    }
  }
}

.acc-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 18px;
  background: var(--voxver-primary);
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    background: var(--voxver-primary-hover);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.acc-btn-outline {
  display: inline-flex;
  align-items: center;
  padding: 7px 16px;
  border: 1px solid var(--voxver-border-color, rgba(255, 255, 255, 0.12));
  background: transparent;
  border-radius: 7px;
  font-size: 13px;
  cursor: pointer;
  color: var(--voxver-text-secondary);
  transition: all 0.15s;
  &:hover {
    border-color: currentColor;
  }
}

.acc-btn-ghost {
  padding: 7px 12px;
  border: 1px solid var(--voxver-border-color, rgba(255, 255, 255, 0.1));
  background: var(--voxver-bg-hover);
  color: var(--voxver-text-secondary);
  border-radius: 7px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  &:hover {
    border-color: var(--voxver-primary-400);
    color: var(--voxver-primary-400);
  }
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* ===== 提示框 ===== */
.acc-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #fef7e0;
  border-left: 3px solid #f9ab00;
  border-radius: 0 6px 6px 0;
  font-size: 11px;
  color: #776000;
  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
}

/* ===== 动画 ===== */
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: opacity 0.2s ease;
  .acc-window {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
}
.modal-slide-enter-from,
.modal-slide-leave-to {
  opacity: 0;
  .acc-window {
    transform: translateX(100%);
  }
}

/* * ===== OAuth 弹窗（复用 AccountPage 样式） ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.modal-card {
  background: var(--voxver-bg-elevated);
  border: 1px solid var(--voxver-border-color, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
  width: 420px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--voxver-border-color);
  .modal-title {
    font-size: 14px;
    font-weight: 700;
  }
  .modal-close {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--voxver-text-muted);
    padding: 2px 6px;
    border-radius: var(--voxver-radius-xs);
    &:hover {
      background: var(--voxver-bg-hover);
    }
  }
}

.modal-body {
  padding: 20px 18px;
  min-height: 120px;
}

.modal-footer {
  padding: 12px 18px;
  border-top: 1px solid var(--voxver-border-color);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* * Device Flow */
.device-flow {
  text-align: center;
}
.device-flow-hint {
  font-size: 13px;
  color: var(--voxver-text-secondary);
  margin: 0 0 10px;
}
.device-flow-link {
  display: inline-block;
  font-size: 14px;
  font-weight: 700;
  color: var(--voxver-primary);
  text-decoration: none;
  margin-bottom: 14px;
  &:hover {
    text-decoration: underline;
  }
}
.device-code-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}
.device-code {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 4px;
  color: var(--voxver-text-primary);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  padding: 6px 18px;
  font-family: 'Courier New', monospace;
}
.device-flow-tip {
  font-size: 12px;
  color: var(--voxver-text-muted);
  margin: 0 0 14px;
}
.loader-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--voxver-text-secondary);
  font-size: 12px;
}

/* Processing */
.processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  .processing-text {
    font-size: 13px;
    color: var(--voxver-text-secondary);
    margin: 0;
  }
}

/* Result */
.result-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  text-align: center;
  p {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }
  &.success p {
    color: #34a853;
  }
  &.error-box p {
    color: var(--voxver-error);
    font-size: 13px;
    font-weight: 400;
  }
}

/* * Loader */
.loader {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--voxver-border-color, rgba(255, 255, 255, 0.1));
  border-top-color: var(--voxver-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
  &.loader-lg {
    width: 32px;
    height: 32px;
    border-width: 3px;
  }
}

</style>
