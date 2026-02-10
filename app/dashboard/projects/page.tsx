import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { CreateProjectDialog } from '@/components/project/CreateProjectDialog'
import { ProjectCard } from '@/components/project/ProjectCard'
import { FolderKanban } from 'lucide-react'

export default async function ProjectsPage() {
    const session = await auth()

    if (!session?.user?.email) {
        redirect('/auth/login')
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { organizationId: true }
    })

    if (!user?.organizationId) {
        redirect('/dashboard')
    }

    // Fetch all projects in organization with task counts
    const projects = await prisma.project.findMany({
        where: {
            organizationId: user.organizationId
        },
        include: {
            createdBy: {
                select: {
                    fullName: true,
                    email: true
                }
            },
            _count: {
                select: { tasks: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">All Projects</h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage all your projects
                    </p>
                </div>
                <CreateProjectDialog />
            </div>

            {/* Projects Grid */}
            {projects && projects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                        />
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create your first project to get started
                        </p>
                        <CreateProjectDialog />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
