import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './locale/i18n'
import { setI18n } from './utils/i18n'

// * VoxVer Design System
import './styles/tokens.scss'
import './styles/global.scss'
import './styles/vox-controls.scss'
import './styles/animations.scss'
import './styles/app.scss'
import './styles/themes/dark.scss'
import './styles/themes/light.scss'

// * 注入 SVG 图标 Sprite 到 DOM（供全局 <use xlink:href="#pc-icon-xxx"> 引用）
import iconSpriteRaw from './styles/voxver-icons.svg?raw'
const spriteContainer = document.getElementById('svg-sprite')
if (spriteContainer) {
  spriteContainer.innerHTML = iconSpriteRaw
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
setI18n(i18n.global)
app.mount('#app')
