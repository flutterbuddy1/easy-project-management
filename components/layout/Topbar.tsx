'use client'

import { Search } from 'lucide-react'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { CreateDropdown } from '@/components/layout/CreateDropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

import { MobileSidebar } from '@/components/layout/MobileSidebar'

interface User {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    role: string
}

interface TopbarProps {
    user: User
}

export function Topbar({ user }: TopbarProps) {
    return (
        <div className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
            <div className="flex items-center gap-4 flex-1">
                {/* Mobile Sidebar Trigger */}
                <MobileSidebar user={user} />

                {/* Search */}
                <div className="relative w-full max-w-md hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search projects, tasks, people..."
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4">
                {/* Apps / Create */}
                <CreateDropdown />

                {/* Notifications */}
                <NotificationDropdown />

                {/* User Avatar */}
                <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={user.avatarUrl || ''} alt={user.fullName || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </div>
        </div>
    )
}
