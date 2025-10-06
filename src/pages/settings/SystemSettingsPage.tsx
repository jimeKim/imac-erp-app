import { Cog } from 'lucide-react'
import PlaceholderSettingsPage from './PlaceholderSettingsPage'

export default function SystemSettingsPage() {
  return (
    <PlaceholderSettingsPage 
      categoryKey="system" 
      icon={<Cog className="h-6 w-6 text-gray-600" />} 
    />
  )
}
