<template>
  <PxModal
    :model-value="modelValue"
    :title="$t('component.receiveInstance')"
    size="md"
    :closable="stage !== 'transferring'"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="onClose"
  >
    <div class="receive-modal">
      <!-- 输入分享码 -->
      <div v-if="stage === 'input'" class="receive-stage">
        <div class="receive-stage-title">{{ $t('component.enterShareCode') }}</div>
        <div class="receive-stage-subtitle">{{ $t('component.getShareCode') }}</div>

        <div class="receive-code-input">
          <div class="receive-code-digits">
            <input
              v-for="i in 6"
              :key="i"
              ref="codeInputRefs"
              type="text"
              maxlength="1"
              class="receive-code-digit"
              :class="{ 'receive-code-digit--filled': shareCodeDigits[i - 1] }"
              v-model="shareCodeDigits[i - 1]"
              @input="onCodeInput(i - 1)"
              @keydown="onCodeKeydown($event, i - 1)"
              @paste="onCodePaste"
            />
          </div>
        </div>
      </div>

      <!-- 连接中 -->
      <div v-else-if="stage === 'connecting'" class="receive-stage">
        <div class="receive-stage-title">{{ $t('component.connecting') }}</div>
        <div class="receive-stage-subtitle">{{ $t('component.establishingP2P') }}</div>
      </div>

      <!-- 传输中 -->
      <div v-else-if="stage === 'transferring'" class="receive-stage">
        <div class="receive-stage-title">{{ $t('component.receiving') }}</div>
        <div class="receive-stage-subtitle">
          {{ instanceName || $t('instance.instance') }}
          <br />
          {{ transferredChunks }} / {{ totalChunks }} {{ $t('component.chunksProgress', { transferred: transferredChunks, total: totalChunks }) }} ({{ formatSpeed(bytesPerSecond) }} - {{ $t('component.remainingTime', { time: formatTime(estimatedRemaining) }) }})
        </div>
        <PxProgress
          :value="transferProgress"
          class="receive-progress"
          :indeterminate="totalChunks === 0"
        />
      </div>

      <!-- 完成 -->
      <div v-else-if="stage === 'completed'" class="receive-stage">
        <div class="receive-stage-title">{{ $t('component.receiveComplete') }}</div>
        <div class="receive-stage-subtitle">{{ $t('component.instanceReceived', { name: instanceName || $t('instance.instance') }) }}</div>
        <div class="receive-info">
          <div class="receive-info-item">
            <span class="receive-info-label">{{ $t('component.mcVersion') }}</span>
            <span class="receive-info-value">{{ mcVersion || '-' }}</span>
          </div>
          <div class="receive-info-item">
            <span class="receive-info-label">{{ $t('component.loader') }}</span>
            <span class="receive-info-value">{{ loaderTypeText }}</span>
          </div>
        </div>
      </div>

      <!-- 错误 -->
      <div v-else-if="stage === 'error'" class="receive-stage">
        <div class="receive-stage-title">{{ $t('component.receiveFailed') }}</div>
        <div class="receive-stage-subtitle receive-error">
          {{ errorMessage || $t('component.unknownError') }}
        </div>
      </div>
    </div>

    <template #footer>
      <button v-if="stage === 'input'" class="px-btn px-btn--secondary" @click="close">{{ $t('common.cancel') }}</button>
      <button
        v-if="stage === 'input'"
        class="px-btn px-btn--primary"
        :disabled="!canStartReceive"
        @click="startReceive"
      >
        {{ $t('component.startReceive') }}
      </button>

      <button v-if="stage === 'connecting'" class="px-btn px-btn--secondary" @click="cancelReceive">
        {{ $t('common.cancel') }}
      </button>

      <button v-if="stage === 'completed'" class="px-btn px-btn--secondary" @click="close">
        {{ $t('component.laterImport') }}
      </button>
      <button
        v-if="stage === 'completed'"
        class="px-btn px-btn--primary"
        @click="importInstance"
        :disabled="importing"
      >
        {{ importing ? $t('component.importing') : $t('component.importNow') }}
      </button>

      <button v-if="stage === 'error'" class="px-btn px-btn--secondary" @click="resetToInput">
        {{ $t('component.retry') }}
      </button>
      <button v-if="stage === 'error'" class="px-btn px-btn--primary" @click="close">{{ $t('common.close') }}</button>
    </template>
  </PxModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import PxModal from '../common/PxModal.vue'
import PxProgress from '../common/PxProgress.vue'
import type { ShareSession } from '../../types/ipc'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  initialShareCode?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  imported: [instanceId: string]
}>()

type Stage = 'idle' | 'input' | 'connecting' | 'transferring' | 'completed' | 'error'

const stage = ref<Stage>('idle')
const sessionId = ref('')
const shareCodeDigits = ref<string[]>(['', '', '', '', '', ''])
const codeInputRefs = ref<HTMLInputElement[]>([])
const transferredChunks = ref(0)
const totalChunks = ref(0)
const bytesPerSecond = ref(0)
const estimatedRemaining = ref(0)
const instanceName = ref('')
const mcVersion = ref('')
const loaderType = ref('')
const errorMessage = ref('')
const importing = ref(false)

const canStartReceive = computed(() => {
  return shareCodeDigits.value.every((d) => d.length > 0)
})

const transferProgress = computed(() => {
  if (totalChunks.value === 0) return 0
  return (transferredChunks.value / totalChunks.value) * 100
})

const loaderTypeText = computed(() => {
  const map: Record<string, string> = {
    vanilla: 'Vanilla',
    forge: 'Forge',
    fabric: 'Fabric',
    neoforge: 'NeoForge',
    quilt: 'Quilt'
  }
  return map[loaderType.value] || loaderType.value || '-'
})

function formatSpeed(bytes: number): string {
  if (bytes < 1024) return `${bytes} B/s`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} 秒`
  return `${Math.round(seconds / 60)} 分钟`
}

function onCodeInput(index: number) {
  const digit = shareCodeDigits.value[index]
  if (digit.length > 0 && index < 5) {
    nextTick(() => {
      codeInputRefs.value[index + 1]?.focus()
    })
  }
}

function onCodeKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace' && !shareCodeDigits.value[index] && index > 0) {
    shareCodeDigits.value[index - 1] = ''
    nextTick(() => {
      codeInputRefs.value[index - 1]?.focus()
    })
  } else if (event.key === 'Enter' && canStartReceive.value) {
    startReceive()
  }
}

function onCodePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text') || ''
  const digits = text.replace(/\D/g, '').slice(0, 6).split('')
  for (let i = 0; i < 6; i++) {
    shareCodeDigits.value[i] = digits[i] || ''
  }
}

function close() {
  emit('update:modelValue', false)
}

function onClose() {
  if (stage.value === 'transferring') {
    return
  }
  cancelReceive()
}

function cancelReceive() {
  if (sessionId.value) {
    window.electronAPI.share.closeSession(sessionId.value)
  }
  stage.value = 'input'
  sessionId.value = ''
}

function resetToInput() {
  stage.value = 'input'
  sessionId.value = ''
  errorMessage.value = ''
  shareCodeDigits.value = ['', '', '', '', '', '']
  nextTick(() => {
    codeInputRefs.value[0]?.focus()
  })
}

async function startReceive() {
  const code = shareCodeDigits.value.join('')
  if (code.length !== 6) return

  stage.value = 'connecting'
  errorMessage.value = ''

  try {
    const result = await window.electronAPI.share.receiveInstance(code)
    sessionId.value = result.sessionId
  } catch (e: any) {
    stage.value = 'error'
    errorMessage.value = e.message || '连接失败'
  }
}

async function importInstance() {
  if (!sessionId.value) return

  importing.value = true
  try {
    const result = await window.electronAPI.share.importReceived(sessionId.value)
    if (result.ok && result.instanceId) {
      emit('imported', result.instanceId)
      close()
    } else {
      errorMessage.value = result.error || '导入失败'
    }
  } catch (e: any) {
    errorMessage.value = e.message || '导入失败'
  } finally {
    importing.value = false
  }
}

function handleSessionUpdate(_event: Event, data: { sessionId: string; session: ShareSession }) {
  if (data.sessionId !== sessionId.value) return

  const s = data.session
  transferredChunks.value = s.transferredChunks
  totalChunks.value = s.totalChunks
  instanceName.value = s.instanceName || ''
  mcVersion.value = s.mcVersion || ''
  loaderType.value = s.loaderType || ''

  if (s.status === 'connecting') {
    stage.value = 'connecting'
  } else if (s.status === 'transferring') {
    stage.value = 'transferring'
  } else if (s.status === 'completed') {
    stage.value = 'completed'
  } else if (s.status === 'error') {
    stage.value = 'error'
    errorMessage.value = s.error || '接收失败'
  }
}

function handleProgressUpdate(
  _event: Event,
  data: {
    sessionId: string
    progress: {
      transferredChunks: number
      totalChunks: number
      bytesPerSecond: number
      estimatedRemaining: number
    }
  }
) {
  if (data.sessionId !== sessionId.value) return
  transferredChunks.value = data.progress.transferredChunks
  totalChunks.value = data.progress.totalChunks
  bytesPerSecond.value = data.progress.bytesPerSecond
  estimatedRemaining.value = data.progress.estimatedRemaining
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (props.initialShareCode) {
        const digits = props.initialShareCode.slice(0, 6).split('')
        for (let i = 0; i < 6; i++) {
          shareCodeDigits.value[i] = digits[i] || ''
        }
        if (canStartReceive.value) {
          startReceive()
        } else {
          stage.value = 'input'
        }
      } else {
        stage.value = 'input'
        nextTick(() => {
          codeInputRefs.value[0]?.focus()
        })
      }
    } else {
      stage.value = 'idle'
      sessionId.value = ''
      shareCodeDigits.value = ['', '', '', '', '', '']
      transferredChunks.value = 0
      totalChunks.value = 0
      instanceName.value = ''
      mcVersion.value = ''
      loaderType.value = ''
      errorMessage.value = ''
    }
  }
)

onMounted(() => {
  window.electronAPI?.share?.onSessionUpdate?.(handleSessionUpdate)
  window.electronAPI?.share?.onProgressUpdate?.(handleProgressUpdate)
})

onUnmounted(() => {
  window.electronAPI?.share?.removeSessionUpdateListener?.(handleSessionUpdate)
  window.electronAPI?.share?.removeProgressUpdateListener?.(handleProgressUpdate)
})
</script>

<style scoped>
.receive-modal {
  text-align: center;
}

.receive-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.receive-stage-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.receive-stage-subtitle {
  font-size: 13px;
  color: var(--voxver-text-secondary);
  margin-bottom: 16px;
  line-height: 1.6;
}

.receive-error {
  color: #ef4444;
}

.receive-progress {
  width: 100%;
  max-width: 320px;
  margin-top: 8px;
}

.receive-code-input {
  width: 100%;
  max-width: 320px;
}

.receive-code-digits {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.receive-code-digit {
  width: 44px;
  height: 56px;
  background: var(--voxver-bg-tertiary);
  border: 2px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--voxver-text-primary);
  font-family: 'Press Start 2P', monospace;
  outline: none;
  transition: all var(--voxver-transition-fast);
}
.receive-code-digit:focus {
  border-color: var(--voxver-primary-color);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.2);
}
.receive-code-digit--filled {
  border-color: var(--voxver-primary-color);
  background: rgb(59 130 246 / 0.08);
}

.receive-info {
  background: var(--voxver-bg-tertiary);
  border-radius: var(--voxver-radius-md);
  padding: 12px 16px;
  width: 100%;
  max-width: 320px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.receive-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.receive-info-label {
  font-size: 12px;
  color: var(--voxver-text-tertiary);
}

.receive-info-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}
</style>
