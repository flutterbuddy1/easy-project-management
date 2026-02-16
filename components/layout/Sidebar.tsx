'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Users,
    Bell,
    Settings,
    Layers,
    Building2,
    Shield
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban, permission: PERMISSIONS.VIEW_PROJECT },
    { name: 'Customers', href: '/dashboard/customers', icon: Building2, permission: PERMISSIONS.MANAGE_CUSTOMERS },
    { name: 'My Tasks', href: '/dashboard/tasks', icon: CheckSquare, permission: PERMISSIONS.VIEW_TASK },
    { name: 'Team', href: '/dashboard/team', icon: Users, permission: PERMISSIONS.VIEW_TEAM }, // Changed to VIEW_TEAM
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, permission: null },
    { name: 'Roles', href: '/dashboard/settings/roles', icon: Shield, permission: PERMISSIONS.VIEW_ROLES },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: PERMISSIONS.VIEW_SETTINGS },
]

interface User {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    role: string
    roleRel?: {
        name: string
        permissions: { action: string }[]
    } | null
}

interface SidebarProps {
    user: User
    className?: string
}

export function Sidebar({ user, className }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div className={cn("flex h-full w-64 flex-col border-r bg-card", className)}>
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        PM Tool
                    </h1>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.filter(item => {
                    // If no permission required, show it
                    if (!item.permission) return true

                    // Check logic: 
                    // 1. Check object-based permission (roleRel)
                    // 2. Check string-based permission (role) - backward compatibility
                    return hasPermission(user.roleRel || user.role, item.permission)
                }).map((item, index, allItems) => {
                    let isActive = false

                    if (item.href === '/dashboard') {
                        // Exact match for dashboard root
                        isActive = pathname === '/dashboard'
                    } else {
                        // Check if this item matches
                        const matchesParams = pathname === item.href || pathname?.startsWith(item.href + '/')

                        if (matchesParams) {
                            // Check if there is a more specific match in the list
                            // e.g. if we are on /dashboard/settings/roles
                            // 'Settings' (/dashboard/settings) matches
                            // 'Roles' (/dashboard/settings/roles) matches
                            // We want to disable 'Settings' if 'Roles' is also a match
                            const hasMoreSpecificMatch = allItems.some(otherItem =>
                                otherItem !== item &&
                                otherItem.href.length > item.href.length &&
                                (pathname === otherItem.href || pathname?.startsWith(otherItem.href + '/')) &&
                                // Ensure the other item is actually rendered (authorized)
                                (otherItem.permission ? hasPermission(user.role, otherItem.permission) : true)
                            )

                            isActive = !hasMoreSpecificMatch
                        }
                    }
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* User Section */}
            <div className="border-t p-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.fullName || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate capitalize">
                            {user.role}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
