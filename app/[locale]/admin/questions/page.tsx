'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Upload, Download, Trash2, Edit2, Search } from 'lucide-react'
import { getQuestions, deleteQuestion, deleteQuestions, exportQuestions } from '@/lib/actions/questions'
import type { Domain as DomainType, Difficulty as DifficultyType } from '@prisma/client'
import { CISSP_DOMAINS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

type Question = {
  id: string
  questionText: string
  options: string[]
  correctAnswer: number
  domain: string
  difficulty: string
  tags: string[]
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
        <h1 className="text-2xl font-bold text-[#f8fafc]">{t('questions.title')}</h1>
        <div className="flex gap-2">
          <Link href={getHref('/admin/questions/new')}>
            <Button size="sm" className="bg-[#9fef00] text-[#0d1117] hover:bg-[#9fef00]/90">
              <Plus className="h-4 w-4 mr-1" /> {t('questions.add')}
            </Button>
          </Link>
          <Link href={getHref('/admin/questions/import')}>
            <Button size="sm" variant="outline" className="border-[#30363d] text-[#f8fafc] hover:border-[#9fef00]">
              <Upload className="h-4 w-4 mr-1" /> {t('questions.import')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b949e]" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-[#161b22] border border-[#30363d] rounded-md text-[#f8fafc] text-sm focus:border-[#9fef00] outline-none"
            placeholder={t('questions.search')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="bg-[#161b22] border border-[#30363d] rounded-md text-[#f8fafc] text-sm px-3 py-2 focus:border-[#9fef00] outline-none"
          value={domain}
          onChange={e => { setDomain(e.target.value); setPage(1) }}
        >
          <option value="">{t('questions.allDomains')}</option>
          {Object.entries(CISSP_DOMAINS).map(([key, d]) => (
            <option key={key} value={d.value}>{d.label}</option>
          ))}
        </select>
        <select
          className="bg-[#161b22] border border-[#30363d] rounded-md text-[#f8fafc] text-sm px-3 py-2 focus:border-[#9fef00] outline-none"
          value={difficulty}
          onChange={e => { setDifficulty(e.target.value); setPage(1) }}
        >
          <option value="">{t('questions.allDifficulty')}</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="border-[#30363d] text-[#f8fafc]" onClick={() => handleExport('json')}>JSON</Button>
          <Button size="sm" variant="outline" className="border-[#30363d] text-[#f8fafc]" onClick={() => handleExport('csv')}>CSV</Button>
        </div>
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-2 bg-[#161b22] border border-[#30363d] rounded-md">
          <span className="text-sm text-[#8b949e]">{t('questions.selected', { count: selected.size })}</span>
          <Button size="sm" variant="destructive" onClick={handleBatchDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> {t('questions.batchDelete')}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1e293b]">
            <tr className="text-[#8b949e] text-left">
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
              <tr><td colSpan={5} className="p-8 text-center text-[#8b949e]">Loading...</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-[#8b949e]">{t('questions.noQuestions')}</td></tr>
            ) : (
              questions.map(q => (
                <tr key={q.id} className="border-t border-[#30363d] hover:bg-[#1e293b]/50">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)} className="rounded" />
                  </td>
                  <td className="p-3 text-[#f8fafc] max-w-md truncate">{q.questionText}</td>
                  <td className="p-3 text-[#8b949e] text-xs">{q.domain.replace(/_/g, ' ').toLowerCase()}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      q.difficulty === 'EASY' ? 'bg-[#9fef00]/20 text-[#9fef00]' :
                      q.difficulty === 'MEDIUM' ? 'bg-[#facc15]/20 text-[#facc15]' :
                      'bg-[#f87171]/20 text-[#f87171]'
                    }`}>{q.difficulty}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Link href={getHref(`/admin/questions/${q.id}`)}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#8b949e] hover:text-[#9fef00]">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#8b949e] hover:text-[#f87171]" onClick={() => handleDelete(q.id)}>
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
          <span className="text-sm text-[#8b949e]">{t('questions.total', { count: total })}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
              <Button
                key={p}
                size="sm"
                variant={p === page ? 'default' : 'outline'}
                className={p === page ? 'bg-[#9fef00] text-[#0d1117]' : 'border-[#30363d] text-[#8b949e]'}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
