'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function createInvitation(email: string, role: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                fullName: true,
                organizationId: true,
                role: true,
                organization: {
                    select: { name: true }
                }
            }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not in an organization' }
        }

        // Check permissions (only admin/manager can invite)
        if (user.role !== 'admin' && user.role !== 'manager') {
            return { success: false, error: 'Insufficient permissions' }
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return { success: false, error: 'User already exists' }
        }

        // Check for existing pending invitation
        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                email,
                organizationId: user.organizationId,
                status: 'pending'
            }
        })

        if (existingInvitation) {
            return { success: false, error: 'Invitation already sent to this email' }
        }

        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

        // Create invitation
        await prisma.invitation.create({
            data: {
                organizationId: user.organizationId,
                email,
                role,
                token,
                invitedById: user.id,
                expiresAt
            }
        })

        // Send invitation email
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`

        try {
            await sendInvitationEmail({
                to: email,
                inviterName: user.fullName || user.email,
                organizationName: user.organization?.name || 'the organization',
                invitationUrl,
                role,
            })
        } catch (emailError) {
            console.error('Error sending invitation email:', emailError)
            // Don't fail the invitation creation if email fails
        }

        revalidatePath('/dashboard/team')

        return { success: true }
    } catch (error) {
        console.error('Error in createInvitation:', error)
        return { success: false, error: 'Failed to create invitation' }
    }
}

export async function acceptInvitation(token: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        // Find invitation
        const invitation = await prisma.invitation.findUnique({
            where: { token }
        })

        if (!invitation) {
            return { success: false, error: 'Invalid invitation' }
        }

        if (invitation.status !== 'pending') {
            return { success: false, error: 'Invitation already used' }
        }

        if (new Date() > invitation.expiresAt) {
            return { success: false, error: 'Invitation expired' }
        }

        // Get or create user
        let user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        // Update user with organization and role
        await prisma.user.update({
            where: { id: user.id },
            data: {
                organizationId: invitation.organizationId,
                role: invitation.role
            }
        })

        // Mark invitation as accepted
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: {
                status: 'accepted',
                acceptedAt: new Date()
            }
        })

        revalidatePath('/dashboard')

        return { success: true, organizationId: invitation.organizationId }
    } catch (error) {
        console.error('Error in acceptInvitation:', error)
        return { success: false, error: 'Failed to accept invitation' }
    }
}

export async function cancelInvitation(id: string) {
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

        if (user.role !== 'admin' && user.role !== 'manager') {
            return { success: false, error: 'Insufficient permissions' }
        }

        // Verify invitation belongs to user's organization
        const invitation = await prisma.invitation.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!invitation) {
            return { success: false, error: 'Invitation not found' }
        }

        // Cancel invitation
        await prisma.invitation.update({
            where: { id },
            data: { status: 'cancelled' }
        })

        revalidatePath('/dashboard/team')

        return { success: true }
    } catch (error) {
        console.error('Error in cancelInvitation:', error)
        return { success: false, error: 'Failed to cancel invitation' }
    }
}

export async function resendInvitation(id: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                fullName: true,
                organizationId: true,
                role: true,
                organization: {
                    select: { name: true }
                }
            }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not found' }
        }

        if (user.role !== 'admin' && user.role !== 'manager') {
            return { success: false, error: 'Insufficient permissions' }
        }

        // Get invitation
        const invitation = await prisma.invitation.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!invitation) {
            return { success: false, error: 'Invitation not found' }
        }

        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invitation.token}`

        // Resend email
        try {
            await sendInvitationEmail({
                to: invitation.email,
                inviterName: user.fullName || user.email,
                organizationName: user.organization?.name || 'the organization',
                invitationUrl,
                role: invitation.role,
            })
        } catch (emailError) {
            console.error('Error sending invitation email:', emailError)
            return { success: false, error: 'Failed to send email' }
        }

        revalidatePath('/dashboard/team')

        return { success: true }
    } catch (error) {
        console.error('Error in resendInvitation:', error)
        return { success: false, error: 'Failed to resend invitation' }
    }
}

export async function getInvitationByToken(token: string) {
    try {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                organization: {
                    select: { name: true }
                },
                invitedBy: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            }
        })

        if (!invitation) {
            return { success: false, error: 'Invalid invitation' }
        }

        if (invitation.status !== 'pending') {
            return { success: false, error: 'Invitation already used' }
        }

        if (new Date() > invitation.expiresAt) {
            return { success: false, error: 'Invitation expired' }
        }

        return {
            success: true,
            invitation: {
                email: invitation.email,
                role: invitation.role,
                organizationName: invitation.organization.name,
                inviterName: invitation.invitedBy?.fullName || invitation.invitedBy?.email || 'Someone'
            }
        }
    } catch (error) {
        console.error('Error in getInvitationByToken:', error)
        return { success: false, error: 'Failed to get invitation' }
    }
}
