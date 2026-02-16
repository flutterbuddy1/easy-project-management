
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Copying definitions to avoid import issues during standalone script execution
const PERMISSIONS = {
    // Project Permissions
    CREATE_PROJECT: 'create:project',
    UPDATE_PROJECT: 'update:project',
    DELETE_PROJECT: 'delete:project',
    VIEW_PROJECT: 'view:project',

    // Task Permissions
    CREATE_TASK: 'create:task',
    UPDATE_TASK: 'update:task',
    DELETE_TASK: 'delete:task',
    VIEW_TASK: 'view:task', // Added view:task explicit

    // Team Permissions
    VIEW_TEAM: 'view:team',
    INVITE_MEMBER: 'invite:member',
    REMOVE_MEMBER: 'remove:member',
    UPDATE_ROLE: 'update:role',

    // Role Permissions (New)
    MANAGE_ROLES: 'manage:roles',
    VIEW_ROLES: 'view:roles',

    // Settings Permissions
    VIEW_SETTINGS: 'view:settings',
    MANAGE_SETTINGS: 'manage:settings',

    // Customer Permissions
    MANAGE_CUSTOMERS: 'manage:customers',
}

const ROLE_DEFINITIONS = {
    admin: {
        displayName: 'Administrator',
        description: 'Full access to all resources',
        permissions: Object.values(PERMISSIONS),
        isSystem: true
    },
    manager: {
        displayName: 'Manager',
        description: 'Can manage projects, tasks, and team members',
        permissions: [
            PERMISSIONS.CREATE_PROJECT,
            PERMISSIONS.UPDATE_PROJECT,
            PERMISSIONS.VIEW_PROJECT,
            PERMISSIONS.CREATE_TASK,
            PERMISSIONS.UPDATE_TASK,
            PERMISSIONS.DELETE_TASK,
            PERMISSIONS.VIEW_TASK,
            PERMISSIONS.VIEW_TEAM,
            PERMISSIONS.INVITE_MEMBER,
            PERMISSIONS.REMOVE_MEMBER,
            PERMISSIONS.MANAGE_CUSTOMERS,
            PERMISSIONS.VIEW_SETTINGS // Manager can view settings logic? Or maybe just profile
        ],
        isSystem: true
    },
    member: {
        displayName: 'Member',
        description: 'Can view projects and manage assigned tasks',
        permissions: [
            PERMISSIONS.VIEW_PROJECT,
            PERMISSIONS.CREATE_TASK,
            PERMISSIONS.UPDATE_TASK,
            PERMISSIONS.VIEW_TASK,
            PERMISSIONS.VIEW_TEAM
        ],
        isSystem: true
    },
    viewer: {
        displayName: 'Viewer',
        description: 'Read-only access',
        permissions: [
            PERMISSIONS.VIEW_PROJECT,
            PERMISSIONS.VIEW_TASK,
            PERMISSIONS.VIEW_TEAM
        ],
        isSystem: true
    }
}

async function main() {
    console.log('Start seeding roles and permissions...')

    // 1. Seed Permissions
    console.log('Seeding permissions...')
    const permissionMap = new Map<string, string>()

    for (const action of Object.values(PERMISSIONS)) {
        const parts = action.split(':')
        const group = parts[1] || 'general'

        try {
            const perm = await prisma.permission.upsert({
                where: { action },
                update: {},
                create: {
                    action,
                    group,
                    description: `Permission to ${parts[0]} ${group}`
                }
            })
            permissionMap.set(action, perm.id)
        } catch (error) {
            console.error(`Error seeding permission ${action}:`, error)
        }
    }

    // 2. Seed Roles
    console.log('Seeding roles...')
    for (const [roleName, def] of Object.entries(ROLE_DEFINITIONS)) {
        try {
            // Create or update role
            const role = await prisma.role.upsert({
                where: { name: roleName },
                update: {
                    displayName: def.displayName,
                    description: def.description,
                    isSystem: def.isSystem
                },
                create: {
                    name: roleName,
                    displayName: def.displayName,
                    description: def.description,
                    isSystem: def.isSystem
                }
            })
            console.log(`Upserted role: ${roleName}`)

            // Connect permissions
            // First disconnect all to reset, then connect
            await prisma.role.update({
                where: { id: role.id },
                data: {
                    permissions: {
                        set: [], // Clear existing
                        connect: def.permissions.map(p => ({ action: p }))
                    }
                }
            })
        } catch (error) {
            console.error(`Error seeding role ${roleName}:`, error)
        }
    }

    // 3. Migrate Users
    console.log('Migrating users...')
    const users = await prisma.user.findMany({
        where: { roleId: null }
    })

    console.log(`Found ${users.length} users with no roleId`)

    for (const user of users) {
        if (user.role) {
            // Find corresponding role
            // Handle case sensitivity: DB might have 'Admin' or 'admin'
            const roleName = user.role.toLowerCase()
            const match = Object.keys(ROLE_DEFINITIONS).find(k => k === roleName) || 'member'

            const role = await prisma.role.findUnique({ where: { name: match } })

            if (role) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { roleId: role.id }
                })
                console.log(`Migrated user ${user.email} to role ${role.name}`)
            }
        }
    }

    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
