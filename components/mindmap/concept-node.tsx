'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useLocale } from 'next-intl'
import { BookOpen, HelpCircle } from 'lucide-react'

// Node data shape
interface ConceptNodeData {
  label: string
  labelZh?: string | null
  description?: string | null
  descriptionZh?: string | null
  color?: string | null
  linkedFlashcardId?: string | null
  linkedQuestionId?: string | null
}

export function ConceptNode({ data, selected }: NodeProps) {
  const locale = useLocale()
  const nodeData = data as unknown as ConceptNodeData

  const displayLabel =
    locale === 'zh' && nodeData.labelZh ? nodeData.labelZh : nodeData.label

  const displayDescription =
    locale === 'zh' && nodeData.descriptionZh
      ? nodeData.descriptionZh
      : nodeData.description

  const hasLinks = nodeData.linkedFlashcardId || nodeData.linkedQuestionId
  const borderColor = nodeData.color || '#9fef00'

  return (
    <div
      className={`mindmap-node ${selected ? 'mindmap-node-selected' : ''}`}
      style={{ borderColor }}
    >
      <Handle type="target" position={Position.Top} className="mindmap-handle" />

      <div className="mindmap-node-content">
        <div className="mindmap-node-label">{displayLabel}</div>
        {displayDescription && (
          <div className="mindmap-node-description">{displayDescription}</div>
        )}
      </div>

      {hasLinks && (
        <div className="mindmap-node-links">
          {nodeData.linkedFlashcardId && (
            <BookOpen className="h-3 w-3 text-[#00d4ff]" />
          )}
          {nodeData.linkedQuestionId && (
            <HelpCircle className="h-3 w-3 text-[#ffd93d]" />
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="mindmap-handle" />
    </div>
  )
}
