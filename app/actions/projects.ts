'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface CreateProjectData {
    name: string
    description: string | null
    status: string
}

export async function createProject(data: CreateProjectData) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, organizationId: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not in an organization' }
        }

        // Create project
        const project = await prisma.project.create({
            data: {
                name: data.name,
                description: data.description,
                status: data.status,
                organizationId: user.organizationId,
                createdById: user.id
            }
        })

        revalidatePath('/dashboard/projects')

        return { success: true, project }
    } catch (error) {
        console.error('Error in createProject:', error)
        return { success: false, error: 'Failed to create project' }
    }
}

interface UpdateProjectData {
    name: string
    description: string | null
    status: string
}

export async function updateProject(id: string, data: UpdateProjectData) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        // Get user with organization
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, organizationId: true, role: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not found or not in an organization' }
        }

        // Verify project belongs to user's organization
        const project = await prisma.project.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        // Update project
        await prisma.project.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                status: data.status,
            }
        })

        revalidatePath('/dashboard/projects')
        revalidatePath(`/dashboard/projects/${id}`)

        return { success: true }
    } catch (error) {
        console.error('Error in updateProject:', error)
        return { success: false, error: 'Failed to update project' }
    }
}

export async function deleteProject(id: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, organizationId: true, role: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not found' }
        }

        // Verify project belongs to user's organization
        const project = await prisma.project.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        if (project._count.tasks > 0) {
            return {
                success: false,
                error: 'Cannot delete project with existing tasks. Please delete all tasks first.'
            }
        }

        // Delete project (cascades to tasks due to schema)
        await prisma.project.delete({
            where: { id }
        })

        revalidatePath('/dashboard/projects')

        return { success: true }
    } catch (error) {
        console.error('Error in deleteProject:', error)
        return { success: false, error: 'Failed to delete project' }
    }
}
// ... existing code ...

export async function getProjects() {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not in organization', projects: [] }
        }

        const projects = await prisma.project.findMany({
            where: {
                organizationId: user.organizationId
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true
            }
        })

        return { success: true, projects }
    } catch (error) {
        console.error('Error fetching projects:', error)
        return { success: false, error: 'Failed to fetch projects', projects: [] }
    }
}
