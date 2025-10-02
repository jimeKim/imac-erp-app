import { useState, useCallback } from 'react'
import { ToastProps, ToastType } from '@/shared/components/feedback/Toast'

/**
 * Toast 관리를 위한 커스텀 훅
 *
 * 사용법:
 * ```tsx
 * const { toast, toasts } = useToast()
 *
 * toast.success('Success!', 'Operation completed')
 * toast.error('Error!', 'Something went wrong')
 * toast.warning('Warning!', 'Please be careful')
 * toast.info('Info', 'Here is some information')
 * ```
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback(
    (type: ToastType, title: string, description?: string, duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random()}`

      const toast: ToastProps = {
        id,
        type,
        title,
        description,
        duration,
        onClose: (toastId: string) => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId))
        },
      }

      setToasts((prev) => [...prev, toast])
    },
    [],
  )

  const toast = {
    success: (title: string, description?: string, duration?: number) => {
      addToast('success', title, description, duration)
    },
    error: (title: string, description?: string, duration?: number) => {
      addToast('error', title, description, duration)
    },
    warning: (title: string, description?: string, duration?: number) => {
      addToast('warning', title, description, duration)
    },
    info: (title: string, description?: string, duration?: number) => {
      addToast('info', title, description, duration)
    },
  }

  return { toast, toasts }
}
