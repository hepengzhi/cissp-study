import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MarkdownPreview } from '@/components/markdown-preview'
import { ArrowLeft, Edit, Calendar, Tag } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ViewNotePage({
  params
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  const note = await prisma.note.findUnique({
    where: { id }
  })

  if (!note) {
    notFound()
  }

  // Get localized content
  const title = locale === 'zh' && note.titleZh ? note.titleZh : note.title
  const content = locale === 'zh' && note.contentZh ? note.contentZh : note.content

  return (
    <div className="min-h-screen page-bg">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/${locale}/notes`}>
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </Button>
          </Link>
          <Link href={`/${locale}/notes/${note.id}/edit`}>
            <Button className="htb-button">
              <Edit className="h-4 w-4 mr-2" />
              Edit Note
            </Button>
          </Link>
        </div>

        {/* Note Content */}
        <Card className="htb-card">
          <CardHeader>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold page-title">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`domain-badge badge-${note.domain.split('_')[0].toLowerCase()}`}>
                  {note.domain.replace(/_/g, ' ')}
                </span>
                {note.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-timestamp">
                <Calendar className="h-4 w-4" />
                <span>
                  Updated {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <MarkdownPreview content={content} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
