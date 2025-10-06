import { DollarSign } from 'lucide-react'
import PlaceholderSettingsPage from './PlaceholderSettingsPage'

export default function SalesSettingsPage() {
  return (
    <PlaceholderSettingsPage 
      categoryKey="sales" 
      icon={<DollarSign className="h-6 w-6 text-teal-600" />} 
    />
  )
}
