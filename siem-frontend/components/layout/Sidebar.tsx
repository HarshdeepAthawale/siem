'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  AlertTriangle, 
  BarChart3,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Logs', href: '/logs', icon: FileText },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
  { name: 'Metrics', href: '/metrics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-50 dark:bg-black border-r border-gray-200 dark:border-gray-800 flex flex-col transition-colors">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">SIEM</h1>
          </div>
          <ThemeToggle />
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">Security Operations</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-gradient-to-r from-accent/20 to-accent/10 text-accent border border-accent/30 shadow-lg shadow-accent/10 dark:shadow-accent/10'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white hover:border-gray-200 dark:hover:border-gray-800'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <div>SIEM Platform v1.0</div>
          <div className="mt-1">Production Ready</div>
        </div>
      </div>
    </div>
  )
}

