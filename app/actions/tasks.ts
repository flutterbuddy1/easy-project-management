'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface CreateTaskData {
    title: string
    description: string | null
    projectId: string
    status: string
    priority: string
    assigneeId: string | null
}

export async function createTask(data: CreateTaskData) {
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

        // Verify project belongs to user's organization
        const project = await prisma.project.findFirst({
            where: {
                id: data.projectId,
                organizationId: user.organizationId
            }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        // Create task
        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                projectId: data.projectId,
                status: data.status,
                priority: data.priority,
                assigneeId: data.assigneeId,
                createdById: user.id
            }
        })

        revalidatePath('/dashboard/projects')
        revalidatePath(`/dashboard/projects/${data.projectId}`)
        revalidatePath('/dashboard/tasks')

        // Notify assignee if one exists
        if (data.assigneeId && data.assigneeId !== user.id) {
            const { createNotification } = await import('@/lib/notifications')
            const { EmailTemplates } = await import('@/lib/email')

            const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } })

            if (assignee) {
                const emailData = EmailTemplates.taskAssigned({
                    assigneeName: assignee.fullName || 'User',
                    taskTitle: task.title,
                    projectName: project.name,
                    assignerName: user.name || user.email, // Using user from auth session which has 'name' or DB user which has 'fullName'?
                    // Session user type might be different, let's use the DB user we fetched
                    link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tasks/${task.id}`
                })
                // Fix assigner name using fetched user
                emailData.html = emailData.html.replace(user.name || user.email || '', (user as any).fullName || user.email)
                emailData.text = emailData.text.replace(user.name || user.email || '', (user as any).fullName || user.email)

                await createNotification({
                    userId: data.assigneeId,
                    title: 'New Task Assigned',
                    message: `You have been assigned to task "${task.title}" in ${project.name}`,
                    type: 'task_assigned',
                    link: `/dashboard/tasks/${task.id}`,
                    emailData
                })
            }
        }

        // ... existing createTask ...
        return { success: true, task }
    } catch (error) {
        console.error('Error in createTask:', error)
        return { success: false, error: 'Failed to create task' }
    }
}

// ... existing imports ...

export async function getTasks({
    userId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    priority,
    search
}: {
    userId: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    status?: string
    priority?: string
    search?: string
}) {
    try {
        const where: any = {
            assigneeId: userId
        }

        if (status && status !== 'all') {
            where.status = status
        }

        if (priority && priority !== 'all') {
            where.priority = priority
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { project: { name: { contains: search, mode: 'insensitive' } } }
            ]
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        organization: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: {
                [sortBy]: sortOrder
            }
        })
        return { success: true, tasks }
    } catch (error) {
        console.error('Error in getTasks:', error)
        return { success: false, error: 'Failed to fetch tasks', tasks: [] }
    }
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
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
            return { success: false, error: 'User not found' }
        }

        // Verify task belongs to user's organization
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: {
                    organizationId: user.organizationId
                }
            }
        })

        if (!task) {
            return { success: false, error: 'Task not found' }
        }

        // Update task status
        await prisma.task.update({
            where: { id: taskId },
            data: { status: newStatus }
        })

        revalidatePath('/dashboard/projects')
        revalidatePath(`/dashboard/tasks/${taskId}`)

        // Notify if task is completed or status changed distinctively?
        // Let's notify assignee if someone ELSE moved it (e.g. manager)
        if (task.assigneeId && task.assigneeId !== user.id) {
            const { createNotification } = await import('@/lib/notifications')
            await createNotification({
                userId: task.assigneeId,
                title: 'Task Updated',
                message: `Task "${task.title}" status changed to ${newStatus}`,
                type: 'task_updated',
                link: `/dashboard/tasks/${taskId}`
                // No email for status change to avoid spam, just in-app
            })
        }

        return { success: true }
    } catch (error) {
        console.error('Error in updateTaskStatus:', error)
        return { success: false, error: 'Failed to update task status' }
    }
}

interface UpdateTaskData {
    title: string
    description: string | null
    status: string
    priority: string
    assigneeId: string | null
    projectId: string
}

export async function updateTask(id: string, data: UpdateTaskData) {
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
            return { success: false, error: 'User not found' }
        }

        // Verify task belongs to user's organization
        const task = await prisma.task.findFirst({
            where: {
                id,
                project: {
                    organizationId: user.organizationId
                }
            }
        })

        if (!task) {
            return { success: false, error: 'Task not found' }
        }

        // Update task
        await prisma.task.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                assigneeId: data.assigneeId,
            }
        })

        revalidatePath('/dashboard/projects')
        revalidatePath(`/dashboard/projects/${data.projectId}`)
        revalidatePath('/dashboard/tasks')
        revalidatePath(`/dashboard/tasks/${id}`)

        return { success: true }
    } catch (error) {
        console.error('Error in updateTask:', error)
        return { success: false, error: 'Failed to update task' }
    }
}

export async function deleteTask(id: string) {
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
            return { success: false, error: 'User not found' }
        }

        // Verify task belongs to user's organization
        const task = await prisma.task.findFirst({
            where: {
                id,
                project: {
                    organizationId: user.organizationId
                }
            }
        })

        if (!task) {
            return { success: false, error: 'Task not found' }
        }

        // Delete task (cascades to comments)
        await prisma.task.delete({
            where: { id }
        })

        revalidatePath('/dashboard/projects')
        revalidatePath('/dashboard/tasks')

        return { success: true }
    } catch (error) {
        console.error('Error in deleteTask:', error)
        return { success: false, error: 'Failed to delete task' }
    }
}
