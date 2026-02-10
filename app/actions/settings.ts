'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function updateProfile(data: { fullName: string }) {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: 'Not authenticated' }

        await prisma.user.update({
            where: { email: session.user.email },
            data: { fullName: data.fullName }
        })

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error) {
        console.error('Error updating profile:', error)
        return { success: false, error: 'Failed to update profile' }
    }
}

export async function updateOrganization(data: { name: string }) {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: 'Not authenticated' }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { organizationId: true, role: true }
        })

        if (!user || !user.organizationId) return { success: false, error: 'User not in organization' }
        if (user.role !== 'owner' && user.role !== 'admin') {
            return { success: false, error: 'Unauthorized: Only admins can update organization settings' }
        }

        await prisma.organization.update({
            where: { id: user.organizationId },
            data: { name: data.name }
        })

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error) {
        console.error('Error updating organization:', error)
        return { success: false, error: 'Failed to update organization' }
    }
}

export async function changePassword(data: { current: string, new: string }) {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: 'Not authenticated' }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user || !user.password) {
            return { success: false, error: 'User not found or uses OAuth' }
        }

        const isValid = await bcrypt.compare(data.current, user.password)
        if (!isValid) {
            return { success: false, error: 'Incorrect current password' }
        }

        const hashedPassword = await bcrypt.hash(data.new, 10)

        await prisma.user.update({
            where: { email: session.user.email },
            data: { password: hashedPassword }
        })

        return { success: true }
    } catch (error) {
        console.error('Error changing password:', error)
        return { success: false, error: 'Failed to change password' }
    }
}
