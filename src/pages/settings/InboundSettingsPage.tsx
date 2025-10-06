import { Truck } from 'lucide-react'
import PlaceholderSettingsPage from './PlaceholderSettingsPage'

export default function InboundSettingsPage() {
  return (
    <PlaceholderSettingsPage 
      categoryKey="inbounds" 
      icon={<Truck className="h-6 w-6 text-green-600" />} 
    />
  )
}
