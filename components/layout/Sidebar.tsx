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
    Layers
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },

    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'My Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Team', href: '/dashboard/team', icon: Users },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface User {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    role: string
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    PM Tool
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    let isActive = false

                    if (item.href === '/dashboard') {
                        // Exact match for dashboard root
                        isActive = pathname === '/dashboard'
                    } else {
                        // Prefix match for others (e.g., /dashboard/projects matches /dashboard/projects/123)
                        isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
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
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
