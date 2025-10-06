import { Users } from 'lucide-react'
import PlaceholderSettingsPage from './PlaceholderSettingsPage'

export default function PermissionSettingsPage() {
  return (
    <PlaceholderSettingsPage 
      categoryKey="permissions" 
      icon={<Users className="h-6 w-6 text-red-600" />} 
    />
  )
}
