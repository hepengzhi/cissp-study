import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#a0aec0] uppercase tracking-wider">{title}</span>
        <Icon className="h-4 w-4 text-[#9fef00]" />
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white">{value}</div>
      {description && (
        <p className="text-xs text-[#718096] mt-1">{description}</p>
      )}
    </div>
  )
}
