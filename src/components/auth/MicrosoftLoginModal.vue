<template>
  <!-- ===== Microsoft OAuth Device Flow 弹窗 ===== -->
  <Teleport to="body">
    <div class="modal-overlay" v-if="loginState !== 'idle'" @click.self="cancelLogin">
      <div class="modal-card vox-card">
        <!-- 标题栏 -->
        <div class="modal-header">
          <span class="modal-title">{{ $t('auth.signInWithMicrosoft') }}</span>
          <button class="modal-close" @click="cancelLogin">✕</button>
        </div>

        <!-- 内容区 -->
        <div class="modal-body">
          <!-- 等待用户访问链接阶段 -->
          <template v-if="loginState === 'waiting_user'">
            <div class="device-flow">
              <p class="device-flow-hint">{{ $t('auth.deviceFlowHint') }}</p>
              <div class="device-code-box">
                <span class="device-code">{{ deviceCodeInfo.userCode }}</span>
                <button class="vox-btn" @click="copyCode">
                  {{ codeCopied ? $t('common.copied') : $t('auth.copyAndOpenBrowser') }}
                </button>
              </div>
              <p class="device-flow-tip">{{ $t('auth.deviceFlowTip') }}</p>
              <div class="loader-row">
                <span class="loader"></span>
                <span class="loader-text">{{ $t('auth.waitingAuthorization') }}</span>
              </div>
            </div>
          </template>

          <!-- 处理中阶段 -->
          <template v-else-if="loginState === 'processing'">
            <div class="processing">
              <span class="loader loader-lg"></span>
              <p class="processing-text">{{ loginProgressText }}</p>
            </div>
          </template>

          <!-- 成功阶段 -->
          <template v-else-if="loginState === 'done'">
            <div class="result-box success">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--voxver-success)"
                stroke-width="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <p>{{ $t('auth.loginSuccess') }} {{ newAccountName }}！</p>
            </div>
          </template>

          <!-- 错误阶段 -->
          <template v-else-if="loginState === 'error'">
            <div class="result-box error-box">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--voxver-error)"
                stroke-width="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{{ loginError }}</p>
              <button class="vox-btn vox-btn--primary" style="margin-top: 12px" @click="startLogin">
                {{ $t('common.retry') }}
              </button>
            </div>
          </template>
        </div>

        <!-- 底部按钮 -->
        <div class="modal-footer">
          <button v-if="loginState === 'done'" class="vox-btn vox-btn--primary" @click="closeModal">
            {{ $t('common.finish') }}
          </button>
          <button v-else-if="loginState === 'error'" class="vox-btn" @click="closeModal">
            {{ $t('common.close') }}
          </button>
          <button v-else class="vox-btn" @click="cancelLogin">{{ $t('common.cancel') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Microsoft 登录弹窗（Device Flow）
 * v-model 控制打开：置 true 时自动开始登录流程；登录成功后 emit loggedIn
 */
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  loggedIn: [name: string]
}>()

const { t } = useI18n()

// * ====== 登录流程状态 ======
type LoginState = 'idle' | 'waiting_user' | 'processing' | 'done' | 'error'
const loginState = ref<LoginState>('idle')
const loginProgressText = ref('')
const loginError = ref('')
const newAccountName = ref('')
const deviceCodeInfo = ref({ userCode: '', verificationUri: '', message: '' })
const codeCopied = ref(false)

// * 打开弹窗时自动开始登录
watch(
  () => props.modelValue,
  (open) => {
    if (open) void startLogin()
  }
)

// * ====== 监听登录进度推送 ======
let progressUnlisten: (() => void) | null = null

onMounted(() => {
  progressUnlisten = window.electronAPI?.account.onLoginProgress((payload) => {
    // * 仅处理本实例打开的登录流程，避免多实例间串扰
    if (!props.modelValue) return
    handleLoginProgress(payload.stage, payload.detail)
  })
})

onUnmounted(() => {
  progressUnlisten?.()
})

// * ====== 处理进度事件 ======
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

// * ====== 开始 Microsoft 登录 ======
async function startLogin() {
  loginState.value = 'processing'
  loginProgressText.value = t('auth.initializing')
  loginError.value = ''
  newAccountName.value = ''
  codeCopied.value = false

  const result = await window.electronAPI?.account.loginMicrosoft()

  if (result?.ok && result.data) {
    newAccountName.value = result.data.name || t('auth.newAccount')
    loginState.value = 'done'
    emit('loggedIn', newAccountName.value)
  } else if (result?.error === 'LOGIN_CANCELLED') {
    loginState.value = 'idle'
    emit('update:modelValue', false)
  } else {
    loginState.value = 'error'
    loginError.value = result?.error || t('auth.loginFailedRetry')
  }
}

// * ====== 取消登录 ======
async function cancelLogin() {
  await window.electronAPI?.account.cancelLogin()
  loginState.value = 'idle'
  emit('update:modelValue', false)
}

function closeModal() {
  loginState.value = 'idle'
  emit('update:modelValue', false)
}

// * ====== 复制设备码并打开浏览器 ======
async function copyCode() {
  try {
    await navigator.clipboard.writeText(deviceCodeInfo.value.userCode)
    codeCopied.value = true
    setTimeout(() => {
      codeCopied.value = false
    }, 2000)
  } catch {
    // ! 不支持 clipboard，继续打开浏览器
  }
  // * 直接用 window.open 打开浏览器，不依赖主进程
  window.open(deviceCodeInfo.value.verificationUri, '_blank')
}
</script>

<style scoped>
/* * ====== OAuth 弹窗 ====== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--voxver-z-overlay);
  backdrop-filter: blur(2px);
}

.modal-card {
  width: 420px;
  max-width: calc(100vw - 32px);
  border: 1px solid var(--voxver-border-color);
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
    color: var(--voxver-text-primary);
  }
  .modal-close {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--voxver-text-muted);
    padding: 2px 6px;
    border-radius: var(--voxver-radius-xs);
    line-height: 1;

    &:hover {
      background: color-mix(in oklab, var(--voxver-text) 8%, transparent);
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

/* * ====== Device Flow 内容 ====== */
.device-flow {
  text-align: center;

  .device-flow-hint {
    font-size: 13px;
    color: var(--voxver-text-secondary);
    margin: 0 0 10px;
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
    font-family: 'Courier New', monospace;
    background: color-mix(in oklab, var(--voxver-text) 6%, transparent);
    border: 1px solid var(--voxver-border-color);
    border-radius: var(--voxver-radius-md);
    padding: 6px 18px;
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
}

/* * ====== 处理中 ====== */
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

/* * ====== 结果 ====== */
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
    color: var(--voxver-success);
  }
  &.error-box p {
    color: var(--voxver-error);
    font-size: 13px;
    font-weight: 400;
  }
}

/* * ====== Loading Spinner ====== */
.loader {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--voxver-border-color);
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
