import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCircle2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function NotificationsPage() {
    const session = await auth()

    if (!session?.user?.email) {
        redirect('/auth/login')
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    })

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-muted-foreground mt-1">
                    Stay updated with your project activities
                </p>
            </div>

            {/* Notifications List */}
            {notifications && notifications.length > 0 ? (
                <div className="space-y-2">
                    {notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={notification.read ? 'opacity-60' : 'border-primary/50'}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${notification.type === 'task_assigned'
                                        ? 'bg-blue-100 dark:bg-blue-900'
                                        : notification.type === 'comment_added'
                                            ? 'bg-purple-100 dark:bg-purple-900'
                                            : 'bg-green-100 dark:bg-green-900'
                                        }`}>
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="font-medium">{notification.title}</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <Badge variant="default" className="shrink-0">New</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {notification.createdAt.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <CheckCircle2 className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                        <p className="text-muted-foreground text-center">
                            You don't have any notifications at the moment
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
