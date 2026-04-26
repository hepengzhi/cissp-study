'use client'

import {
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react'
import { useLocale } from 'next-intl'

interface RelationEdgeData {
  labelZh?: string | null
}

export function RelationEdge(props: EdgeProps) {
  const locale = useLocale()
  const { sourceX, sourceY, targetX, targetY, label, data, markerEnd } = props

  const edgeData = data as RelationEdgeData | undefined
  const displayLabel =
    locale === 'zh' && edgeData?.labelZh ? edgeData.labelZh : label

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        className="mindmap-edge"
      />
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            className="mindmap-edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
