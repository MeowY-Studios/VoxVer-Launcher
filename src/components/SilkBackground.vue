<template>
  <canvas ref="canvasRef" class="silk-canvas" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 波纹主色（任意 CSS 颜色，如 var() / oklch()） */
    colorA?: string
    /** 波纹辅色（暗部） */
    colorB?: string
    /** 流动速度 */
    speed?: number
    /** 波纹密度 */
    scale?: number
  }>(),
  {
    colorA: '#14b8a6',
    colorB: '#0b3f46',
    speed: 1,
    scale: 1.6
  }
)

const canvasRef = ref<HTMLCanvasElement | null>(null)

let gl: WebGLRenderingContext | null = null
let program: WebGLProgram | null = null
let rafId = 0
let resizeObserver: ResizeObserver | null = null
let startTime = 0
let running = false

/** 将 CSS 颜色字符串解析为 [r, g, b]（0~1），复用浏览器样式系统以支持 oklch/var */
function parseCssColor(input: string): [number, number, number] {
  const el = document.createElement('span')
  el.style.display = 'none'
  el.style.color = input
  document.body.appendChild(el)
  const computed = getComputedStyle(el).color
  el.remove()
  const m = /rgba?\(([^)]+)\)/.exec(computed)
  if (!m) return [0.08, 0.72, 0.65]
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()))
  return [parts[0] / 255, parts[1] / 255, parts[2] / 255]
}

const VERTEX_SRC = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

// 丝绸波纹片元着色器：fbm 噪声扰动 + 双向正弦波带，双色混合
const FRAGMENT_SRC = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform vec3 uColorA;
uniform vec3 uColorB;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  const float K1 = 0.366025404;
  const float K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  float m = step(a.y, a.x);
  vec2 o = vec2(m, 1.0 - m);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(dot(a, hash2(i)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));
  return dot(n, vec3(70.0));
}

float fbm(vec2 p) {
  float total = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    total += amp * noise(p);
    p = rot * p * 2.02;
    amp *= 0.5;
  }
  return total;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float speed = uSpeed * 0.2;
  float t = uTime * speed;

  vec2 p = vec2(uv.x * uScale * 1.2, uv.y * uScale * 1.8);
  // 两级域扭曲：fbm 相互偏移，形成丝滑的流动丝带
  float q = fbm(p + vec2(t * 0.30, -t * 0.18));
  float r = fbm(p + 4.7 + q * 1.8 + vec2(-t * 0.22, t * 0.14));

  float band = 0.5 + 0.5 * sin(p.x * 1.2 + p.y * 2.6 + r * 4.2 + t * 0.5);
  band = pow(band, 1.35);

  // 顶部提亮，底部压暗，贴近横幅渐变观感
  float light = 0.82 + 0.38 * uv.y;
  vec3 color = mix(uColorB, uColorA, band * 0.75 + q * 0.25);
  color *= light;
  color *= 0.90 + 0.10 * r;
  gl_FragColor = vec4(color, 1.0);
}
`

function compileShader(type: number, src: string): WebGLShader | null {
  if (!gl) return null
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[silk] shader compile failed:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function resize(): void {
  const canvas = canvasRef.value
  if (!canvas || !gl) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
  const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
    gl.viewport(0, 0, w, h)
  }
}

function frame(now: number): void {
  if (!running || !gl || !program) return
  resize()
  gl.uniform1f(gl.getUniformLocation(program, 'uTime'), (now - startTime) / 1000)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  rafId = requestAnimationFrame(frame)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  gl = canvas.getContext('webgl', { antialias: false, alpha: false })
  if (!gl) return

  const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SRC)
  const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SRC)
  if (!vs || !fs) return
  const prog = gl.createProgram()
  if (!prog) return
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[silk] program link failed:', gl.getProgramInfoLog(prog))
    return
  }
  program = prog
  gl.useProgram(prog)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const colorA = parseCssColor(props.colorA)
  const colorB = parseCssColor(props.colorB)
  gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), canvas.width, canvas.height)
  gl.uniform1f(gl.getUniformLocation(prog, 'uSpeed'), props.speed)
  gl.uniform1f(gl.getUniformLocation(prog, 'uScale'), props.scale)
  gl.uniform3f(gl.getUniformLocation(prog, 'uColorA'), colorA[0], colorA[1], colorA[2])
  gl.uniform3f(gl.getUniformLocation(prog, 'uColorB'), colorB[0], colorB[1], colorB[2])

  startTime = performance.now()
  running = true
  rafId = requestAnimationFrame(frame)

  resizeObserver = new ResizeObserver(() => resize())
  resizeObserver.observe(canvas)
})

onUnmounted(() => {
  running = false
  cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  program = null
  gl = null
})
</script>

<style scoped lang="scss">
.silk-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
