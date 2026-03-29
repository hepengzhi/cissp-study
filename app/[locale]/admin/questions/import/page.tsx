'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { parseImportFile, importQuestions, type ParsedRow } from '@/lib/actions/questions'
import { Download, FileJson, FileSpreadsheet, CheckCircle, XCircle, ArrowLeft, ChevronDown, ChevronUp, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

export default function ImportPage() {
  const t = useTranslations('admin')
  const locale = useLocale()

  const [file, setFile] = useState<File | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<'json' | 'csv' | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [total, setTotal] = useState(0)
  const [errors, setErrors] = useState(0)
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; errors: number } | null>(null)
  const [showSample, setShowSample] = useState(false)

  const detectFormat = (name: string, content: string): 'json' | 'csv' => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') return 'csv'
    if (ext === 'json') return 'json'
    // No clear extension — try content-based detection
    const trimmed = content.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'
    // Check if first line looks like CSV headers
    const firstLine = trimmed.split('\n')[0]?.toLowerCase() ?? ''
    if (firstLine.includes('questiontext') && firstLine.includes(',')) return 'csv'
    return 'json'
  }

  const handleFileUpload = async () => {
    if (!file) return

    const content = await file.text()
    const format = detectFormat(file.name, content)
    setDetectedFormat(format)

    const result = await parseImportFile(content, format)

    if ('error' in result) {
      alert('Parse error: ' + result.error)
      return
    }

    setRows(result.data)
    setTotal(result.total)
    setErrors(result.errors)
    setStep('preview')
  }

  const handleImport = async () => {
    setImporting(true)
    const validRows = rows.filter(r => r.valid)
    const result = await importQuestions(validRows)
    if ('imported' in result) {
      setImportResult(result)
    }
    setStep('result')
    setImporting(false)
  }

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
                const f = e.target.files[0]
                setFile(f)
                setDetectedFormat(null)
              }
            }}
          />

          {file && (
            <Button onClick={handleFileUpload} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {t('import.preview')}
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
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-primary">{t('import.validRows', { count: total - errors })}</span>
            {errors > 0 && <span className="text-destructive">{t('import.invalidRows', { count: errors })}</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Question</th>
                  <th className="p-2 text-left">Domain</th>
                  <th className="p-2 text-left">Options</th>
                  <th className="p-2 text-left">Image</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={`border-b border-border ${row.valid ? '' : 'opacity-60'}`}>
                    <td className="p-2">
                      {row.valid
                        ? <CheckCircle className="h-4 w-4 text-primary" />
                        : <XCircle className="h-4 w-4 text-destructive" />}
                    </td>
                    <td className="p-2 text-foreground max-w-[300px] truncate">
                      {row.data.questionText || '(empty)'}
                    </td>
                    <td className="p-2 text-muted-foreground">{row.data.domain}</td>
                    <td className="p-2 text-muted-foreground">{row.data.options?.length ?? 0}</td>
                    <td className="p-2">
                      {(row.data as any).questionImages?.length > 0 && (
                        <img src={(row.data as any).questionImages[0]} alt="preview" className="h-10 w-10 object-cover rounded" />
                      )}
                    </td>
                    {!row.valid && (
                      <td className="p-2 text-destructive text-xs">{row.error}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={importing} className="bg-primary text-primary-foreground">
              {importing ? t('import.importing') : t('import.confirmImport')}
            </Button>
            <Button variant="outline" onClick={() => setStep('upload')} className="border-border text-muted-foreground">
              {t('import.back')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && importResult && (
        <div className="text-center space-y-4 py-8">
          <div className="text-lg text-foreground">
            {t('import.importResult', { imported: importResult.imported, errors: importResult.errors })}
          </div>
          <Link href={`/${locale}/admin/questions`}>
            <Button className="bg-primary text-primary-foreground">
              {t('import.back')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
