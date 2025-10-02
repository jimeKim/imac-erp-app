import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui'
import { Home, Shield } from 'lucide-react'

/**
 * 403 Unauthorized 페이지
 */
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">Access Denied</h1>
        <p className="mb-8 text-muted-foreground">
          You don't have permission to access this resource.
          <br />
          Please contact your administrator if you believe this is an error.
        </p>

        <Button asChild>
          <Link to="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
