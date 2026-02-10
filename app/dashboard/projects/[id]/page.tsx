import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/project/KanbanBoard'
import { ProjectChat } from '@/components/chat/ProjectChat'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ProjectDetailPage({
    params,
}: {
    params: { id: string }
}) {
    const session = await auth()

    if (!session?.user?.email) {
        redirect('/auth/login')
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            organizationId: true,
            fullName: true,
            avatarUrl: true
        }
    })

    if (!user?.organizationId) {
        redirect('/dashboard')
    }

    // Fetch project
    const project = await prisma.project.findFirst({
        where: {
            id: params.id,
            organizationId: user.organizationId
        }
    })

    if (!project) {
        notFound()
    }

    // Fetch all tasks for this project
    const tasks = await prisma.task.findMany({
        where: {
            projectId: params.id
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatarUrl: true
                }
            }
        },
        orderBy: {
            createdAt: 'asc'
        }
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/projects"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Projects
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">{project.name}</h1>
                            <Badge variant="outline">{project.status}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            {project.description || 'No description'}
                        </p>
                    </div>
                    <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <KanbanBoard
                tasks={tasks.map(t => ({
                    ...t,
                    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
                    createdAt: t.createdAt.toISOString(),
                    updatedAt: t.updatedAt.toISOString()
                }))}
                projectId={params.id}
            />

            {/* Real-time Chat Widget */}
            <ProjectChat
                projectId={params.id}
                currentUser={{
                    id: user.id,
                    fullName: user.fullName,
                    avatarUrl: user.avatarUrl
                }}
            />
        </div>
    )
}
