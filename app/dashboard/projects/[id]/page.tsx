import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KanbanBoard } from '@/components/project/KanbanBoard'
import { ProjectChat } from '@/components/chat/ProjectChat'
import { ProjectFiles } from '@/components/project/ProjectFiles'
import { ProjectInfoSidebar } from '@/components/project/ProjectInfoSidebar'
import { EditProjectDialog } from '@/components/project/EditProjectDialog'
import { ClientUpdateDialog } from '@/components/project/ClientUpdateDialog'
import { getOrganizationUsers } from '@/app/actions/projects'
import { ArrowLeft, Settings, Pencil, Info, MessageSquare } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { PERMISSIONS } from '@/lib/permissions'

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
            avatarUrl: true,
            role: true
        }
    })

    if (!user?.organizationId) {
        redirect('/dashboard')
    }

    // Fetch members for edit dialog
    const membersResult = await getOrganizationUsers()
    const members = membersResult.users || []

    // Fetch project
    const project = await prisma.project.findFirst({
        where: {
            id: params.id,
            organizationId: user.organizationId
        },
        include: {
            assignedLead: {
                select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true
                }
            }
        }
    }) as any

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
        <div className="h-[calc(100dvh-4rem)] flex flex-col">
            {/* Header Section */}
            <div className="bg-background border-b px-4 sm:px-6 py-3 sm:py-4 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <Link
                        href="/dashboard/projects"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Back to Projects</span>
                        <span className="sm:hidden">Back</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        {user.role !== 'viewer' && (
                            <ClientUpdateDialog
                                projectId={project.id}
                                projectName={project.name}
                                clientEmail={project.clientEmail || project.customer?.email}
                            />
                        )}
                        <RoleGuard permission={PERMISSIONS.UPDATE_PROJECT}>
                            <EditProjectDialog
                                project={project}
                                members={members}
                                trigger={
                                    <Button variant="outline" size="sm">
                                        <Pencil className="h-3.5 w-3.5 sm:mr-2" />
                                        <span className="hidden sm:inline">Edit Project</span>
                                    </Button>
                                }
                            />
                        </RoleGuard>
                        {/* Mobile Info Button */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden">
                                    <Info className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[85%] sm:w-[400px] overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Project Details</SheetTitle>
                                </SheetHeader>
                                <div className="mt-6">
                                    <ProjectInfoSidebar project={project} userRole={user.role} />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight line-clamp-1">{project.name}</h1>
                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider px-2 py-0.5 whitespace-nowrap">
                                {project.status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground max-w-2xl text-xs sm:text-sm line-clamp-2">
                            {project.description || 'No description provided for this project.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area with Tabs */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-0">
                    {/* Left Content (Tabs) */}
                    <div className="lg:col-span-9 h-full overflow-hidden flex flex-col border-r bg-muted/5">
                        <Tabs defaultValue="board" className="h-full flex flex-col">
                            <div className="px-4 sm:px-6 py-2 border-b bg-background shrink-0 w-full overflow-x-auto no-scrollbar">
                                <TabsList className="bg-transparent h-auto p-0 space-x-6 min-w-max">
                                    <TabsTrigger
                                        value="board"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0 text-muted-foreground data-[state=active]:text-foreground bg-transparent border-b-2 border-transparent transition-all"
                                    >
                                        Task Board
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="files"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0 text-muted-foreground data-[state=active]:text-foreground bg-transparent border-b-2 border-transparent transition-all"
                                    >
                                        Files
                                    </TabsTrigger>
                                    {/* Mobile Chat FAB & Sheet (Bottom) */}
                                    <div className="lg:hidden fixed bottom-6 right-6 z-50">
                                        <Sheet>
                                            <SheetTrigger asChild>
                                                <Button size="icon" className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90">
                                                    <MessageSquare className="h-6 w-6" />
                                                </Button>
                                            </SheetTrigger>
                                            <SheetContent side="bottom" className="h-[80dvh] p-0 rounded-t-xl">
                                                <div className="h-full flex flex-col">
                                                    <div className="p-4 border-b flex justify-between items-center bg-muted/5">
                                                        <h3 className="font-semibold flex items-center gap-2">
                                                            Team Chat
                                                            <Badge variant="secondary" className="text-xs">Live</Badge>
                                                        </h3>
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <ProjectChat
                                                            projectId={params.id}
                                                            currentUser={user}
                                                            embedded={true}
                                                        />
                                                    </div>
                                                </div>
                                            </SheetContent>
                                        </Sheet>
                                    </div>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-auto p-2 sm:p-6 bg-muted/5">
                                <TabsContent value="board" className="h-full m-0 data-[state=active]:flex flex-col">
                                    <KanbanBoard
                                        tasks={tasks.map(t => ({
                                            ...t,
                                            dueDate: t.dueDate ? t.dueDate.toISOString() : null,
                                            createdAt: t.createdAt.toISOString(),
                                            updatedAt: t.updatedAt.toISOString()
                                        }))}
                                        projectId={params.id}
                                        members={members}
                                        userRole={user.role}
                                    />
                                </TabsContent>

                                <TabsContent value="files" className="h-full m-0 data-[state=active]:flex flex-col">
                                    <ProjectFiles
                                        projectId={params.id}
                                        currentUserId={user.id}
                                    />
                                </TabsContent>
                            </div>
                        </Tabs>

                        {/* Desktop Chat FAB & Sheet (Right Sidebar) */}
                        <div className="hidden lg:block fixed bottom-8 right-8 z-50">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button size="icon" className="h-16 w-16 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
                                        <MessageSquare className="h-7 w-7" />
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-background"></span>
                                        </span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 border-l border-border/50">
                                    <div className="h-full flex flex-col">
                                        <div className="p-4 border-b flex justify-between items-center bg-muted/5">
                                            <h3 className="font-semibold flex items-center gap-2">
                                                Team Chat
                                                <Badge variant="secondary" className="text-xs">Live</Badge>
                                            </h3>
                                        </div>
                                        <div className="flex-1 overflow-hidden bg-background">
                                            <ProjectChat
                                                projectId={params.id}
                                                currentUser={user}
                                                embedded={true}
                                            />
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    {/* Right Sidebar - Desktop */}
                    <div className="hidden lg:block lg:col-span-3 h-full overflow-y-auto bg-background p-6 border-l">
                        <div className="sticky top-0">
                            <ProjectInfoSidebar project={project} userRole={user.role} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Project Info Sheet (Optional: Add if needed, or rely on 'Edit Project' for details)
                For now, we just ensure the board is visible by hiding the sidebar on mobile.
            */}
        </div>
    )
}
