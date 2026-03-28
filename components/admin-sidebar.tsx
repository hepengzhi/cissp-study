'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileQuestion, ArrowLeft, Brain, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations, useLocale } from 'next-intl'

const sidebarItems = [
  { href: '/admin', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/questions', labelKey: 'questions', icon: FileQuestion },
]

const disabledItems = [
  { labelKey: 'flashcards', icon: Brain },
  { labelKey: 'exams', icon: ClipboardList },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('admin')

  const getHref = (href: string) => {
    return locale === 'en' ? href : `/zh${href}`
  }

  return (
    <aside className="w-[180px] min-h-screen bg-[#1e293b] border-r border-[#334155] flex flex-col">
      <div className="p-4 border-b border-[#334155]">
        <h2 className="text-[#f8fafc] font-semibold text-sm">CISSP Admin</h2>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {sidebarItems.map((item) => {
          const href = getHref(item.href)
          const isActive = pathname === href ||
            (item.href !== '/admin' && pathname.startsWith(href))

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-[#334155] text-[#f8fafc]'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155]/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{t(`sidebar.${item.labelKey}`)}</span>
            </Link>
          )
        })}

        {disabledItems.map((item) => (
          <div
            key={item.labelKey}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#475569] cursor-not-allowed"
          >
            <item.icon className="h-4 w-4" />
            <span>{t(`sidebar.${item.labelKey}`)}</span>
            <span className="text-[10px] ml-auto bg-[#334155] px-1.5 py-0.5 rounded">Soon</span>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[#334155]">
        <Link
          href={getHref('/')}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('sidebar.backToSite')}</span>
        </Link>
      </div>
    </aside>
  )
}
