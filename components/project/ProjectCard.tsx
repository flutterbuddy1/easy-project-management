'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditProjectDialog } from '@/components/project/EditProjectDialog'
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog'
import { deleteProject } from '@/app/actions/projects'
import { FolderKanban, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface ProjectCardProps {
    project: {
        id: string
        name: string
        description: string | null
        status: string
        _count?: { tasks: number }
    }
}

export function ProjectCard({ project }: ProjectCardProps) {
    const router = useRouter()

    const handleDelete = async () => {
        const result = await deleteProject(project.id)
        if (result.success) {
            router.refresh()
        } else {
            alert(result.error || 'Failed to delete project')
        }
    }

    return (
        <Card className="hover:border-primary transition-colors h-full group relative">
            <Link href={`/dashboard/projects/${project.id}`} className="block">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                            <FolderKanban className="h-5 w-5 text-white" />
                        </div>
                        <div
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.preventDefault()}
                        >
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <EditProjectDialog
                                        project={project}
                                        trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                        }
                                    />
                                    <DeleteConfirmDialog
                                        title="Delete Project"
                                        description="Are you sure you want to delete this project? This action cannot be undone."
                                        onConfirm={handleDelete}
                                        trigger={
                                            <DropdownMenuItem
                                                onSelect={(e) => e.preventDefault()}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        }
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <CardTitle>{project.name}</CardTitle>
                    </div>
                    <CardDescription>
                        {project.description || 'No description'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{project.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                        {project._count?.tasks || 0} tasks
                    </p>
                </CardContent>
            </Link>
        </Card>
    )
}
