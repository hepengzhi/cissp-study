'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MarkdownPreview } from './markdown-preview'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Columns2, FileText, Maximize2 } from 'lucide-react'

type ViewMode = 'split' | 'edit' | 'preview'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  initialViewMode?: ViewMode
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your markdown here...',
  minHeight = '400px',
  initialViewMode = 'split',
  className,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [isPreviewVisible, setIsPreviewVisible] = useState(initialViewMode !== 'edit')
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const togglePreview = useCallback(() => {
    setIsPreviewVisible((prev) => !prev)
  }, [])

  const cycleViewMode = useCallback(() => {
    setViewMode((prev) => {
      if (prev === 'split') return 'edit'
      if (prev === 'edit') return 'preview'
      return 'split'
    })
  }, [])

  // Sync scroll between editor and preview
  const handleEditorScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (viewMode !== 'split' || !previewRef.current) return

    const textarea = e.currentTarget
    const percentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight)
    const preview = previewRef.current

    if (preview.scrollHeight > preview.clientHeight) {
      preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight)
    }
  }, [viewMode])

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-card', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Markdown Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={togglePreview}
            className="h-8"
          >
            {isPreviewVisible ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show Preview
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cycleViewMode}
            className="h-8"
          >
            {viewMode === 'split' && (
              <>
                <Columns2 className="h-4 w-4 mr-1" />
                Split
              </>
            )}
            {viewMode === 'edit' && (
              <>
                <FileText className="h-4 w-4 mr-1" />
                Edit
              </>
            )}
            {viewMode === 'preview' && (
              <>
                <Maximize2 className="h-4 w-4 mr-1" />
                Preview
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div
        className={cn(
          'flex',
          viewMode === 'split' && isPreviewVisible ? 'flex-row' : 'flex-col',
          viewMode === 'split' && isPreviewVisible && 'h-[500px]'
        )}
        style={{ minHeight: viewMode !== 'split' || !isPreviewVisible ? minHeight : undefined }}
      >
        {/* Editor Pane */}
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div
            className={cn(
              'border-r',
              viewMode === 'split' && isPreviewVisible ? 'w-1/2' : 'w-full'
            )}
          >
            <Textarea
              ref={editorRef}
              value={value}
              onChange={handleChange}
              onScroll={handleEditorScroll}
              placeholder={placeholder}
              className={cn(
                'w-full h-full resize-none border-0 focus-visible:ring-0 rounded-none',
                'font-mono text-sm bg-background'
              )}
              style={{ minHeight: viewMode !== 'split' || !isPreviewVisible ? minHeight : undefined }}
            />
          </div>
        )}

        {/* Preview Pane */}
        {isPreviewVisible && (viewMode === 'split' || viewMode === 'preview') && (
          <div
            ref={previewRef}
            className={cn(
              'overflow-auto bg-muted/20',
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            )}
            style={{ minHeight: viewMode === 'preview' ? minHeight : undefined }}
          >
            <div className="p-4">
              <MarkdownPreview content={value} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
