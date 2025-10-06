import { Printer } from 'lucide-react'
import PlaceholderSettingsPage from './PlaceholderSettingsPage'

export default function PrinterSettingsPage() {
  return (
    <PlaceholderSettingsPage 
      categoryKey="printers" 
      icon={<Printer className="h-6 w-6 text-purple-600" />} 
    />
  )
}
