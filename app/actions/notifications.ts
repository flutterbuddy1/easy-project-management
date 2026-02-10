'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getNotifications() {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, notifications: [] }

        // Fetch unread first, then read, limit to recent 20
        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        return { success: true, notifications, userId: session.user.id }
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return { success: false, error: 'Failed to fetch notifications', notifications: [] }
    }
}

export async function markNotificationAsRead(id: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false }

        await prisma.notification.update({
            where: { id, userId: session.user.id },
            data: { read: true }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error marking notification as read:', error)
        return { success: false }
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false }

        await prisma.notification.updateMany({
            where: { userId: session.user.id, read: false },
            data: { read: true }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error marking all notifications as read:', error)
        return { success: false }
    }
}
