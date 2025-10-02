import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

/**
 * Error Boundary 컴포넌트
 *
 * React 컴포넌트 트리의 에러를 catch하여 fallback UI를 표시
 *
 * 사용법:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-6">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>

          <h3 className="mb-2 text-lg font-semibold">Something went wrong</h3>

          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            An unexpected error occurred. Please try refreshing the page.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <details className="mb-4 max-w-2xl rounded-lg bg-muted p-4 text-left text-xs">
              <summary className="cursor-pointer font-semibold">Error Details</summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            <Button onClick={this.handleReset} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Error Display 컴포넌트
 *
 * 일반적인 에러 메시지를 표시
 */
interface ErrorDisplayProps {
  title?: string
  description?: string
  error?: Error
  onRetry?: () => void
}

export function ErrorDisplay({
  title = 'Something went wrong',
  description = 'An error occurred while loading this content.',
  error,
  onRetry,
}: ErrorDisplayProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>

      <h3 className="mb-2 text-lg font-semibold">{title}</h3>

      <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>

      {import.meta.env.DEV && error && (
        <details className="mb-4 max-w-2xl rounded-lg bg-muted p-4 text-left text-xs">
          <summary className="cursor-pointer font-semibold">Error Details</summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap">{error.toString()}</pre>
        </details>
      )}

      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  )
}
