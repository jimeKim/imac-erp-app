import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  onClose: (id: string) => void
}

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const TOAST_STYLES = {
  success: 'bg-green-50 border-green-500 text-green-900',
  error: 'bg-red-50 border-red-500 text-red-900',
  warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
  info: 'bg-blue-50 border-blue-500 text-blue-900',
}

/**
 * Toast 알림 컴포넌트
 *
 * 사용법:
 * ```tsx
 * import { useToast } from '@/shared/hooks/useToast'
 *
 * const { toast } = useToast()
 * toast.success('Success!', 'Operation completed successfully')
 * toast.error('Error!', 'Something went wrong')
 * ```
 */
export function Toast({ id, type, title, description, duration = 5000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  const Icon = TOAST_ICONS[type]

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }, [id, onClose])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, handleClose])

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-md gap-3 rounded-lg border-l-4 p-4 shadow-lg',
        'transition-all duration-300',
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
        TOAST_STYLES[type],
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded-md p-1 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-black/20"
        aria-label="Close toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Toast Container - 앱의 루트에 배치
 */
interface ToastContainerProps {
  toasts: ToastProps[]
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}
