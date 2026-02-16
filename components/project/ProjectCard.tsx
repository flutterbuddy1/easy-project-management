'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EditProjectDialog } from '@/components/project/EditProjectDialog'
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog'
import { deleteProject, updateProjectStatus } from '@/app/actions/projects'
import { FolderKanban, MoreVertical, Pencil, Trash2, Calendar, DollarSign, User, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'

// This replaces the interface and component start.
interface ProjectCardProps {
    project: {
        id: string
        name: string
        description: string | null
        status: string
        clientName: string | null
        deadline: Date | null
        totalAmount: any
        advanceAmount: any
        projectType: string | null
        priority: string | null
        maintenancePlan: boolean | null
        revisionLimit: number | null
        clientPhone: string | null
        clientEmail: string | null
        assignedLeadId: string | null
        assignedLead: {
            id: string
            fullName: string | null
            avatarUrl: string | null
        } | null
        _count: { tasks: number }
        tasks: { status: string }[]
        notifyClient: boolean | null
    }
    members: { id: string; fullName: string | null; avatarUrl: string | null }[]
}

export function ProjectCard({ project, members }: ProjectCardProps) {
    const router = useRouter()
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const handleDelete = async () => {
        const result = await deleteProject(project.id)
        if (result.success) {
            router.refresh()
        } else {
            alert(result.error || 'Failed to delete project')
        }
    }

    const handleMarkComplete = async () => {
        const result = await updateProjectStatus(project.id, 'completed')
        if (result.success) {
            router.refresh()
        } else {
            alert(result.error || 'Failed to update status')
        }
    }

    // Progress Calculation
    const totalTasks = project._count?.tasks || 0
    const completedTasks = project.tasks?.filter(t => t.status === 'done').length || 0
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Deadline Calculation
    const daysLeft = project.deadline ? differenceInDays(new Date(project.deadline), new Date()) : null
    let deadlineColor = 'text-muted-foreground'
    if (daysLeft !== null) {
        if (daysLeft < 0) deadlineColor = 'text-red-500'
        else if (daysLeft <= 3) deadlineColor = 'text-yellow-500'
    }

    // Payment Status
    const total = Number(project.totalAmount) || 0
    const advance = Number(project.advanceAmount) || 0
    let paymentStatus = 'Pending'
    let paymentColor = 'bg-red-100 text-red-800 border-red-200'

    if (total > 0) {
        if (advance >= total) {
            paymentStatus = 'Paid'
            paymentColor = 'bg-green-100 text-green-800 border-green-200'
        } else if (advance > 0) {
            paymentStatus = 'Partial'
            paymentColor = 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
    }

    return (
        <Card className="hover:border-primary transition-all duration-200 group relative flex flex-col h-full">
            <Link href={`/dashboard/projects/${project.id}`} className="block flex-1">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <FolderKanban className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg leading-tight line-clamp-1">{project.name}</CardTitle>
                                <CardDescription className="line-clamp-1 mt-1">
                                    {project.clientName || 'No Client'}
                                </CardDescription>
                            </div>
                        </div>

                        <div
                            className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4"
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
                                        members={members}
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
                </CardHeader>

                <CardContent className="pb-3">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                            {project.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={`${paymentColor} border-0 capitalize`}>
                            {paymentStatus}
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Deadline
                            </span>
                            <span className={`font-medium ${deadlineColor}`}>
                                {project.deadline ? format(new Date(project.deadline), 'MMM d, yyyy') : 'No deadline'}
                                {daysLeft !== null && daysLeft < 0 && ' (Overdue)'}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            {progress === 100 && project.status === 'active' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2 h-7 text-xs border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleMarkComplete()
                                    }}
                                >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Suggest: Mark Completed
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="pt-0 pb-4">
                    <div className="flex items-center gap-2 w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={project.assignedLead?.avatarUrl || ''} />
                                <AvatarFallback className="text-[10px]">
                                    {project.assignedLead?.fullName?.charAt(0) || <User className="h-3 w-3" />}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate">
                                {project.assignedLead?.fullName || 'Unassigned'}
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                            {totalTasks} tasks
                        </span>
                    </div>
                </CardFooter>
            </Link>
        </Card>
    )
}
