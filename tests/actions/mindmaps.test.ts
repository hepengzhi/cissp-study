import {
  getMindMapByDomain,
  createNode,
  updateNode,
  deleteNode,
  createEdge,
  updateEdge,
  deleteEdge,
  getMindMapStats,
} from '@/lib/actions/mindmaps'
import { beforeEach, vi, describe, it, expect } from 'vitest'
import { mockPrisma } from '../prisma-mock'

describe('MindMap Actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  describe('getMindMapByDomain', () => {
    it('should return existing mind map with nodes and edges', async () => {
      const mockMindMap = {
        id: 'map-1',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        nodes: [
          {
            id: 'node-1',
            mindMapId: 'map-1',
            label: 'Root',
            labelZh: null,
            description: null,
            descriptionZh: null,
            positionX: 250,
            positionY: 250,
            color: null,
            linkedFlashcardId: null,
            linkedQuestionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        edges: [
          {
            id: 'edge-1',
            mindMapId: 'map-1',
            sourceNodeId: 'node-1',
            targetNodeId: 'node-2',
            label: null,
            labelZh: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }

      mockPrisma.mindMap.findUnique.mockResolvedValue(mockMindMap)

      const result = await getMindMapByDomain('SECURITY_RISK_MANAGEMENT')

      expect(mockPrisma.mindMap.findUnique).toHaveBeenCalledWith({
        where: { domain: 'SECURITY_RISK_MANAGEMENT' },
        include: {
          nodes: true,
          edges: true,
        },
      })
      expect(result).toEqual(mockMindMap)
      expect(result.nodes).toHaveLength(1)
      expect(result.edges).toHaveLength(1)
    })

    it('should auto-create mind map if none exists for domain', async () => {
      const newMindMap = {
        id: 'map-new',
        domain: 'ASSET_SECURITY' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        nodes: [],
        edges: [],
      }

      mockPrisma.mindMap.findUnique.mockResolvedValue(null)
      mockPrisma.mindMap.create.mockResolvedValue(newMindMap)

      const result = await getMindMapByDomain('ASSET_SECURITY')

      expect(mockPrisma.mindMap.findUnique).toHaveBeenCalledWith({
        where: { domain: 'ASSET_SECURITY' },
        include: {
          nodes: true,
          edges: true,
        },
      })
      expect(mockPrisma.mindMap.create).toHaveBeenCalledWith({
        data: { domain: 'ASSET_SECURITY' },
        include: {
          nodes: true,
          edges: true,
        },
      })
      expect(result).toEqual(newMindMap)
      expect(result.nodes).toEqual([])
      expect(result.edges).toEqual([])
    })

    it('should return error on database failure', async () => {
      mockPrisma.mindMap.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      )

      const result = await getMindMapByDomain('SECURITY_RISK_MANAGEMENT')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('createNode', () => {
    it('should create a node with required fields', async () => {
      const mockNode = {
        id: 'node-1',
        mindMapId: 'map-1',
        label: 'My Node',
        labelZh: null,
        description: null,
        descriptionZh: null,
        positionX: 250,
        positionY: 250,
        color: null,
        linkedFlashcardId: null,
        linkedQuestionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.mindMapNode.create.mockResolvedValue(mockNode)

      const result = await createNode({
        mindMapId: 'map-1',
        label: 'My Node',
      })

      expect(mockPrisma.mindMapNode.create).toHaveBeenCalledWith({
        data: {
          mindMapId: 'map-1',
          label: 'My Node',
          labelZh: undefined,
          description: undefined,
          descriptionZh: undefined,
          positionX: 250,
          positionY: 250,
          color: undefined,
          linkedFlashcardId: undefined,
          linkedQuestionId: undefined,
        },
      })
      expect(result).toEqual(mockNode)
      expect(result.label).toBe('My Node')
    })

    it('should create a node with all optional fields', async () => {
      const mockNode = {
        id: 'node-2',
        mindMapId: 'map-1',
        label: 'Detailed Node',
        labelZh: '详细节点',
        description: 'A description',
        descriptionZh: '描述',
        positionX: 400,
        positionY: 300,
        color: '#ff0000',
        linkedFlashcardId: 'fc-1',
        linkedQuestionId: 'q-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.mindMapNode.create.mockResolvedValue(mockNode)

      const result = await createNode({
        mindMapId: 'map-1',
        label: 'Detailed Node',
        labelZh: '详细节点',
        description: 'A description',
        descriptionZh: '描述',
        positionX: 400,
        positionY: 300,
        color: '#ff0000',
        linkedFlashcardId: 'fc-1',
        linkedQuestionId: 'q-1',
      })

      expect(result).toEqual(mockNode)
      expect(result.color).toBe('#ff0000')
      expect(result.labelZh).toBe('详细节点')
      expect(result.linkedFlashcardId).toBe('fc-1')
    })

    it('should return validation error for empty label', async () => {
      const result = await createNode({
        mindMapId: 'map-1',
        label: '',
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('label')
    })

    it('should return validation error for missing mindMapId', async () => {
      const result = await createNode({
        mindMapId: '',
        label: 'Test',
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('mindMapId')
    })

    it('should return database error on failure', async () => {
      mockPrisma.mindMapNode.create.mockRejectedValue(
        new Error('Database insert failed')
      )

      const result = await createNode({
        mindMapId: 'map-1',
        label: 'Test Node',
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database insert failed')
    })
  })

  describe('updateNode', () => {
    it('should update node label', async () => {
      const updatedNode = {
        id: 'node-1',
        mindMapId: 'map-1',
        label: 'Updated Label',
        labelZh: null,
        description: null,
        descriptionZh: null,
        positionX: 250,
        positionY: 250,
        color: null,
        linkedFlashcardId: null,
        linkedQuestionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.mindMapNode.update.mockResolvedValue(updatedNode)

      const result = await updateNode('node-1', {
        label: 'Updated Label',
      })

      expect(mockPrisma.mindMapNode.update).toHaveBeenCalledWith({
        where: { id: 'node-1' },
        data: {
          label: 'Updated Label',
        },
      })
      expect(result).toEqual(updatedNode)
      expect(result.label).toBe('Updated Label')
    })

    it('should update node position', async () => {
      const updatedNode = {
        id: 'node-1',
        mindMapId: 'map-1',
        label: 'My Node',
        labelZh: null,
        description: null,
        descriptionZh: null,
        positionX: 500,
        positionY: 400,
        color: null,
        linkedFlashcardId: null,
        linkedQuestionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.mindMapNode.update.mockResolvedValue(updatedNode)

      const result = await updateNode('node-1', {
        positionX: 500,
        positionY: 400,
      })

      expect(mockPrisma.mindMapNode.update).toHaveBeenCalledWith({
        where: { id: 'node-1' },
        data: {
          positionX: 500,
          positionY: 400,
        },
      })
      expect(result.positionX).toBe(500)
      expect(result.positionY).toBe(400)
    })

    it('should return validation error for empty label', async () => {
      const result = await updateNode('node-1', {
        label: '',
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('label')
    })

    it('should return database error on failure', async () => {
      mockPrisma.mindMapNode.update.mockRejectedValue(
        new Error('Database update failed')
      )

      const result = await updateNode('node-1', {
        label: 'New Label',
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database update failed')
    })
  })

  describe('deleteNode', () => {
    it('should delete a node and return success', async () => {
      mockPrisma.mindMapNode.delete.mockResolvedValue(undefined)

      const result = await deleteNode('node-1')

      expect(mockPrisma.mindMapNode.delete).toHaveBeenCalledWith({
        where: { id: 'node-1' },
      })
      expect(result).toEqual({ success: true })
    })

    it('should return database error on failure', async () => {
      mockPrisma.mindMapNode.delete.mockRejectedValue(
        new Error('Database delete failed')
      )

      const result = await deleteNode('node-1')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database delete failed')
    })
  })

  describe('createEdge', () => {
    it('should create an edge', async () => {
      const mockEdge = {
        id: 'edge-1',
        mindMapId: 'map-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
        label: null,
        labelZh: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.mindMapEdge.findFirst.mockResolvedValue(null)
      mockPrisma.mindMapEdge.create.mockResolvedValue(mockEdge)

      const result = await createEdge({
        mindMapId: 'map-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
      })

      expect(mockPrisma.mindMapEdge.findFirst).toHaveBeenCalledWith({
        where: {
          mindMapId: 'map-1',
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2',
        },
      })
      expect(mockPrisma.mindMapEdge.create).toHaveBeenCalledWith({
        data: {
          mindMapId: 'map-1',
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2',
          label: undefined,
          labelZh: undefined,
        },
      })
      expect(result).toEqual(mockEdge)
    })

    it('should return error for duplicate edge', async () => {
      const existingEdge = {
        id: 'edge-existing',
        mindMapId: 'map-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
        label: null,
        labelZh: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.mindMapEdge.findFirst.mockResolvedValue(existingEdge)

      const result = await createEdge({
        mindMapId: 'map-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Edge already exists')
      expect(mockPrisma.mindMapEdge.create).not.toHaveBeenCalled()
    })

    it('should return validation error for missing sourceNodeId', async () => {
      const result = await createEdge({
        mindMapId: 'map-1',
        sourceNodeId: '',
        targetNodeId: 'node-2',
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('sourceNodeId')
    })

    it('should return database error on failure', async () => {
      mockPrisma.mindMapEdge.findFirst.mockResolvedValue(null)
      mockPrisma.mindMapEdge.create.mockRejectedValue(
        new Error('Database edge creation failed')
      )

      const result = await createEdge({
        mindMapId: 'map-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database edge creation failed')
    })
  })

  describe('updateEdge', () => {
    it('should update edge label', async () => {
      const updatedEdge = {
        id: 'edge-1',
        mindMapId: 'map-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
        label: 'Updated relation',
        labelZh: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.mindMapEdge.update.mockResolvedValue(updatedEdge)

      const result = await updateEdge('edge-1', {
        label: 'Updated relation',
      })

      expect(mockPrisma.mindMapEdge.update).toHaveBeenCalledWith({
        where: { id: 'edge-1' },
        data: {
          label: 'Updated relation',
        },
      })
      expect(result).toEqual(updatedEdge)
      expect(result.label).toBe('Updated relation')
    })

    it('should return database error on failure', async () => {
      mockPrisma.mindMapEdge.update.mockRejectedValue(
        new Error('Database edge update failed')
      )

      const result = await updateEdge('edge-1', {
        label: 'New label',
      })

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database edge update failed')
    })
  })

  describe('deleteEdge', () => {
    it('should delete an edge and return success', async () => {
      mockPrisma.mindMapEdge.delete.mockResolvedValue(undefined)

      const result = await deleteEdge('edge-1')

      expect(mockPrisma.mindMapEdge.delete).toHaveBeenCalledWith({
        where: { id: 'edge-1' },
      })
      expect(result).toEqual({ success: true })
    })

    it('should return database error on failure', async () => {
      mockPrisma.mindMapEdge.delete.mockRejectedValue(
        new Error('Database edge delete failed')
      )

      const result = await deleteEdge('edge-1')

      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Database edge delete failed')
    })
  })

  describe('getMindMapStats', () => {
    it('should return stats for all 8 domains', async () => {
      const now = new Date()
      const mockMindMap = {
        id: 'map-1',
        domain: 'SECURITY_RISK_MANAGEMENT' as const,
        createdAt: now,
        updatedAt: now,
        _count: {
          nodes: 5,
          edges: 3,
        },
      }

      mockPrisma.mindMap.findUnique.mockResolvedValue(mockMindMap)

      const result = await getMindMapStats()

      expect(result).toBeInstanceOf(Array)
      expect(result).toHaveLength(8)
      // Verify all 8 CISSP domains are present
      const domains = result.map((s: { domain: string }) => s.domain)
      expect(domains).toContain('SECURITY_RISK_MANAGEMENT')
      expect(domains).toContain('ASSET_SECURITY')
      expect(domains).toContain('SECURITY_ARCHITECTURE')
      expect(domains).toContain('COMMUNICATION_NETWORK_SECURITY')
      expect(domains).toContain('IDENTITY_ACCESS_MANAGEMENT')
      expect(domains).toContain('SECURITY_ASSESSMENT')
      expect(domains).toContain('SECURITY_OPERATIONS')
      expect(domains).toContain('SOFTWARE_DEVELOPMENT_SECURITY')

      // Each stat should have the expected shape
      result.forEach(
        (stat: { domain: string; nodeCount: number; edgeCount: number; lastEdited: Date | null }) => {
          expect(stat).toHaveProperty('domain')
          expect(stat).toHaveProperty('nodeCount')
          expect(stat).toHaveProperty('edgeCount')
          expect(stat).toHaveProperty('lastEdited')
          expect(typeof stat.nodeCount).toBe('number')
          expect(typeof stat.edgeCount).toBe('number')
        }
      )

      // findUnique should have been called 8 times (once per domain)
      expect(mockPrisma.mindMap.findUnique).toHaveBeenCalledTimes(8)
    })

    it('should return zero counts for empty mind maps', async () => {
      mockPrisma.mindMap.findUnique.mockResolvedValue(null)

      const result = await getMindMapStats()

      expect(result).toBeInstanceOf(Array)
      expect(result).toHaveLength(8)

      result.forEach(
        (stat: { domain: string; nodeCount: number; edgeCount: number; lastEdited: Date | null }) => {
          expect(stat.nodeCount).toBe(0)
          expect(stat.edgeCount).toBe(0)
          expect(stat.lastEdited).toBeNull()
        }
      )
    })
  })
})
