<template>
  <div class="skin-viewer">
    <div
      v-if="skin"
      class="skin-scene"
      :class="{ dragging: isDragging }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerUp"
    >
      <div class="skin-model" :style="modelStyle">
        <div v-for="(part, i) in parts" :key="i" class="skin-part" :style="part.wrapperStyle">
          <div v-for="(face, j) in part.faces" :key="j" class="skin-face" :style="face" />
        </div>
      </div>
    </div>
    <div v-else class="skin-empty">{{ $t('auth.noSkin') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Minecraft 皮肤 3D 展示（纯 CSS 3D 立方体贴图）
 * 交互：拖拽手动转向；无操作 1.5s 后恢复自动旋转
 */
const props = defineProps<{ skin: string }>()

// * 缩放：1 皮肤像素 = 8 屏幕像素（模型 128x256）
const S = 8

// * ====== 旋转状态 ======
const rotX = ref(-12)
const rotY = ref(0)
const isDragging = ref(false)
let lastInteractAt = 0
let dragStartX = 0
let dragStartY = 0
let dragStartRotX = 0
let dragStartRotY = 0
let rafId = 0

const modelStyle = computed(() => ({
  transform: `rotateX(${rotX.value}deg) rotateY(${rotY.value}deg)`
}))

function onPointerDown(e: PointerEvent) {
  isDragging.value = true
  lastInteractAt = Date.now()
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragStartRotX = rotX.value
  dragStartRotY = rotY.value
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  rotY.value = dragStartRotY + (e.clientX - dragStartX) * 0.6
  // * 俯仰限制在合理范围，避免模型翻转
  rotX.value = Math.min(30, Math.max(-70, dragStartRotX - (e.clientY - dragStartY) * 0.4))
  lastInteractAt = Date.now()
}

function onPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false
  lastInteractAt = Date.now()
}

// * 自动旋转：仅在未拖拽且距上次交互超过 1.5s 时推进
function tick() {
  if (!isDragging.value && Date.now() - lastInteractAt > 1500) {
    rotY.value = (rotY.value + 0.35) % 360
  }
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  rafId = requestAnimationFrame(tick)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
})

interface FaceStyle {
  width: string
  height: string
  left: string
  top: string
  transform: string
  backgroundImage: string
  backgroundSize: string
  backgroundPosition: string
}

interface Part {
  wrapperStyle: { left: string; top: string; width: string; height: string }
  faces: FaceStyle[]
}

/**
 * 按 MC 贴图盒规范生成长方体
 * @param cx 盒中心 x（格单位） @param cy 盒中心 y（格单位）
 * @param w/h/d 盒尺寸（格单位） @param ox/oy 贴图源区域左上角
 */
function buildPart(
  cx: number,
  cy: number,
  w: number,
  h: number,
  d: number,
  ox: number,
  oy: number,
  skin: string
): Part {
  const face = (
    fw: number,
    fh: number,
    sx: number,
    sy: number,
    left: number,
    top: number,
    transform: string
  ): FaceStyle => ({
    width: `${fw * S}px`,
    height: `${fh * S}px`,
    left: `${left}px`,
    top: `${top}px`,
    transform,
    backgroundImage: `url("${skin}")`,
    backgroundSize: `${64 * S}px ${64 * S}px`,
    backgroundPosition: `-${sx * S}px -${sy * S}px`
  })

  const z = (n: number) => `${(n * S) / 2}px`
  const faces: FaceStyle[] = [
    // * 顶/底（宽 w 深 d，rotateX 立起）
    face(w, d, ox + d, oy, 0, ((h - d) / 2) * S, `rotateX(90deg) translateZ(${z(h)})`),
    face(w, d, ox + d + w, oy, 0, ((h - d) / 2) * S, `rotateX(-90deg) translateZ(${z(h)})`),
    // * 前/后（宽 w 高 h）
    face(w, h, ox + d, oy + d, 0, 0, `translateZ(${z(d)})`),
    face(w, h, ox + 2 * d + w, oy + d, 0, 0, `rotateY(180deg) translateZ(${z(d)})`),
    // * 右/左（深 d 高 h，rotateY 立起）
    face(d, h, ox, oy + d, ((w - d) / 2) * S, 0, `rotateY(90deg) translateZ(${z(w)})`),
    face(d, h, ox + d + w, oy + d, ((w - d) / 2) * S, 0, `rotateY(-90deg) translateZ(${z(w)})`)
  ]

  return {
    wrapperStyle: {
      left: `${(cx - w / 2) * S}px`,
      top: `${(cy - h / 2) * S}px`,
      width: `${w * S}px`,
      height: `${h * S}px`
    },
    faces
  }
}

// * 六个部位（格单位，模型空间 16x32，z 中心均为 0）
const parts = computed<Part[]>(() => {
  const skin = props.skin
  if (!skin) return []
  return [
    buildPart(8, 4, 8, 8, 8, 0, 0, skin), // 头
    buildPart(8, 14, 8, 12, 4, 16, 16, skin), // 身体
    buildPart(2, 14, 4, 12, 4, 40, 16, skin), // 右臂
    buildPart(14, 14, 4, 12, 4, 32, 48, skin), // 左臂
    buildPart(6, 26, 4, 12, 4, 0, 16, skin), // 右腿
    buildPart(10, 26, 4, 12, 4, 16, 48, skin) // 左腿
  ]
})
</script>

<style scoped>
.skin-viewer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  min-height: 300px;
}

.skin-scene {
  width: 160px;
  height: 280px;
  perspective: 640px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.skin-scene.dragging {
  cursor: grabbing;
}

.skin-model {
  position: relative;
  width: 128px;
  height: 256px;
  transform-style: preserve-3d;
}

.skin-part {
  position: absolute;
  transform-style: preserve-3d;
}

.skin-face {
  position: absolute;
  image-rendering: pixelated;
  backface-visibility: hidden;
  pointer-events: none;
}

.skin-empty {
  color: var(--voxver-text-muted);
  font-size: 13px;
}
</style>
