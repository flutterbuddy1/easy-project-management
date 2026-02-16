'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function removeMember(memberId: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        // Get current user (requester)
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, organizationId: true, role: true }
        })

        if (!currentUser || !currentUser.organizationId) {
            return { success: false, error: 'User not in an organization' }
        }

        // Check permissions
        if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
            return { success: false, error: 'Insufficient permissions' }
        }

        // Get member to remove
        const memberToRemove = await prisma.user.findUnique({
            where: { id: memberId },
            select: { organizationId: true, role: true }
        })

        if (!memberToRemove) {
            return { success: false, error: 'Member not found' }
        }

        if (memberToRemove.organizationId !== currentUser.organizationId) {
            return { success: false, error: 'Member not in your organization' }
        }

        // Prevent removing self
        if (memberId === currentUser.id) {
            return { success: false, error: 'Cannot remove yourself' }
        }

        // Prevent manager from removing admin
        if (currentUser.role === 'manager' && memberToRemove.role === 'admin') {
            return { success: false, error: 'Managers cannot remove admins' }
        }

        // Remove member (unlink from organization)
        await prisma.user.update({
            where: { id: memberId },
            data: {
                organizationId: null,
                role: 'member' // Reset role
            }
        })

        revalidatePath('/dashboard/team')
        return { success: true }
    } catch (error) {
        console.error('Error removing member:', error)
        return { success: false, error: 'Failed to remove member' }
    }
}

export async function updateMemberRole(memberId: string, newRole: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const validRoles = ['admin', 'manager', 'member', 'viewer']
        if (!validRoles.includes(newRole)) {
            return { success: false, error: 'Invalid role' }
        }

        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, organizationId: true, role: true }
        })

        if (!currentUser || !currentUser.organizationId) {
            return { success: false, error: 'User not in an organization' }
        }

        // Check permissions
        if (currentUser.role !== 'admin') {
            return { success: false, error: 'Only admins can change roles' }
        }

        // Get member to update
        const memberToUpdate = await prisma.user.findUnique({
            where: { id: memberId },
            select: { organizationId: true }
        })

        if (!memberToUpdate) {
            return { success: false, error: 'Member not found' }
        }

        if (memberToUpdate.organizationId !== currentUser.organizationId) {
            return { success: false, error: 'Member not in your organization' }
        }

        // Update role
        await prisma.user.update({
            where: { id: memberId },
            data: { role: newRole }
        })

        revalidatePath('/dashboard/team')
        return { success: true }
    } catch (error) {
        console.error('Error updating member role:', error)
        return { success: false, error: 'Failed to update member role' }
    }
}
