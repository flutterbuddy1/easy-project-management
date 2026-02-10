'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSocket } from '@/components/providers/SocketProvider'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notifications'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
    id: string
    title: string
    message: string
    type: string
    read: boolean
    link: string | null
    createdAt: Date
}

export function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const { socket } = useSocket()
    const router = useRouter()

    const fetchNotifications = async () => {
        const result = await getNotifications()
        if (result.success) {
            setNotifications(result.notifications)
            setUnreadCount(result.notifications.filter((n: Notification) => !n.read).length)
            if (result.userId) {
                setUserId(result.userId)
            }
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    useEffect(() => {
        if (!socket || !userId) return

        // Join user room
        socket.emit('join-user', userId)

        const handleNewNotification = (notification: Notification) => {
            setNotifications(prev => [notification, ...prev])
            setUnreadCount(prev => prev + 1)
        }

        socket.on('notification', handleNewNotification)

        return () => {
            socket.off('notification', handleNewNotification)
        }
    }, [socket, userId])

    const handleMarkAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        await markNotificationAsRead(id)
    }

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        await markAllNotificationsAsRead()
    }

    const handleClick = (notification: Notification) => {
        if (!notification.read) {
            handleMarkAsRead(notification.id)
        }
        if (notification.link) {
            setIsOpen(false)
            router.push(notification.link)
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-6 text-xs px-2">
                            Mark all read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 p-1">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.read ? 'bg-accent/50 font-medium' : ''
                                        }`}
                                    onSelect={(e) => {
                                        e.preventDefault()
                                        handleClick(notification)
                                    }}
                                >
                                    <div className="flex w-full justify-between items-start gap-2">
                                        <span className="text-sm leading-none">{notification.title}</span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notification.message}
                                    </p>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
