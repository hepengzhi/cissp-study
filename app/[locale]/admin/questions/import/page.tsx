'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { parseJSON, parseCSV, type ParsedRow, type QuestionInput } from '@/lib/import-parser'
import { checkDuplicateQuestions, importQuestionBatch } from '@/lib/actions/questions'
import { Download, FileJson, FileSpreadsheet, CheckCircle, XCircle, ArrowLeft, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const BATCH_SIZE = 50

const JSON_SAMPLE = `{
  "questions": [
    {
      "questionText": "What is X?",
      "questionTextZh": "X是什么？",
      "options": { "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D" },
      "correctAnswer": "C",
      "explanation": "Because...",
      "explanationZh": "因为...",
      "domain": "SECURITY_RISK_MANAGEMENT",
      "difficulty": "EASY",
      "question_images": ["data:image/jpeg;base64,..."],
      "tags": ["tag1", "tag2"]
    }
  ]
}`

const CSV_SAMPLE = `questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation,domain,difficulty,tags
"What is X?","Option A","Option B","Option C","Option D","C","Because...","SECURITY_RISK_MANAGEMENT","EASY","tag1|tag2"`

type PreviewStats = {
  total: number
  valid: number
  duplicates: number
  errors: number
  images: number
}

export default function ImportPage() {
  const t = useTranslations('admin')
  const locale = useLocale()

  const [file, setFile] = useState<File | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<'json' | 'csv' | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [stats, setStats] = useState<PreviewStats | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload')
  const [showSample, setShowSample] = useState(false)
  const [showErrorDetail, setShowErrorDetail] = useState(false)
  const [parsing, setParsing] = useState(false)

  // Import progress
  const [progress, setProgress] = useState({ imported: 0, failed: 0, total: 0 })
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null)

  const detectFormat = (name: string, content: string): 'json' | 'csv' => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') return 'csv'
    if (ext === 'json') return 'json'
    const trimmed = content.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'
    const firstLine = trimmed.split('\n')[0]?.toLowerCase() ?? ''
    if (firstLine.includes('questiontext') && firstLine.includes(',')) return 'csv'
    return 'json'
  }

  const handleFileUpload = useCallback(async () => {
    if (!file) return
    setParsing(true)

    try {
      // Parse file on the client side — avoids RSC serialization limits
      const content = await file.text()
      const format = detectFormat(file.name, content)
      setDetectedFormat(format)

      const parsed = format === 'json' ? parseJSON(content) : parseCSV(content)

      // Check duplicates via server action (texts only, small payload)
      const validRows = parsed.data.filter(r => r.valid)
      const validTexts = validRows.map(r => (r.data as QuestionInput).questionText)
      const validTextsZh = validRows
        .map(r => (r.data as QuestionInput).questionTextZh)
        .filter((t): t is string => !!t)
      const validExps = validRows.map(r => (r.data as QuestionInput).explanation)
      const validExpsZh = validRows
        .map(r => (r.data as QuestionInput).explanationZh)
        .filter((t): t is string => !!t)

      let existingEn = new Set<string>()
      let existingZh = new Set<string>()
      let existingExpEn = new Set<string>()
      let existingExpZh = new Set<string>()
      if (validTexts.length > 0 || validTextsZh.length > 0 || validExps.length > 0 || validExpsZh.length > 0) {
        const dupResult = await checkDuplicateQuestions(validTexts, validTextsZh, validExps, validExpsZh)
        if (!('en' in dupResult)) {
          alert('Duplicate check error: ' + (dupResult as any).error)
          setParsing(false)
          return
        }
        existingEn = new Set(dupResult.en)
        existingZh = new Set(dupResult.zh)
        existingExpEn = new Set(dupResult.expEn)
        existingExpZh = new Set(dupResult.expZh)
      }

      // Mark duplicates (match by questionText, questionTextZh, explanation, or explanationZh)
      for (const row of parsed.data) {
        if (!row.valid) continue
        const d = row.data as QuestionInput
        const isDup =
          existingEn.has(d.questionText) ||
          (d.questionTextZh && existingZh.has(d.questionTextZh)) ||
          existingExpEn.has(d.explanation) ||
          (d.explanationZh && existingExpZh.has(d.explanationZh))
        if (isDup) {
          row.valid = false
          row.duplicate = true
          row.error = 'Duplicate: question already exists'
        }
      }

      const valid = parsed.data.filter(r => r.valid).length
      const duplicates = parsed.data.filter(r => r.duplicate).length
      const errors = parsed.data.filter(r => !r.valid && !r.duplicate).length
      const images = parsed.data.reduce(
        (sum, r) => sum + ((r.data as QuestionInput).questionImages?.length ?? 0), 0
      )

      setRows(parsed.data)
      setStats({ total: parsed.data.length, valid, duplicates, errors, images })
      setStep('preview')
    } catch (e: any) {
      alert('Parse error: ' + (e.message ?? String(e)))
    } finally {
      setParsing(false)
    }
  }, [file])

  const handleImport = useCallback(async () => {
    const validRows = rows.filter(r => r.valid)
    if (validRows.length === 0) return

    setStep('importing')
    setProgress({ imported: 0, failed: 0, total: validRows.length })

    let totalImported = 0
    let totalFailed = 0

    // Process in batches to avoid Prisma nesting limits
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE)
      const batchData = batch.map(r => r.data as QuestionInput)

      const result = await importQuestionBatch(batchData)

      if ('error' in result) {
        totalFailed += batch.length
      } else {
        totalImported += result.imported
        totalFailed += result.errors
      }

      setProgress({
        imported: totalImported,
        failed: totalFailed,
        total: validRows.length,
      })
    }

    setImportResult({ imported: totalImported, failed: totalFailed })
    setStep('result')
  }, [rows])

  const errorRows = rows.filter(r => !r.valid && !r.duplicate)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/admin/questions`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{t('import.title')}</h1>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation()
              if (e.dataTransfer.files[0]) {
                setFile(e.dataTransfer.files[0])
                setDetectedFormat(null)
              }
            }}
          >
            <Download className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">{t('import.uploadHint')}</p>
            {file && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                <span className="text-foreground">{file.name}</span>
                {detectedFormat && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                    {detectedFormat === 'json' ? <FileJson className="h-3 w-3" /> : <FileSpreadsheet className="h-3 w-3" />}
                    {detectedFormat.toUpperCase()}
                  </span>
                )}
              </div>
            )}
          </div>
          <input
            id="file-input"
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setFile(e.target.files[0])
                setDetectedFormat(null)
              }
            }}
          />

          {file && (
            <Button onClick={handleFileUpload} disabled={parsing} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {parsing ? t('import.parsing') : t('import.preview')}
            </Button>
          )}

          {/* Sample Format */}
          <div className="border border-border rounded-lg">
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowSample(!showSample)}
            >
              <span>{t('import.sampleFormat')}</span>
              {showSample ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showSample && (
              <div className="border-t border-border">
                <div className="p-3">
                  <p className="text-xs font-medium text-foreground mb-2">JSON {t('import.sampleLabel')}</p>
                  <pre className="bg-muted/50 rounded-md p-3 text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
                    {JSON_SAMPLE}
                  </pre>
                </div>
                <div className="p-3 border-t border-border">
                  <p className="text-xs font-medium text-foreground mb-2">CSV {t('import.sampleLabel')}</p>
                  <pre className="bg-muted/50 rounded-md p-3 text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
                    {CSV_SAMPLE}
                  </pre>
                </div>
                <div className="p-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">{t('import.domainList')}</p>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    SECURITY_RISK_MANAGEMENT, ASSET_SECURITY, SECURITY_ARCHITECTURE, COMMUNICATION_NETWORK_SECURITY, IDENTITY_ACCESS_MANAGEMENT, SECURITY_ASSESSMENT, SECURITY_OPERATIONS, SOFTWARE_DEVELOPMENT_SECURITY
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && stats && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-3">
            <div className="border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs text-muted-foreground">{t('import.statTotal')}</div>
            </div>
            <div className="border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{stats.valid}</div>
              <div className="text-xs text-muted-foreground">{t('import.statValid')}</div>
            </div>
            <div className="border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-500">{stats.duplicates}</div>
              <div className="text-xs text-muted-foreground">{t('import.statDuplicates')}</div>
            </div>
            <div className="border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-destructive">{stats.errors}</div>
              <div className="text-xs text-muted-foreground">{t('import.statErrors')}</div>
            </div>
            <div className="border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.images}</div>
              <div className="text-xs text-muted-foreground">{t('import.statImages')}</div>
            </div>
          </div>

          {/* Has errors — show error detail toggle */}
          {errorRows.length > 0 && (
            <div className="border border-destructive/50 rounded-lg p-4 space-y-3">
              <button
                type="button"
                className="flex items-center gap-2 text-destructive text-sm font-medium w-full"
                onClick={() => setShowErrorDetail(!showErrorDetail)}
              >
                <AlertTriangle className="h-4 w-4" />
                {t('import.hasErrors', { count: errorRows.length })}
                {showErrorDetail ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
              </button>
              {showErrorDetail && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {errorRows.map((row, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm bg-destructive/10 rounded p-2">
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <span className="text-foreground">#{row.sourceIndex + 1}: </span>
                        <span className="text-muted-foreground">{(row.data as any).questionText || (row.data as any).questionTextZh || '(empty)'}</span>
                        <span className="text-destructive ml-2">{row.error}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-x-auto max-h-80 overflow-y-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Question</th>
                  <th className="p-2 text-left">Domain</th>
                  <th className="p-2 text-left">Opts</th>
                  <th className="p-2 text-left">Img</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={`border-b border-border ${row.valid ? '' : row.duplicate ? 'opacity-50' : 'opacity-60'}`}>
                    <td className="p-2">
                      {row.valid ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : row.duplicate ? (
                        <span className="text-xs text-yellow-500 font-medium">SKIP</span>
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                    <td className="p-2 text-foreground max-w-[300px] truncate">
                      {(row.data as any).questionText || (row.data as any).questionTextZh || '(empty)'}
                    </td>
                    <td className="p-2 text-muted-foreground text-xs">{(row.data as any).domain}</td>
                    <td className="p-2 text-muted-foreground">{(row.data as any).options?.length ?? 0}</td>
                    <td className="p-2">
                      {(row.data as any).questionImages?.length > 0 && (
                        <img src={(row.data as any).questionImages[0]} alt="" className="h-8 w-8 object-cover rounded" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={stats.valid === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('import.startImport')}
            </Button>
            <Button variant="outline" onClick={() => { setStep('upload'); setRows([]); setStats(null); }} className="border-border text-muted-foreground">
              {t('import.reupload')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Importing (Progress) */}
      {step === 'importing' && (
        <div className="space-y-6 py-8">
          <div className="text-center">
            <div className="text-lg font-medium text-foreground">{t('import.importing')}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {t('import.progressLabel', { imported: progress.imported, total: progress.total })}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.total > 0 ? Math.round(((progress.imported + progress.failed) / progress.total) * 100) : 0}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="text-primary">{t('import.imported', { count: progress.imported })}</span>
            {progress.failed > 0 && <span className="text-destructive">{t('import.failed', { count: progress.failed })}</span>}
            <span>{Math.round(((progress.imported + progress.failed) / progress.total) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 'result' && importResult && (
        <div className="text-center space-y-4 py-8">
          <div className="text-4xl mb-2">&#10003;</div>
          <div className="text-lg font-medium text-foreground">
            {t('import.importComplete')}
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{importResult.imported}</div>
              <div className="text-muted-foreground">{t('import.statValid')}</div>
            </div>
            {importResult.failed > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{importResult.failed}</div>
                <div className="text-muted-foreground">{t('import.statErrors')}</div>
              </div>
            )}
          </div>
          <Link href={`/${locale}/admin/questions`}>
            <Button className="bg-primary text-primary-foreground mt-4">
              {t('import.back')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
