'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { parseImportFile, importQuestions, type ParsedRow } from '@/lib/actions/questions'
import { Upload, FileJson, FileSpreadsheet, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ImportPage() {
  const t = useTranslations('admin')
  const locale = useLocale()

  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [total, setTotal] = useState(0)
  const [errors, setErrors] = useState(0)
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; errors: number } | null>(null)

  const handleFileUpload = async () => {
    if (!file) return

    const content = await file.text()
    const ext = file.name.split('.').pop()?.toLowerCase()
    const detectedFormat = ext === 'csv' ? 'csv' : 'json'
    setFormat(detectedFormat)

    const result = await parseImportFile(content, detectedFormat)

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
          <div className="flex gap-3">
            <button
              onClick={() => setFormat('json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                format === 'json' ? 'border-primary text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              <FileJson className="h-4 w-4" /> JSON
            </button>
            <button
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                format === 'csv' ? 'border-primary text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" /> CSV
            </button>
          </div>

          <div
            className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation()
              if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0])
            }}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">{t('import.uploadHint')}</p>
            {file && <p className="text-foreground mt-2 text-sm">{file.name}</p>}
          </div>
          <input
            id="file-input"
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]) }}
          />

          {file && (
            <Button onClick={handleFileUpload} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {t('import.preview')}
            </Button>
          )}
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
