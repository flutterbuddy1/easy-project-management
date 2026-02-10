import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    FolderKanban,
    CheckSquare,
    Clock,
    TrendingUp,
    AlertCircle
} from 'lucide-react'

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user?.email) {
        redirect('/auth/login')
    }

    // Fetch user with organization
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            organization: true
        }
    })

    if (!user) {
        redirect('/auth/login')
    }

    // Auto-create organization if missing (Migration Fix)
    if (!user.organizationId) {
        const orgName = user.fullName ? `${user.fullName}'s Organization` : 'My Organization'

        const newOrg = await prisma.organization.create({
            data: {
                name: orgName
            }
        })

        await prisma.user.update({
            where: { id: user.id },
            data: { organizationId: newOrg.id }
        })

        // Refresh page to load with new organization
        redirect('/dashboard')
    }

    // Fetch projects count
    const projectsCount = user.organizationId
        ? await prisma.project.count({
            where: {
                organizationId: user.organizationId,
                status: 'active'
            }
        })
        : 0

    // Fetch total tasks assigned to user
    const totalTasksCount = await prisma.task.count({
        where: {
            assigneeId: user.id
        }
    })

    // Fetch completed tasks
    const completedTasksCount = await prisma.task.count({
        where: {
            assigneeId: user.id,
            status: 'done'
        }
    })

    const completionRate = totalTasksCount > 0
        ? Math.round((completedTasksCount / totalTasksCount) * 100)
        : 0

    // Fetch recent tasks for the list
    const myTasks = await prisma.task.findMany({
        where: {
            assigneeId: user.id,
            status: {
                not: 'done'
            }
        },
        include: {
            project: {
                select: { name: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 5
    })

    // Note: Overdue count would need a dueDate field in the schema
    // For now, setting to 0
    const overdueCount = 0

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div>
                <h1 className="text-3xl font-bold">
                    Welcome back, {user.fullName || 'User'}!
                </h1>
                <p className="text-muted-foreground mt-1">
                    Here&apos;s what&apos;s happening with your projects today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Projects
                        </CardTitle>
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{projectsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            In your organization
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            My Tasks
                        </CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTasksCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Tasks assigned to you
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Overdue
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Tasks past due date
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Completion Rate
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            All time
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* My Tasks Section */}
            <Card>
                <CardHeader>
                    <CardTitle>My Tasks</CardTitle>
                    <CardDescription>
                        Tasks currently assigned to you
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {myTasks && myTasks.length > 0 ? (
                        <div className="space-y-3">
                            {myTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                                >
                                    <div className="flex-1">
                                        <h4 className="font-medium">{task.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {task.project?.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                task.priority === 'critical' || task.priority === 'high'
                                                    ? 'destructive'
                                                    : 'secondary'
                                            }
                                        >
                                            {task.priority}
                                        </Badge>
                                        <Badge variant="outline">
                                            {task.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No tasks assigned yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Latest updates from your organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm">
                                    <span className="font-medium">System</span> - Welcome to your new project management platform!
                                </p>
                                <p className="text-xs text-muted-foreground">Just now</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
