import { createApp, h } from 'vue'
import { useI18n } from 'vue-i18n'
import PxConfirm from '@/components/common/PxConfirm.vue'
import type { PxConfirmProps } from '@/components/common/PxConfirm.types'

type ConfirmOptions = Omit<PxConfirmProps, 'confirmText' | 'cancelText'> & {
  confirmText?: string
  cancelText?: string
}

export function useConfirm() {
  const { t } = useI18n()

  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const app = createApp({
        setup() {
          return () =>
            h(PxConfirm, {
              confirmText: t('common.confirm'),
              cancelText: t('common.cancel'),
              ...options,
              onConfirm: () => {
                cleanup()
                resolve(true)
              },
              onCancel: () => {
                cleanup()
                resolve(false)
              }
            })
        }
      })

      function cleanup() {
        app.unmount()
        container.remove()
        document.body.style.overflow = ''
      }

      app.mount(container)
    })
  }

  return { confirm }
}
