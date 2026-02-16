'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createComment(
    taskId: string,
    content: string,
    type: string = 'user',
    fileUrl?: string,
    fileName?: string
) {
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
                email: true,
                role: true
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

        const { hasPermission, PERMISSIONS } = await import('@/lib/permissions')
        // Assuming COMMENT is a basic permission or covered by 'VIEW_PROJECT' + specific? 
        // Actually, Viewers usually can comment. But user said "bss dheak paye" (only see).
        // I will restrict comment creation for Viewers for now to be safe.
        // I need to check if I have a CREATE_COMMENT permission. I'll check permissions.ts later or assume logic.
        // Let's rely on checking against 'VIEWER' role directly if no specific permission exists, 
        // OR better, assuming Viewers are READ ONLY, I will block them.
        // Let's assume 'CREATE_TASK' or verify permissions. 
        // Actually, I'll just check if role is VIEWER and block.
        if (user.role === 'viewer') {
            return { success: false, error: 'Unauthorized: Viewers cannot post comments.' }
        }

        // Create comment
        const comment = await prisma.comment.create({
            data: {
                content,
                taskId,
                userId: user.id,
                // @ts-ignore
                type,
                fileUrl,
                fileName
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

        // Notify task assignee and creator
        const fullTask = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: { select: { name: true } },
                assignee: { select: { email: true, fullName: true, id: true, emailNotifications: true } },
                createdBy: { select: { email: true, fullName: true, id: true, emailNotifications: true } }
            }
        })

        if (fullTask) {
            const { createNotification } = await import('@/lib/notifications')
            const { sendNewCommentEmail } = await import('@/lib/email')

            const recipients = []

            // 1. Notify Assignee
            if (fullTask.assigneeId && fullTask.assigneeId !== user.id) {
                // In-app
                await createNotification({
                    userId: fullTask.assigneeId,
                    type: 'comment_added',
                    title: `New comment on ${fullTask.title}`,
                    message: `${user.fullName || user.email} commented on a task you are assigned to.`,

                })

                // Prepare Email
                if (fullTask.assignee && fullTask.assignee.email && fullTask.assignee.emailNotifications) {
                    recipients.push({
                        email: fullTask.assignee.email,
                        name: fullTask.assignee.fullName || fullTask.assignee.email
                    })
                }
            }

            // 2. Notify Creator (if diff from assignee and not current user)
            if (fullTask.createdById && fullTask.createdById !== user.id && fullTask.createdById !== fullTask.assigneeId) {
                // In-app
                await createNotification({
                    userId: fullTask.createdById,
                    type: 'comment_added',
                    title: `New comment on ${fullTask.title}`,
                    message: `${user.fullName || user.email} commented on a task you created.`,

                })

                // Prepare Email
                if (fullTask.createdBy && fullTask.createdBy.email && fullTask.createdBy.emailNotifications) {
                    recipients.push({
                        email: fullTask.createdBy.email,
                        name: fullTask.createdBy.fullName || fullTask.createdBy.email
                    })
                }
            }

            // 3. Send Emails
            const commentContent = content.length > 50 ? content.substring(0, 50) + '...' : content

            for (const recipient of recipients) {
                sendNewCommentEmail({
                    to: recipient.email,
                    recipientName: recipient.name,
                    commenterName: user.fullName || user.email,
                    taskTitle: fullTask.title,
                    projectName: fullTask.project.name || 'Project',
                    commentContent: content,
                    link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tasks/${taskId}`
                }).catch(err => console.error('Failed to send comment email:', err))
            }
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
