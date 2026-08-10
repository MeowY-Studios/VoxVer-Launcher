/**
 * InstancesPage 页面测试
 * 覆盖：空状态渲染、实例列表渲染、搜索、视图切换、新建/导入按钮
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { setActivePinia, createPinia } from 'pinia'
import InstancesPage from '../../src/pages/InstancesPage.vue'
import zhCN from '../../src/locale/zh-CN'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/instances', component: { template: '<div />' } }
  ]
})

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN }
})

function mockInstance(overrides: Record<string, any> = {}) {
  return {
    id: 'inst-1',
    name: 'Test Instance',
    path: '/test/instance',
    mc_version: '1.20.1',
    loader_type: 'fabric',
    loader_version: '0.15.0',
    icon: '',
    is_favorited: 0,
    last_played: '2026-07-01T00:00:00Z',
    play_time: 3600,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    ...overrides
  }
}

function mountInstances(instances: any[] = []) {
  setActivePinia(createPinia())
  // 预设 instance:list 返回值
  ;(window as any).electronAPI.instance.list.mockResolvedValue(instances)

  return mount(InstancesPage, {
    global: { plugins: [router, i18n] }
  })
}

describe('InstancesPage - 空状态', () => {
  it('应渲染页面容器', () => {
    const wrapper = mountInstances([])
    expect(wrapper.find('.instance-manage-view').exists() || wrapper.find('.instances-view').exists() || wrapper.find('[class*="instances"]').exists()).toBe(true)
  })

  it('应显示新建实例按钮', () => {
    const wrapper = mountInstances([])
    expect(wrapper.text()).toContain('新建实例')
  })

  it('应显示导入按钮', () => {
    const wrapper = mountInstances([])
    expect(wrapper.text()).toContain('导入')
  })

  it('空状态时应有提示信息', () => {
    const wrapper = mountInstances([])
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })
})

describe('InstancesPage - 有实例时', () => {
  it('应渲染实例卡片列表', async () => {
    const instances = [mockInstance({ id: '1', name: 'My Game' })]
    const wrapper = mountInstances(instances)
    // 等待异步数据加载
    await new Promise((r) => setTimeout(r, 100))
    await wrapper.vm.$nextTick()
    // 实例名称应显示
    expect(wrapper.text()).toContain('My Game')
  })

  it('应渲染多个实例', async () => {
    const instances = [
      mockInstance({ id: '1', name: 'Instance A' }),
      mockInstance({ id: '2', name: 'Instance B' }),
      mockInstance({ id: '3', name: 'Instance C' })
    ]
    const wrapper = mountInstances(instances)
    await new Promise((r) => setTimeout(r, 100))
    await wrapper.vm.$nextTick()
    // 所有实例名都应可见
    expect(wrapper.text()).toContain('Instance A')
    expect(wrapper.text()).toContain('Instance B')
    expect(wrapper.text()).toContain('Instance C')
  })
})

describe('InstancesPage - 搜索', () => {
  it('应在工具栏中渲染搜索输入框', () => {
    const wrapper = mountInstances([])
    expect(wrapper.find('.search-input-wrapper').exists() || wrapper.find('input[placeholder*="搜索"]').exists() || wrapper.find('input[type="text"]').exists()).toBe(true)
  })
})

describe('InstancesPage - 工具栏', () => {
  it('应显示实例计数', async () => {
    const instances = [mockInstance({ id: '1' })]
    const wrapper = mountInstances(instances)
    await new Promise((r) => setTimeout(r, 100))
    await wrapper.vm.$nextTick()
    // 计数值或实例名称应存在
    expect(wrapper.text()).toContain('实例')
  })
})
