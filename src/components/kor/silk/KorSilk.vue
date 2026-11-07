<script setup lang="ts">
/**
 * Kor 丝绸/水波层（对应 Koring silk/Silk.tsx）。
 *
 * 原版是 three.js 的 WebGL shader；本项目不引入 three 依赖，
 * 这里用多层斜向渐变 + 模糊 + 缓慢位移做近似。
 * props 语义与原版一致，将来若换真 shader 只需替换内部实现。
 */
withDefaults(
  defineProps<{
    speed?: number
    scale?: number
    rotation?: number
    noiseIntensity?: number
    color?: string
  }>(),
  { speed: 3, scale: 1.2, rotation: 0.3, noiseIntensity: 1.2 }
)
</script>

<template>
  <div
    class="kor-silk"
    aria-hidden="true"
    :style="{
      '--kor-silk-speed': `${16 / Math.max(0.1, speed)}s`,
      '--kor-silk-scale': scale,
      '--kor-silk-rotation': `${rotation}deg`,
      '--kor-silk-noise': noiseIntensity
    }"
  >
    <span class="kor-silk__layer kor-silk__layer--a" />
    <span class="kor-silk__layer kor-silk__layer--b" />
    <span class="kor-silk__glow" />
  </div>
</template>

<style scoped>
.kor-silk {
  position: absolute;
  inset: -30%;
  overflow: hidden;
  pointer-events: none;
  mix-blend-mode: soft-light;
  opacity: 0.78;
}

.kor-silk__layer {
  position: absolute;
  inset: 0;
  background-repeat: repeat;
  filter: blur(16px);
}

.kor-silk__layer--a {
  background-image: repeating-linear-gradient(
    112deg,
    rgba(255, 255, 255, 0.62) 0px,
    rgba(255, 255, 255, 0.42) 26px,
    transparent 46px,
    transparent 104px
  );
  background-size: calc(120px * var(--kor-silk-scale, 1.2)) 100%;
  animation: kor-silk-drift-a var(--kor-silk-speed, 5s) linear infinite;
}

.kor-silk__layer--b {
  background-image: repeating-linear-gradient(
    76deg,
    rgba(255, 255, 255, 0.4) 0px,
    rgba(255, 255, 255, 0.22) 40px,
    transparent 70px,
    transparent 168px
  );
  background-size: calc(160px * var(--kor-silk-scale, 1.2)) 100%;
  opacity: calc(0.5 * var(--kor-silk-noise, 1.2));
  animation: kor-silk-drift-b calc(var(--kor-silk-speed, 5s) * 1.6) linear infinite reverse;
}

.kor-silk__glow {
  position: absolute;
  inset: 10% 0 auto 20%;
  height: 70%;
  background: radial-gradient(50% 60% at 50% 40%, rgba(255, 255, 255, 0.35), transparent 70%);
  filter: blur(18px);
}

@keyframes kor-silk-drift-a {
  from {
    transform: translate3d(-2%, -1%, 0) rotate(calc(var(--kor-silk-rotation, 0deg) * 0.2));
  }
  to {
    transform: translate3d(2%, 1%, 0) rotate(var(--kor-silk-rotation, 0deg));
  }
}

@keyframes kor-silk-drift-b {
  from {
    transform: translate3d(1%, 2%, 0);
  }
  to {
    transform: translate3d(-1%, -2%, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kor-silk__layer {
    animation: none !important;
  }
}
</style>
