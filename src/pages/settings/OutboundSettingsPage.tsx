import { TruckIcon } from 'lucide-react'
import PlaceholderSettingsPage from './PlaceholderSettingsPage'

export default function OutboundSettingsPage() {
  return (
    <PlaceholderSettingsPage 
      categoryKey="outbounds" 
      icon={<TruckIcon className="h-6 w-6 text-orange-600" />} 
    />
  )
}
