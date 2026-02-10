'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProjectMessages(projectId: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const messages = await prisma.message.findMany({
            where: { projectId },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            },
            take: 50 // Limit initial load
        })

        return { success: true, messages }
    } catch (error) {
        console.error('Error fetching messages:', error)
        return { success: false, error: 'Failed to fetch messages' }
    }
}

export async function sendMessage(projectId: string, content: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        const message = await prisma.message.create({
            data: {
                content,
                projectId,
                userId: user.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                        email: true
                    }
                }
            }
        })

        return { success: true, message }
    } catch (error) {
        console.error('Error sending message:', error)
        return { success: false, error: 'Failed to send message' }
    }
}
