'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetTrigger
} from '@/components/ui/sheet'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/button'

interface User {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    role: string
}

interface MobileSidebarProps {
    user: User
}

export function MobileSidebar({ user }: MobileSidebarProps) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden mr-2">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-card w-72">
                <Sidebar user={user} className="w-full border-none" />
            </SheetContent>
        </Sheet>
    )
}
