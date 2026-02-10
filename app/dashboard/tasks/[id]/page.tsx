import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, User, FolderKanban } from 'lucide-react'
import Link from 'next/link'
import { TaskDescription } from '@/components/task/TaskDescription'
import { TaskComments } from '@/components/task/TaskComments'
import { TaskMetadataSidebar } from '@/components/task/TaskMetadataSidebar'

interface TaskDetailPageProps {
    params: {
        id: string
    }
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
    const session = await auth()
    if (!session?.user?.email) {
        notFound()
    }

    // Fetch task with related data
    const task = await prisma.task.findUnique({
        where: { id: params.id },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    organizationId: true
                }
            },
            assignee: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true
                }
            },
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    fullName: true
                }
            }
        }
    })

    if (!task) {
        notFound()
    }

    // Fetch comments with user info
    const comments = await prisma.comment.findMany({
        where: { taskId: params.id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    })

    // Fetch users for assignment dropdown
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { organizationId: true }
    })

    const users = await prisma.user.findMany({
        where: { organizationId: user?.organizationId },
        select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
        }
    })

    const priorityColors = {
        low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    }

    const statusColors = {
        todo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard/projects" className="hover:text-foreground">
                    Projects
                </Link>
                <span>/</span>
                <Link
                    href={`/dashboard/projects/${task.project.id}`}
                    className="hover:text-foreground"
                >
                    {task.project.name}
                </Link>
                <span>/</span>
                <span className="text-foreground">{task.title}</span>
            </div>

            {/* Back Button */}
            <Link href={`/dashboard/projects/${task.project.id}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Project
                </Button>
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold mb-2 break-words">{task.title}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                            {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                            {task.priority}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <TaskDescription task={task} />

                    {/* Comments */}
                    {/* Comments */}
                    <TaskComments
                        taskId={task.id}
                        comments={comments.map(c => ({
                            ...c,
                            createdAt: c.createdAt.toISOString(),
                            updatedAt: c.updatedAt.toISOString(),
                            user: {
                                ...c.user,
                                fullName: c.user.fullName,
                                avatarUrl: c.user.avatarUrl
                            }
                        }))}
                        currentUserId={session.user.id}
                    />
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <TaskMetadataSidebar task={task} users={users} />

                    {/* Quick Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <FolderKanban className="h-4 w-4" />
                                <Link
                                    href={`/dashboard/projects/${task.project.id}`}
                                    className="hover:text-foreground hover:underline"
                                >
                                    {task.project.name}
                                </Link>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    Created {task.createdAt.toLocaleDateString()}
                                </span>
                            </div>
                            {task.createdBy && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>By {task.createdBy.fullName || task.createdBy.email}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
