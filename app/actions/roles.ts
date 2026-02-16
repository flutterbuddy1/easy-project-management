'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// Helper to check permission
async function checkRolePermission() {
    const session = await auth()
    if (!session?.user?.email) {
        throw new Error('Not authenticated')
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            role: true,
            roleRel: {
                select: {
                    permissions: { select: { action: true } }
                }
            }
        }
    })

    if (!user) {
        throw new Error('User not found')
    }

    if (!hasPermission(user.roleRel || user.role, PERMISSIONS.MANAGE_ROLES)) {
        throw new Error('Unauthorized')
    }

    return user
}

export async function getRoles() {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: 'Not authenticated' }

        // Fetch roles with their permissions
        const roles = await prisma.role.findMany({
            include: {
                permissions: true,
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { name: 'asc' }
        })

        // Fetch all available permissions for the UI to select from
        const allPermissions = await prisma.permission.findMany({
            orderBy: { group: 'asc' }
        })

        return { success: true, roles, permissions: allPermissions }
    } catch (error) {
        console.error('Error fetching roles:', error)
        return { success: false, error: 'Failed to fetch roles' }
    }
}

export async function createRole(data: { name: string; displayName: string; description?: string; permissionIds: string[] }) {
    try {
        await checkRolePermission()

        const role = await prisma.role.create({
            data: {
                name: data.name.toLowerCase().replace(/\s+/g, '_'),
                displayName: data.displayName,
                description: data.description,
                permissions: {
                    connect: data.permissionIds.map(id => ({ id }))
                }
            }
        })

        revalidatePath('/dashboard/settings/roles')
        return { success: true, role }
    } catch (error: any) {
        console.error('Error creating role:', error)
        return { success: false, error: error.message || 'Failed to create role' }
    }
}

export async function updateRole(roleId: string, data: { displayName: string; description?: string; permissionIds: string[] }) {
    try {
        await checkRolePermission()

        const role = await prisma.role.findUnique({ where: { id: roleId } })
        if (!role) return { success: false, error: 'Role not found' }

        // Don't allow changing 'admin' name or key properties if system?
        // We only allow updating display name, description and permissions.
        // System roles: prevent removing critical permissions? For now, trust the admin.

        await prisma.role.update({
            where: { id: roleId },
            data: {
                displayName: data.displayName,
                description: data.description,
                permissions: {
                    set: [], // Clear existing
                    connect: data.permissionIds.map(id => ({ id }))
                }
            }
        })

        revalidatePath('/dashboard/settings/roles')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating role:', error)
        return { success: false, error: error.message || 'Failed to update role' }
    }
}

export async function deleteRole(roleId: string) {
    try {
        await checkRolePermission()

        const role = await prisma.role.findUnique({
            where: { id: roleId },
            include: { _count: { select: { users: true } } }
        })

        if (!role) return { success: false, error: 'Role not found' }
        if (role.isSystem) return { success: false, error: 'Cannot delete system roles' }
        if (role._count.users > 0) return { success: false, error: 'Cannot delete role with assigned users' }

        await prisma.role.delete({ where: { id: roleId } })

        revalidatePath('/dashboard/settings/roles')
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting role:', error)
        return { success: false, error: error.message || 'Failed to delete role' }
    }
}
