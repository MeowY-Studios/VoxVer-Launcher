/**
 * Kor UI 原语测试
 * 覆盖：KorSwitch 的 v-model / disabled、KorSlider 的取值与百分比映射、
 *       KorSelect 的选项渲染与 change 事件、KorProgress 的百分比。
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import KorSwitch from '../../src/components/kor/ui/KorSwitch.vue'
import KorSlider from '../../src/components/kor/ui/KorSlider.vue'
import KorSelect from '../../src/components/kor/ui/KorSelect.vue'
import KorProgress from '../../src/components/kor/ui/KorProgress.vue'

describe('KorSwitch', () => {
  it('点击后发出 update:modelValue', async () => {
    const wrapper = mount(KorSwitch, { props: { modelValue: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('checked 时 aria-checked 为 true 且带 is-checked', () => {
    const wrapper = mount(KorSwitch, { props: { modelValue: true } })
    expect(wrapper.attributes('aria-checked')).toBe('true')
    expect(wrapper.classes()).toContain('is-checked')
  })

  it('disabled 时不发出事件', async () => {
    const wrapper = mount(KorSwitch, { props: { modelValue: false, disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('KorSlider', () => {
  it('按 min/max 计算填充百分比', () => {
    const wrapper = mount(KorSlider, { props: { modelValue: 50, min: 0, max: 100 } })
    const fill = wrapper.find('.kor-slider-fill')
    expect(fill.attributes('style')).toContain('width: 50%')
  })

  it('输入 range 时发出数值', async () => {
    const wrapper = mount(KorSlider, { props: { modelValue: 10, min: 0, max: 20 } })
    const input = wrapper.find('input[type="range"]')
    await input.setValue('15')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([15])
  })
})

describe('KorSelect', () => {
  const options = [
    { value: 'a', label: '选项 A' },
    { value: 'b', label: '选项 B' }
  ]

  it('渲染全部选项', () => {
    const wrapper = mount(KorSelect, { props: { modelValue: 'a', options } })
    expect(wrapper.findAll('option')).toHaveLength(2)
  })

  it('change 时发出新值', async () => {
    const wrapper = mount(KorSelect, { props: { modelValue: 'a', options } })
    await wrapper.find('select').setValue('b')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })
})

describe('KorProgress', () => {
  it('夹取百分比到 0–100', () => {
    const over = mount(KorProgress, { props: { value: 150, max: 100 } })
    expect(over.find('.kor-progress__fill').attributes('style')).toContain('width: 100%')

    const under = mount(KorProgress, { props: { value: -5, max: 100 } })
    expect(under.find('.kor-progress__fill').attributes('style')).toContain('width: 0%')
  })
})
