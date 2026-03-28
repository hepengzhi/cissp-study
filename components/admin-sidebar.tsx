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
    <aside className="w-[180px] min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-foreground font-semibold text-sm">CISSP Admin</h2>
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
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground/50 cursor-not-allowed"
          >
            <item.icon className="h-4 w-4" />
            <span>{t(`sidebar.${item.labelKey}`)}</span>
            <span className="text-[10px] ml-auto bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <Link
          href={getHref('/')}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('sidebar.backToSite')}</span>
        </Link>
      </div>
    </aside>
  )
}
