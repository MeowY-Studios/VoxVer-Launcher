import { createApp, h } from 'vue'
import PxToast from '@/components/common/PxToast.vue'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number
}

export function useToast() {
  function toast(options: ToastOptions): void {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const app = createApp({
      setup() {
        return () =>
          h(PxToast, {
            ...options,
            onDone: () => {
              app.unmount()
              container.remove()
            }
          })
      }
    })

    app.mount(container)
  }

  return { toast }
}
