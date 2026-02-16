export type Role = 'admin' | 'manager' | 'member' | 'viewer'

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    MEMBER: 'member',
    VIEWER: 'viewer'
} as const

export const PERMISSIONS = {
    // Project Permissions
    CREATE_PROJECT: 'create:project',
    UPDATE_PROJECT: 'update:project',
    DELETE_PROJECT: 'delete:project',
    VIEW_PROJECT: 'view:project',

    // Task Permissions
    CREATE_TASK: 'create:task',
    UPDATE_TASK: 'update:task',
    DELETE_TASK: 'delete:task',
    VIEW_TASK: 'view:task',

    // Team Permissions
    VIEW_TEAM: 'view:team',
    INVITE_MEMBER: 'invite:member',
    REMOVE_MEMBER: 'remove:member',
    UPDATE_ROLE: 'update:role',

    // Role Permissions
    MANAGE_ROLES: 'manage:roles',
    VIEW_ROLES: 'view:roles',

    // Settings Permissions
    VIEW_SETTINGS: 'view:settings',
    MANAGE_SETTINGS: 'manage:settings',

    // Customer Permissions
    MANAGE_CUSTOMERS: 'manage:customers',
} as const

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

const ROLE_PERMISSIONS: Record<string, string[]> = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.MANAGER]: [
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.UPDATE_PROJECT,
        PERMISSIONS.VIEW_PROJECT,
        PERMISSIONS.CREATE_TASK,
        PERMISSIONS.UPDATE_TASK,
        PERMISSIONS.DELETE_TASK,
        PERMISSIONS.VIEW_TASK,
        PERMISSIONS.INVITE_MEMBER,
        PERMISSIONS.REMOVE_MEMBER,
        PERMISSIONS.MANAGE_CUSTOMERS
    ],
    [ROLES.MEMBER]: [
        PERMISSIONS.VIEW_PROJECT,
        PERMISSIONS.CREATE_TASK,
        PERMISSIONS.UPDATE_TASK,
        PERMISSIONS.VIEW_TASK
    ],
    [ROLES.VIEWER]: [
        PERMISSIONS.VIEW_PROJECT,
        PERMISSIONS.VIEW_TASK
    ]
}


export function hasPermission(
    userRole: string | { permissions: { action: string }[] } | undefined | null,
    permission: string
): boolean {
    if (!userRole) return false

    // Support legacy string check (fallback)
    if (typeof userRole === 'string') {
        const permissions = ROLE_PERMISSIONS[userRole.toLowerCase()] || []
        return permissions.includes(permission)
    }

    // New object check (DB Relation)
    if ('permissions' in userRole && Array.isArray(userRole.permissions)) {
        return userRole.permissions.some(p => p.action === permission)
    }

    return false
}

export function canPerform(
    userRole: string | { permissions: { action: string }[] } | undefined | null,
    action: string
): boolean {
    return hasPermission(userRole, action)
}
