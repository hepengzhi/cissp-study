'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { updateNode } from '@/lib/actions/mindmaps'

const CYBER_COLORS = [
  '#9fef00', '#00d4ff', '#ff6b6b', '#ffd93d',
  '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894',
]

interface NodeEditPanelProps {
  node: {
    id: string
    data: {
      label: string
      labelZh?: string | null
      description?: string | null
      descriptionZh?: string | null
      color?: string | null
      linkedFlashcardId?: string | null
      linkedQuestionId?: string | null
    }
  } | null
  onClose: () => void
  onSaved: () => void
}

export function NodeEditPanel({ node, onClose, onSaved }: NodeEditPanelProps) {
  const t = useTranslations('mindmaps')
  const tCommon = useTranslations('common')

  const [label, setLabel] = useState('')
  const [labelZh, setLabelZh] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionZh, setDescriptionZh] = useState('')
  const [color, setColor] = useState('#9fef00')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (node) {
      setLabel(node.data.label || '')
      setLabelZh(node.data.labelZh || '')
      setDescription(node.data.description || '')
      setDescriptionZh(node.data.descriptionZh || '')
      setColor(node.data.color || '#9fef00')
    }
  }, [node])

  if (!node) return null

  const handleSave = async () => {
    if (!label.trim()) return
    setSaving(true)
    try {
      await updateNode(node.id, {
        label: label.trim(),
        labelZh: labelZh.trim() || undefined,
        description: description.trim() || undefined,
        descriptionZh: descriptionZh.trim() || undefined,
        color,
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mindmap-edit-panel">
      <div className="mindmap-edit-panel-header">
        <h3 className="text-lg font-semibold page-title">{t('editNode')}</h3>
        <button onClick={onClose} className="p-1 hover:bg-[#161b22] rounded transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mindmap-edit-panel-body">
        {/* Label EN */}
        <label className="mindmap-field-label">{t('label')}</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mindmap-input"
          required
        />

        {/* Label ZH */}
        <label className="mindmap-field-label">{t('labelZh')}</label>
        <input
          type="text"
          value={labelZh}
          onChange={(e) => setLabelZh(e.target.value)}
          className="mindmap-input"
        />

        {/* Description EN */}
        <label className="mindmap-field-label">{t('description')}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mindmap-input mindmap-textarea"
          rows={3}
        />

        {/* Description ZH */}
        <label className="mindmap-field-label">{t('descriptionZh')}</label>
        <textarea
          value={descriptionZh}
          onChange={(e) => setDescriptionZh(e.target.value)}
          className="mindmap-input mindmap-textarea"
          rows={3}
        />

        {/* Color Picker */}
        <label className="mindmap-field-label">{t('color')}</label>
        <div className="mindmap-color-picker">
          {CYBER_COLORS.map((c) => (
            <button
              key={c}
              className={`mindmap-color-swatch${color === c ? ' mindmap-color-swatch-active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 htb-button-secondary">
            {tCommon('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !label.trim()}
            className="flex-1 htb-button"
          >
            {saving ? tCommon('loading') : tCommon('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
