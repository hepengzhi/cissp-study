'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createQuestion } from '@/lib/actions/questions'
import type { Domain, Difficulty } from '@prisma/client'
import { CISSP_DOMAINS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD']

export default function NewQuestionPage() {
  const t = useTranslations('admin')
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [questionTextZh, setQuestionTextZh] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [explanation, setExplanation] = useState('')
  const [explanationZh, setExplanationZh] = useState('')
  const [domain, setDomain] = useState<Domain>('SECURITY_RISK_MANAGEMENT')
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY')
  const [tags, setTags] = useState('')

  const handleAddOption = () => {
    if (options.length < 6) setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return
    const newOptions = options.filter((_, i) => i !== index)
    if (correctAnswer >= newOptions.length) setCorrectAnswer(newOptions.length - 1)
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const result = await createQuestion({
      questionText,
      questionTextZh: questionTextZh || undefined,
      options: options.filter(Boolean),
      correctAnswer,
      explanation,
      explanationZh: explanationZh || undefined,
      domain,
      difficulty,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    })

    if ('error' in result) {
      alert('Error: ' + result.error)
    } else {
      router.push('./questions')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t('questionForm.createTitle')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('questionForm.questionText')}
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full bg-card border border-border rounded-md p-3 text-foreground min-h-[80px]"
            required
          />
        </div>

        {/* Chinese Question Text */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            {t('questionForm.questionTextZh')}
          </label>
          <textarea
            value={questionTextZh}
            onChange={(e) => setQuestionTextZh(e.target.value)}
            className="w-full bg-card border border-border rounded-md p-3 text-foreground min-h-[60px]"
          />
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('questionForm.options')}
          </label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={correctAnswer === i}
                  onChange={() => setCorrectAnswer(i)}
                  className="accent-primary"
                />
                <span className="text-sm font-medium text-primary w-6">
                  {LETTERS[i]}.
                </span>
                <input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options]
                    newOpts[i] = e.target.value
                    setOptions(newOpts)
                  }}
                  className="flex-1 bg-card border border-border rounded-md p-2 text-foreground text-sm"
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => handleRemoveOption(i)} className="text-destructive hover:text-destructive/80">
                    {t('questionForm.removeOption')}
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button type="button" onClick={handleAddOption} className="text-sm text-primary hover:underline">
                + {t('questionForm.addOption')}
              </button>
            )}
          </div>
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('questionForm.explanation')}
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full bg-card border border-border rounded-md p-3 text-foreground min-h-[60px]"
            required
          />
        </div>

        {/* Chinese Explanation */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            {t('questionForm.explanationZh')}
          </label>
          <textarea
            value={explanationZh}
            onChange={(e) => setExplanationZh(e.target.value)}
            className="w-full bg-card border border-border rounded-md p-3 text-foreground min-h-[60px]"
          />
        </div>

        {/* Domain & Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('questionForm.domain')}
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as Domain)}
              className="w-full bg-card border border-border rounded-md p-2 text-foreground"
            >
              {CISSP_DOMAINS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('questionForm.difficulty')}
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full bg-card border border-border rounded-md p-2 text-foreground"
            >
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            {t('questionForm.tags')}
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full bg-card border border-border rounded-md p-2 text-foreground"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? t('questionForm.saving') : t('questionForm.save')}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t('questionForm.cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}
