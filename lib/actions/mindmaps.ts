'use server'

import { prisma } from '@/prisma/config'
import { z } from 'zod'
import { Domain } from '@prisma/client'

// --- Schemas ---

const CreateNodeSchema = z.object({
  mindMapId: z.string().min(1),
  label: z.string().min(1),
  labelZh: z.string().optional(),
  description: z.string().optional(),
  descriptionZh: z.string().optional(),
  positionX: z.number().default(250),
  positionY: z.number().default(250),
  color: z.string().optional(),
  linkedFlashcardId: z.string().optional(),
  linkedQuestionId: z.string().optional(),
})

const UpdateNodeSchema = z.object({
  label: z.string().min(1).optional(),
  labelZh: z.string().optional(),
  description: z.string().optional(),
  descriptionZh: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  color: z.string().optional(),
  linkedFlashcardId: z.string().nullable().optional(),
  linkedQuestionId: z.string().nullable().optional(),
})

const CreateEdgeSchema = z.object({
  mindMapId: z.string().min(1),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  label: z.string().optional(),
  labelZh: z.string().optional(),
})

const UpdateEdgeSchema = z.object({
  label: z.string().optional(),
  labelZh: z.string().optional(),
})

const ALL_DOMAINS: Domain[] = [
  'SECURITY_RISK_MANAGEMENT',
  'ASSET_SECURITY',
  'SECURITY_ARCHITECTURE',
  'COMMUNICATION_NETWORK_SECURITY',
  'IDENTITY_ACCESS_MANAGEMENT',
  'SECURITY_ASSESSMENT',
  'SECURITY_OPERATIONS',
  'SOFTWARE_DEVELOPMENT_SECURITY',
]

// --- 1. getMindMapByDomain ---

export async function getMindMapByDomain(domain: Domain) {
  try {
    let mindMap = await prisma.mindMap.findUnique({
      where: { domain },
      include: {
        nodes: true,
        edges: true,
      },
    })

    if (!mindMap) {
      mindMap = await prisma.mindMap.create({
        data: { domain },
        include: {
          nodes: true,
          edges: true,
        },
      })
    }

    return mindMap
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

// --- 2. createNode ---

export async function createNode(data: z.infer<typeof CreateNodeSchema>) {
  try {
    const validated = CreateNodeSchema.parse(data)

    return await prisma.mindMapNode.create({
      data: {
        mindMapId: validated.mindMapId,
        label: validated.label,
        labelZh: validated.labelZh,
        description: validated.description,
        descriptionZh: validated.descriptionZh,
        positionX: validated.positionX,
        positionY: validated.positionY,
        color: validated.color,
        linkedFlashcardId: validated.linkedFlashcardId,
        linkedQuestionId: validated.linkedQuestionId,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues
        .map((e) => {
          const path = e.path.length > 0 ? e.path.join('.') : 'unknown'
          return `${path}: ${e.message}`
        })
        .join(', ')
      return { error: 'Validation failed: ' + messages }
    }
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

// --- 3. updateNode ---

export async function updateNode(
  nodeId: string,
  data: z.infer<typeof UpdateNodeSchema>
) {
  try {
    const validated = UpdateNodeSchema.parse(data)

    return await prisma.mindMapNode.update({
      where: { id: nodeId },
      data: {
        ...(validated.label !== undefined && { label: validated.label }),
        ...(validated.labelZh !== undefined && { labelZh: validated.labelZh }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.descriptionZh !== undefined && { descriptionZh: validated.descriptionZh }),
        ...(validated.positionX !== undefined && { positionX: validated.positionX }),
        ...(validated.positionY !== undefined && { positionY: validated.positionY }),
        ...(validated.color !== undefined && { color: validated.color }),
        ...(validated.linkedFlashcardId !== undefined && { linkedFlashcardId: validated.linkedFlashcardId }),
        ...(validated.linkedQuestionId !== undefined && { linkedQuestionId: validated.linkedQuestionId }),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues
        .map((e) => {
          const path = e.path.length > 0 ? e.path.join('.') : 'unknown'
          return `${path}: ${e.message}`
        })
        .join(', ')
      return { error: 'Validation failed: ' + messages }
    }
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

// --- 4. deleteNode ---

export async function deleteNode(nodeId: string) {
  try {
    await prisma.mindMapNode.delete({
      where: { id: nodeId },
    })
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

// --- 5. createEdge ---

export async function createEdge(data: z.infer<typeof CreateEdgeSchema>) {
  try {
    const validated = CreateEdgeSchema.parse(data)

    // Check for duplicate edge
    const existing = await prisma.mindMapEdge.findFirst({
      where: {
        mindMapId: validated.mindMapId,
        sourceNodeId: validated.sourceNodeId,
        targetNodeId: validated.targetNodeId,
      },
    })

    if (existing) {
      return { error: 'Edge already exists' }
    }

    return await prisma.mindMapEdge.create({
      data: {
        mindMapId: validated.mindMapId,
        sourceNodeId: validated.sourceNodeId,
        targetNodeId: validated.targetNodeId,
        label: validated.label,
        labelZh: validated.labelZh,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues
        .map((e) => {
          const path = e.path.length > 0 ? e.path.join('.') : 'unknown'
          return `${path}: ${e.message}`
        })
        .join(', ')
      return { error: 'Validation failed: ' + messages }
    }
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

// --- 6. updateEdge ---

export async function updateEdge(
  edgeId: string,
  data: z.infer<typeof UpdateEdgeSchema>
) {
  try {
    const validated = UpdateEdgeSchema.parse(data)

    return await prisma.mindMapEdge.update({
      where: { id: edgeId },
      data: {
        ...(validated.label !== undefined && { label: validated.label }),
        ...(validated.labelZh !== undefined && { labelZh: validated.labelZh }),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues
        .map((e) => {
          const path = e.path.length > 0 ? e.path.join('.') : 'unknown'
          return `${path}: ${e.message}`
        })
        .join(', ')
      return { error: 'Validation failed: ' + messages }
    }
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

// --- 7. deleteEdge ---

export async function deleteEdge(edgeId: string) {
  try {
    await prisma.mindMapEdge.delete({
      where: { id: edgeId },
    })
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}

// --- 8. getMindMapStats ---

export async function getMindMapStats() {
  try {
    const stats = await Promise.all(
      ALL_DOMAINS.map(async (domain) => {
        const mindMap = await prisma.mindMap.findUnique({
          where: { domain },
          include: {
            _count: {
              select: { nodes: true, edges: true },
            },
          },
        })

        return {
          domain,
          nodeCount: mindMap ? mindMap._count.nodes : 0,
          edgeCount: mindMap ? mindMap._count.edges : 0,
          lastEdited: mindMap ? mindMap.updatedAt : null,
        }
      })
    )

    return stats
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Unknown error occurred' }
  }
}
