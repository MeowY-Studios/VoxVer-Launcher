/**
 * KorPageShell 测试
 * 覆盖：默认选中第一项、点击切换并发出 update:modelValue、动作项不切换、
 *       keep-alive 只渲染访问过的子页、具名插槽子页渲染。
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import KorPageShell from '../../src/components/kor/shell/KorPageShell.vue'

const groups = [
  {
    title: '通用',
    items: [
      { key: 'home', label: '主页' },
      { key: 'account', label: '账户' }
    ]
  },
  {
    title: '其他',
    items: [{ key: 'dev', label: '开发者选项', onSelect: () => void 0 }]
  }
]

function mountShell(props = {}) {
  return mount(KorPageShell, {
    props: { groups, ...props },
    slots: {
      'page-home': '<div class="page-home">home</div>',
      'page-account': '<div class="page-account">account</div>'
    }
  })
}

describe('KorPageShell - 选中与切换', () => {
  it('默认选中第一个可切换条目', () => {
    const wrapper = mountShell()
    const active = wrapper.find('.kor-shell__item.is-active')
    expect(active.text()).toContain('主页')
  })

  it('点击其它条目发出 update:modelValue', async () => {
    const wrapper = mountShell({ modelValue: 'home' })
    const buttons = wrapper.findAll('.kor-shell__item')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['account'])
  })

  it('动作项不改变选中态', async () => {
    const wrapper = mountShell({ modelValue: 'home' })
    const action = wrapper.findAll('.kor-shell__item').at(-1)!
    await action.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('KorPageShell - keep-alive', () => {
  it('只渲染当前访问过的子页', async () => {
    const wrapper = mountShell({ modelValue: 'home' })
    expect(wrapper.find('.page-home').exists()).toBe(true)
    expect(wrapper.find('.page-account').exists()).toBe(false)

    await wrapper.setProps({ modelValue: 'account' })
    await nextTick()
    // 旧页保留（过渡期间仍在 DOM），新页已挂载
    expect(wrapper.find('.page-account').exists()).toBe(true)
  })

  it('keepAlive=false 时只渲染当前页', async () => {
    const wrapper = mountShell({ modelValue: 'home', keepAlive: false })
    await wrapper.setProps({ modelValue: 'account' })
    await nextTick()
    expect(wrapper.find('.page-home').exists()).toBe(false)
    expect(wrapper.find('.page-account').exists()).toBe(true)
  })
})
