'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Download, Trash2, Edit2, Search, ImageIcon, Eye } from 'lucide-react'
import { getQuestions, deleteQuestion, deleteQuestions, exportQuestions } from '@/lib/actions/questions'
import type { Domain as DomainType, Difficulty as DifficultyType } from '@prisma/client'
import { CISSP_DOMAINS } from '@/lib/constants'
import { DomainBadge } from '@/components/domain-badge'
import { getLocalizedText } from '@/lib/utils/localize'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

type Question = {
  id: string
  questionText: string
  questionTextZh?: string | null
  options: string[]
  correctAnswer: string
  questionType: string
  matchItems: string[]
  domain: string
  difficulty: string
  tags: string[]
  questionImages: string[]
  explanation: string
  explanationZh?: string | null
  createdAt: Date
}

export default function QuestionsPage() {
  const t = useTranslations('admin')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null)

  const pageSize = 20

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    const result = await getQuestions({ search: search || undefined, domain: (domain || undefined) as DomainType, difficulty: (difficulty || undefined) as DifficultyType, page, pageSize })
    if ('data' in result) {
      setQuestions(result.data as Question[])
      setTotal(result.total)
    }
    setLoading(false)
  }, [search, domain, difficulty, page])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === questions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(questions.map(q => q.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm(t('questions.confirmBatchDelete', { count: selected.size }))) return
    await deleteQuestions(Array.from(selected))
    setSelected(new Set())
    loadQuestions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('questions.confirmDelete'))) return
    await deleteQuestion(id)
    loadQuestions()
  }

  const handleExport = async (format: 'json' | 'csv') => {
    const result = await exportQuestions({ search: search || undefined, domain: (domain || undefined) as DomainType, difficulty: (difficulty || undefined) as DifficultyType, page: 1, pageSize: 99999 }, format)
    if (typeof result === 'string') {
      const blob = new Blob([result], { type: format === 'json' ? 'application/json' : 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `questions.${format}`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const getHref = (path: string) => locale === 'en' ? path : `/zh${path}`
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('questions.title')}</h1>
        <div className="flex gap-2">
          <Link href={getHref('/admin/questions/new')}>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1" /> {t('questions.add')}
            </Button>
          </Link>
          <Link href={getHref('/admin/questions/import')}>
            <Button size="sm" variant="outline" className="border-border text-foreground hover:border-primary">
              <Download className="h-4 w-4 mr-1" /> {t('questions.import')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-md text-foreground text-sm focus:border-primary outline-none"
            placeholder={t('questions.search')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="bg-card border border-border rounded-md text-foreground text-sm px-3 py-2 focus:border-primary outline-none"
          value={domain}
          onChange={e => { setDomain(e.target.value); setPage(1) }}
        >
          <option value="">{t('questions.allDomains')}</option>
          {CISSP_DOMAINS.map(d => (
            <option key={d.value} value={d.value}>{d.number}. {d.label}</option>
          ))}
        </select>
        <select
          className="bg-card border border-border rounded-md text-foreground text-sm px-3 py-2 focus:border-primary outline-none"
          value={difficulty}
          onChange={e => { setDifficulty(e.target.value); setPage(1) }}
        >
          <option value="">{t('questions.allDifficulty')}</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="border-border text-foreground" onClick={() => handleExport('json')}>JSON</Button>
          <Button size="sm" variant="outline" className="border-border text-foreground" onClick={() => handleExport('csv')}>CSV</Button>
        </div>
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-2 bg-card border border-border rounded-md">
          <span className="text-sm text-muted-foreground">{t('questions.selected', { count: selected.size })}</span>
          <Button size="sm" variant="destructive" onClick={handleBatchDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> {t('questions.batchDelete')}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-muted-foreground text-left">
              <th className="p-3 w-10">
                <input type="checkbox" checked={selected.size === questions.length && questions.length > 0} onChange={toggleAll} className="rounded" />
              </th>
              <th className="p-3">Question</th>
              <th className="p-3 w-28">Domain</th>
              <th className="p-3 w-20">Difficulty</th>
              <th className="p-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t('questions.noQuestions')}</td></tr>
            ) : (
              questions.map(q => (
                <tr key={q.id} className="border-t border-border hover:bg-muted/50">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)} className="rounded" />
                  </td>
                  <td className="p-3 text-foreground max-w-md truncate">
                    <button
                      onClick={() => setViewingQuestion(q)}
                      className="flex items-center gap-1 text-left hover:text-[#00d4ff] transition-colors cursor-pointer w-full"
                    >
                      {getLocalizedText(q.questionText, q.questionTextZh, locale)}
                      {q.questionImages && q.questionImages.length > 0 && (
                        <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    <DomainBadge domain={q.domain} label={q.domain.replace(/_/g, ' ')} />
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      q.difficulty === 'EASY' ? 'bg-primary/20 text-primary' :
                      q.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-destructive/20 text-destructive'
                    }`}>{q.difficulty}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-[#00d4ff]" onClick={() => setViewingQuestion(q)} title={t('questions.view')}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Link href={getHref(`/admin/questions/${q.id}`)}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(q.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('questions.total', { count: total })}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
              <Button
                key={p}
                size="sm"
                variant={p === page ? 'default' : 'outline'}
                className={p === page ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* View question modal */}
      <Dialog open={!!viewingQuestion} onOpenChange={(open) => { if (!open) setViewingQuestion(null) }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0d1117] border-[#30363d] text-foreground">
          {viewingQuestion && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#00d4ff]" />
                  {t('questions.view')}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-2">
                  <DomainBadge domain={viewingQuestion.domain} label={viewingQuestion.domain.replace(/_/g, ' ')} />
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    viewingQuestion.difficulty === 'EASY' ? 'bg-primary/20 text-primary' :
                    viewingQuestion.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-destructive/20 text-destructive'
                  }`}>{viewingQuestion.difficulty}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Question text */}
                <div>
                  <p className="text-sm font-semibold text-[#9ca3af] mb-1">{t('questionForm.questionText')}</p>
                  <p className="text-foreground">{viewingQuestion.questionText}</p>
                  {viewingQuestion.questionTextZh && (
                    <>
                      <p className="text-sm font-semibold text-[#9ca3af] mb-1 mt-2">{t('questionForm.questionTextZh')}</p>
                      <p className="text-foreground">{viewingQuestion.questionTextZh}</p>
                    </>
                  )}
                </div>

                {/* Options */}
                <div>
                  <p className="text-sm font-semibold text-[#9ca3af] mb-1">{t('questionForm.options')}</p>
                  <div className="space-y-1.5">
                    {viewingQuestion.options.map((opt: string, i: number) => {
                      const isCorrect = String(i) === viewingQuestion.correctAnswer
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-2 p-2 rounded-md border ${
                            isCorrect
                              ? 'border-[#9fef00]/40 bg-[#9fef00]/10'
                              : 'border-[#30363d] bg-[#161b22]'
                          }`}
                        >
                          <span className={`text-sm font-mono w-6 ${isCorrect ? 'text-[#9fef00]' : 'text-[#a0aec0]'}`}>
                            {String.fromCharCode(65 + i)}.
                          </span>
                          <span className={`text-sm ${isCorrect ? 'text-[#9fef00] font-medium' : 'text-foreground'}`}>
                            {opt}
                          </span>
                          {isCorrect && (
                            <span className="ml-auto text-xs text-[#9fef00]">✓ {t('questionForm.correctAnswer')}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <p className="text-sm font-semibold text-[#9ca3af] mb-1">{t('questionForm.explanation')}</p>
                  <p className="text-sm text-foreground leading-relaxed">{viewingQuestion.explanation}</p>
                  {viewingQuestion.explanationZh && (
                    <>
                      <p className="text-sm font-semibold text-[#9ca3af] mb-1 mt-2">{t('questionForm.explanationZh')}</p>
                      <p className="text-sm text-foreground leading-relaxed">{viewingQuestion.explanationZh}</p>
                    </>
                  )}
                </div>

                {/* Tags */}
                {viewingQuestion.tags && viewingQuestion.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-[#9ca3af] mb-1">{t('questionForm.tags')}</p>
                    <div className="flex flex-wrap gap-1">
                      {viewingQuestion.tags.map((tag: string) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded bg-[#30363d] text-[#a0aec0]">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Link href={getHref(`/admin/questions/${viewingQuestion.id}`)}>
                  <Button size="sm" variant="outline" className="border-[#30363d] text-[#9fef00] hover:border-[#9fef00]/50">
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> {t('questionForm.editTitle')}
                  </Button>
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
