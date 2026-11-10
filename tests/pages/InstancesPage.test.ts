/**
 * InstancesPage 页面测试
 * 实例页在 Koring 排版下改为「左目录 + 右版本卡片」，数据来自设置里的游戏目录。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'
import InstancesPage from '../../src/pages/InstancesPage.vue'
import zhCN from '../../src/locale/zh-CN'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/instances', component: { template: '<div />' } }]
})

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN }
})

const GAME_DIR = 'E:/MC/Zombie100/.minecraft'

function mockApi(versions: Array<Record<string, unknown>>) {
  window.electronAPI = {
    folders: {
      list: vi.fn(async () => [GAME_DIR]),
      add: vi.fn(async () => true)
    },
    versions: {
      scanFolder: vi.fn(async () => ({ ok: true, data: versions }))
    },
    path: { getMinecraft: vi.fn(async () => GAME_DIR) },
    config: { get: vi.fn(async () => null), set: vi.fn(async () => true) },
    instance: { list: vi.fn(async () => []) }
  } as never
}

function mountInstances() {
  setActivePinia(createPinia())
  return mount(InstancesPage, {
    global: {
      plugins: [router, i18n],
      stubs: { 'router-link': true }
    }
  })
}

describe('InstancesPage', () => {
  beforeEach(() => {
    localStorage.clear()
    mockApi([
      { id: '1.18.2', name: '1.18.2', baseVersion: '1.18.2' },
      {
        id: '1.18.2-forge-40.3.12',
        name: '1.18.2-forge-40.3.12',
        baseVersion: '1.18.2',
        loaderInfo: 'Forge 40.3.12'
      }
    ])
  })

  it('应渲染页面容器', () => {
    const wrapper = mountInstances()
    expect(wrapper.find('.instances-page').exists()).toBe(true)
  })

  it('应显示配置里的游戏目录', async () => {
    const wrapper = mountInstances()
    await flushPromises()
    const folders = wrapper.findAll('.inst-folder')
    expect(folders.length).toBe(1)
    expect(folders[0].text()).toContain('Zombie100')
  })

  it('同一安装链应合并成一张卡片并显示完整名称', async () => {
    const wrapper = mountInstances()
    await flushPromises()
    const cards = wrapper.findAll('.inst-card')
    expect(cards.length).toBe(1)
    expect(cards[0].find('.inst-card__name').text()).toBe('1.18.2-forge-40.3.12')
  })
})
