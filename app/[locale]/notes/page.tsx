import { prisma } from '@/lib/prisma'
import { DomainFilter } from '@/components/domain-filter'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Calendar } from 'lucide-react'
import type { NoteDomain } from '@/lib/actions/notes'
import { getTranslations } from 'next-intl/server'
import type { SupportedLocale } from '@/lib/types/i18n'
import { getServerLocale } from '@/lib/utils/locale-server'
import { getDomainLabel } from '@/lib/constants/i18n'
import { DomainBadge } from '@/components/domain-badge'

export default async function NotesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ domain?: string }>
}) {
  const { locale } = await params
  const typedLocale = (locale === 'zh' ? 'zh' : 'en') as SupportedLocale
  const { domain: domainParam } = await searchParams
  const t = await getTranslations('notes')
  const tCommon = await getTranslations('common')
  const domain = domainParam || 'all'
  const notes = await prisma.note.findMany({
    where: domain && domain !== 'all' ? { domain: domain as NoteDomain } : undefined,
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="min-h-screen page-bg">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold page-title">{t('title')}</h1>
              <p className="text-sm mt-1 text-[#9ca3af]">
                {notes.length} {t('description')}
              </p>
            </div>
            <Link href={`/${locale}/notes/new`}>
              <Button className="htb-button flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('new')}
              </Button>
            </Link>
          </div>
          <DomainFilter value={domain} />
        </div>

        {/* Notes Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => {
            const title = locale === 'zh' && note.titleZh ? note.titleZh : note.title
            const content = locale === 'zh' && note.contentZh ? note.contentZh : note.content

            return (
              <Link key={note.id} href={`/${locale}/notes/${note.id}`}>
                <div className="htb-card p-5 h-full group hover-lift">
                  <h3 className="text-lg font-semibold page-title mb-2 group-hover:text-[#9fef00] transition-colors line-clamp-2">
                    {title}
                  </h3>
                  <p className="text-sm page-description line-clamp-3 mb-4">
                    {content.substring(0, 150)}...
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <DomainBadge domain={note.domain} label={getDomainLabel(note.domain, typedLocale)} />
                    {note.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 rounded tag-bg page-description">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-timestamp">
                    <Calendar className="h-3 w-3" />
                    <span>{t('updated')} {new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            )
          })}
          {notes.length === 0 && (
            <div className="col-span-full">
              <div className="htb-card p-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted" />
                <p className="text-xl page-title mb-2">{t('none')}</p>
                <p className="page-description mb-6">{t('noneDescription')}</p>
                <Link href={`/${locale}/notes/new`}>
                  <Button className="htb-button">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('actions.createNote')}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
