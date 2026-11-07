/**
 * Kor 设置控件测试：KorSettingNumberField（步进 / 夹取 / 禁用）与
 * KorSettingRadioGroup（选中态 / 点击切换 / 禁用）。
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import KorSettingNumberField from '../../src/components/kor/setting/KorSettingNumberField.vue'
import KorSettingRadioGroup from '../../src/components/kor/setting/KorSettingRadioGroup.vue'

describe('KorSettingNumberField', () => {
  it('点击 + 按 step 递增并发出新值', async () => {
    const wrapper = mount(KorSettingNumberField, {
      props: { modelValue: 4, min: 0, max: 10, step: 2 }
    })
    const buttons = wrapper.findAll('.kor-num__btn')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([6])
  })

  it('点击 - 低于 min 时保持原值且不发事件', async () => {
    const wrapper = mount(KorSettingNumberField, {
      props: { modelValue: 0, min: 0, max: 10, step: 1 }
    })
    const buttons = wrapper.findAll('.kor-num__btn')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('0')
  })

  it('输入越界值会被夹取到 max', async () => {
    const wrapper = mount(KorSettingNumberField, {
      props: { modelValue: 1, min: 0, max: 8, step: 1 }
    })
    const input = wrapper.find('input')
    await input.setValue('99')
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([8])
  })

  it('disabled 时不发出事件', async () => {
    const wrapper = mount(KorSettingNumberField, {
      props: { modelValue: 2, disabled: true }
    })
    await wrapper.findAll('.kor-num__btn')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('KorSettingRadioGroup', () => {
  const options = [
    { value: 'a', label: '选项 A', desc: '第一个' },
    { value: 'b', label: '选项 B' }
  ]

  it('渲染所有选项并标记选中项', () => {
    const wrapper = mount(KorSettingRadioGroup, { props: { modelValue: 'b', options } })
    const items = wrapper.findAll('.kor-radio__item')
    expect(items).toHaveLength(2)
    expect(items[1].classes()).toContain('is-checked')
    expect(items[1].attributes('aria-checked')).toBe('true')
    expect(items[0].attributes('aria-checked')).toBe('false')
  })

  it('点击未选中项发出新值', async () => {
    const wrapper = mount(KorSettingRadioGroup, { props: { modelValue: 'a', options } })
    await wrapper.findAll('.kor-radio__item')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })

  it('点击已选中项不重复发出事件', async () => {
    const wrapper = mount(KorSettingRadioGroup, { props: { modelValue: 'a', options } })
    await wrapper.findAll('.kor-radio__item')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('disabled 时所有项不可用', () => {
    const wrapper = mount(KorSettingRadioGroup, {
      props: { modelValue: 'a', options, disabled: true }
    })
    wrapper.findAll('.kor-radio__item').forEach((item) => {
      expect(item.attributes('disabled')).toBeDefined()
    })
  })
})
