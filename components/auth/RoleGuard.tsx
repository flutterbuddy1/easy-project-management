'use client'

import { useSession } from 'next-auth/react'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

interface RoleGuardProps {
    children: React.ReactNode
    permission: typeof PERMISSIONS[keyof typeof PERMISSIONS]
    fallback?: React.ReactNode
}

export function RoleGuard({ children, permission, fallback = null }: RoleGuardProps) {
    const { data: session } = useSession()

    // If not authenticated or no session yet, usually hidden or loading. 
    // But safely handled by returning null or fallback.
    if (!session?.user?.role) return <>{fallback}</>

    const canAccess = hasPermission(session.user.role, permission)

    if (!canAccess) return <>{fallback}</>

    return <>{children}</>
}
