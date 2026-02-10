'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createComment(taskId: string, content: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                organizationId: true,
                fullName: true,
                email: true
            }
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

        // Create comment
        const comment = await prisma.comment.create({
            data: {
                content,
                taskId,
                userId: user.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        avatarUrl: true
                    }
                }
            }
        })

        revalidatePath(`/dashboard/tasks/${taskId}`)

        // Notify task assignee if someone else commented
        // Also notify task owner? For now, just assignee and maybe owner if different.
        const fullTask = await prisma.task.findUnique({ where: { id: taskId } }) // Renamed to fullTask to avoid conflict with 'task' above

        if (fullTask && fullTask.assigneeId && fullTask.assigneeId !== user.id) {
            const { createNotification } = await import('@/lib/notifications')
            await createNotification({
                userId: fullTask.assigneeId,
                title: 'New Comment',
                message: `${user.fullName || user.email} commented on "${fullTask.title}"`,
                type: 'comment_added',
                link: `/dashboard/tasks/${taskId}`
            })
        }

        // Notify task creator if different from commenter and assignee
        if (fullTask && fullTask.createdById && fullTask.createdById !== user.id && fullTask.createdById !== fullTask.assigneeId) {
            const { createNotification } = await import('@/lib/notifications')
            await createNotification({
                userId: fullTask.createdById,
                title: 'New Comment',
                message: `${user.fullName || user.email} commented on "${fullTask.title}"`,
                type: 'comment_added',
                link: `/dashboard/tasks/${taskId}`
            })
        }

        return { success: true, comment }
    } catch (error) {
        console.error('Error in createComment:', error)
        return { success: false, error: 'Failed to create comment' }
    }
}

export async function updateComment(id: string, content: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        // Verify comment belongs to user
        const comment = await prisma.comment.findFirst({
            where: {
                id,
                userId: user.id
            }
        })

        if (!comment) {
            return { success: false, error: 'Comment not found or unauthorized' }
        }

        // Update comment
        await prisma.comment.update({
            where: { id },
            data: { content }
        })

        revalidatePath(`/dashboard/tasks/${comment.taskId}`)

        return { success: true }
    } catch (error) {
        console.error('Error in updateComment:', error)
        return { success: false, error: 'Failed to update comment' }
    }
}

export async function deleteComment(id: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        // Verify comment belongs to user
        const comment = await prisma.comment.findFirst({
            where: {
                id,
                userId: user.id
            }
        })

        if (!comment) {
            return { success: false, error: 'Comment not found or unauthorized' }
        }

        // Delete comment
        await prisma.comment.delete({
            where: { id }
        })

        revalidatePath(`/dashboard/tasks/${comment.taskId}`)

        return { success: true }
    } catch (error) {
        console.error('Error in deleteComment:', error)
        return { success: false, error: 'Failed to delete comment' }
    }
}
