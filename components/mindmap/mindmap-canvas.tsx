'use client'

import { useCallback, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Maximize } from 'lucide-react'
import { createNode, updateNode, deleteNode, createEdge, deleteEdge } from '@/lib/actions/mindmaps'
import { ConceptNode } from './concept-node'
import { RelationEdge } from './relation-edge'
import { NodeEditPanel } from './node-edit-panel'

const nodeTypes = { conceptNode: ConceptNode }
const edgeTypes = { relationEdge: RelationEdge }

interface MindMapCanvasProps {
  mindMap: {
    id: string
    domain: string
    nodes: any[]
    edges: any[]
  }
  locale: string
}

export function MindMapCanvas({ mindMap, locale }: MindMapCanvasProps) {
  const t = useTranslations('mindmaps')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<Node | null>(null)
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null)
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Convert DB nodes/edges to ReactFlow format
  const initialNodes: Node[] = mindMap.nodes.map((n) => ({
    id: n.id,
    type: 'conceptNode',
    position: { x: n.positionX, y: n.positionY },
    data: {
      label: n.label,
      labelZh: n.labelZh,
      description: n.description,
      descriptionZh: n.descriptionZh,
      color: n.color,
      linkedFlashcardId: n.linkedFlashcardId,
      linkedQuestionId: n.linkedQuestionId,
    },
  }))

  const initialEdges: Edge[] = mindMap.edges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    label: e.label || undefined,
    data: { labelZh: e.labelZh },
    type: 'relationEdge',
    animated: true,
  }))

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const { fitView } = useReactFlow()

  // --- Handlers ---

  // Double-click canvas to add a new node
  const onDoubleClick = useCallback(
    async (event: React.MouseEvent) => {
      setIsAddingNode(true)
      try {
        const rfInstance = reactFlowInstanceRef.current
        if (!rfInstance) return

        const position = rfInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })

        const result = await createNode({
          mindMapId: mindMap.id,
          label: 'New Concept',
          positionX: position.x,
          positionY: position.y,
        })

        if (!('error' in result)) {
          const newNode: Node = {
            id: result.id,
            type: 'conceptNode',
            position: { x: result.positionX, y: result.positionY },
            data: {
              label: result.label,
              labelZh: result.labelZh,
              description: result.description,
              descriptionZh: result.descriptionZh,
              color: result.color,
              linkedFlashcardId: result.linkedFlashcardId,
              linkedQuestionId: result.linkedQuestionId,
            },
          }
          setNodes((nds) => [...nds, newNode])
        }
      } finally {
        setIsAddingNode(false)
      }
    },
    [mindMap.id, setNodes]
  )

  // Connect nodes via drag to create an edge
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return

      const result = await createEdge({
        mindMapId: mindMap.id,
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
      })

      if (!('error' in result)) {
        setEdges((eds) =>
          addEdge(
            {
              id: result.id,
              source: connection.source!,
              target: connection.target!,
              animated: true,
            },
            eds
          )
        )
      }
    },
    [mindMap.id, setEdges]
  )

  // Node drag end: persist new position to database
  const onNodeDragStop = useCallback(
    async (_event: any, node: Node) => {
      await updateNode(node.id, {
        positionX: node.position.x,
        positionY: node.position.y,
      })
    },
    []
  )

  // Delete selected node or edge
  const handleDelete = useCallback(async () => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      if (selectedNodeId) {
        const result = await deleteNode(selectedNodeId)
        if (!('error' in result)) {
          setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId))
          setEdges((eds) =>
            eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)
          )
          setSelectedNodeId(null)
        }
      } else if (selectedEdgeId) {
        const result = await deleteEdge(selectedEdgeId)
        if (!('error' in result)) {
          setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId))
          setSelectedEdgeId(null)
        }
      }
    } finally {
      setIsDeleting(false)
    }
  }, [isDeleting, selectedNodeId, selectedEdgeId, setNodes, setEdges])

  // Add node at center of current viewport
  const handleAddNode = useCallback(async () => {
    setIsAddingNode(true)
    try {
      const rfInstance = reactFlowInstanceRef.current
      // Default to center if no instance
      const position = rfInstance
        ? rfInstance.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          })
        : { x: 250, y: 250 }

      const result = await createNode({
        mindMapId: mindMap.id,
        label: 'New Concept',
        positionX: position.x,
        positionY: position.y,
      })

      if (!('error' in result)) {
        const newNode: Node = {
          id: result.id,
          type: 'conceptNode',
          position: { x: result.positionX, y: result.positionY },
          data: {
            label: result.label,
            labelZh: result.labelZh,
            description: result.description,
            descriptionZh: result.descriptionZh,
            color: result.color,
            linkedFlashcardId: result.linkedFlashcardId,
            linkedQuestionId: result.linkedQuestionId,
          },
        }
        setNodes((nds) => [...nds, newNode])
      }
    } finally {
      setIsAddingNode(false)
    }
  }, [mindMap.id, setNodes])

  // Fit view to show all nodes
  const handleFitView = useCallback(() => {
    fitView({ duration: 400, padding: 0.3 })
  }, [fitView])

  // Selection handlers
  const onNodeClick = useCallback((_event: any, node: Node) => {
    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
  }, [])

  const onEdgeClick = useCallback((_event: any, edge: Edge) => {
    setSelectedEdgeId(edge.id)
    setSelectedNodeId(null)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }, [])

  // Double-click node → open edit panel
  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setEditingNode(node)
    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
  }, [])

  // After edit panel saves, refresh node data and close
  const handleEditSaved = useCallback(() => {
    if (editingNode) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === editingNode.id
            ? { ...n, data: editingNode.data }
            : n
        )
      )
    }
    setEditingNode(null)
  }, [editingNode, setNodes])

  const disableDelete = !selectedNodeId && !selectedEdgeId

  return (
    <div className="mindmap-canvas" style={{ height: 'calc(100vh - 56px)', position: 'relative' }}>
      {/* Left toolbar: glass-morphism vertical bar */}
      <div
        className="mindmap-toolbar"
        style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <ToolbarButton
          onClick={handleAddNode}
          disabled={isAddingNode}
          title={t('addNode')}
          icon={<Plus className="h-5 w-5" />}
        />
        <ToolbarButton
          onClick={handleDelete}
          disabled={disableDelete || isDeleting}
          title={t('deleteNode')}
          icon={<Trash2 className="h-5 w-5" />}
        />
        <ToolbarButton
          onClick={handleFitView}
          disabled={false}
          title={t('fitView')}
          icon={<Maximize className="h-5 w-5" />}
        />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDoubleClick={onDoubleClick}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance
        }}
        fitView
        deleteKeyCode={'Delete'}
        multiSelectionKeyCode={'Shift'}
        defaultEdgeOptions={{ animated: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#30363d" />
        <Controls className="[&>button]:!bg-[#161b22] [&>button]:!border-[#30363d] [&>button]:!text-[#a0aec0]" />
        <MiniMap nodeColor="#9fef00" maskColor="rgba(13, 17, 23, 0.7)" />
      </ReactFlow>

      {/* Node edit side panel */}
      <NodeEditPanel
        node={editingNode as any}
        onClose={() => setEditingNode(null)}
        onSaved={handleEditSaved}
      />
    </div>
  )
}

// Internal toolbar button with glass-morphism styling
function ToolbarButton({
  onClick,
  disabled,
  title,
  icon,
}: {
  onClick: () => void
  disabled: boolean
  title: string
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="mindmap-toolbar-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 8,
        border: '1px solid rgba(48, 54, 61, 0.6)',
        background: 'rgba(22, 27, 34, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: '#a0aec0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'rgba(159, 239, 0, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(159, 239, 0, 0.3)'
          e.currentTarget.style.color = '#9fef00'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(22, 27, 34, 0.75)'
        e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.6)'
        e.currentTarget.style.color = '#a0aec0'
      }}
    >
      {icon}
    </button>
  )
}
