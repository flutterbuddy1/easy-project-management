'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    useDroppable,
    useDraggable,
} from '@dnd-kit/core'
import { useSocket } from '@/components/providers/SocketProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateTaskDialog } from '@/components/task/CreateTaskDialog'
import { EditTaskDialog } from '@/components/task/EditTaskDialog'
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog'
import { updateTaskStatus, deleteTask } from '@/app/actions/tasks'
import {
    MoreVertical,
    Pencil,
    Trash2,
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    XCircle
} from 'lucide-react'

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    assigned_to: string | null
    due_date: string | null
    position: number
    project_id: string
    created_at: string
    updated_at: string
    assignee?: {
        id: string
        fullName: string | null
        avatarUrl: string | null
        email: string
    } | null
}

interface KanbanBoardProps {
    tasks: Task[]
    projectId: string
}

interface Column {
    id: string
    title: string
    status: string
    icon: any
    color: string
    bgColor: string
    borderColor: string
}

const columns: Column[] = [
    {
        id: 'todo',
        title: 'To Do',
        status: 'todo',
        icon: Circle,
        color: 'text-slate-500',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-200 dark:border-slate-800'
    },
    {
        id: 'in_progress',
        title: 'In Progress',
        status: 'in_progress',
        icon: Clock,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-200 dark:border-blue-900'
    },
    {
        id: 'review',
        title: 'Review',
        status: 'review',
        icon: AlertCircle,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-200 dark:border-purple-900'
    },
    {
        id: 'blocked',
        title: 'Blocked',
        status: 'blocked',
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-200 dark:border-red-900'
    },
    {
        id: 'done',
        title: 'Done',
        status: 'done',
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-200 dark:border-green-900'
    }
]

export function KanbanBoard({ tasks: initialTasks, projectId }: KanbanBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [activeTask, setActiveTask] = useState<Task | null>(null)
    const router = useRouter()

    useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10, // Enable click on non-drag elements
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Delay to distinguish scroll/tap from drag
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor)
    )

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const task = tasks.find((t) => t.id === active.id)
        if (task) {
            setActiveTask(task)
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveTask(null)

        if (!over) return

        const taskId = active.id as string
        const newStatus = over.id as string
        const task = tasks.find((t) => t.id === taskId)

        if (!task || task.status === newStatus) return

        const previousTasks = [...tasks]
        setTasks((prevTasks) =>
            prevTasks.map((t) =>
                t.id === taskId ? { ...t, status: newStatus } : t
            )
        )

        // Optimistic emit
        if (socket) {
            console.log('Emitting task-moved:', { taskId, status: newStatus, projectId })
            socket.emit('task-moved', {
                taskId,
                status: newStatus,
                projectId
            })
        } else {
            console.error('Socket not available for task-moved emit')
        }

        const result = await updateTaskStatus(taskId, newStatus)

        if (!result.success) {
            console.error('Failed to update task status:', result.error)
            setTasks(previousTasks)
            alert('Failed to update task status. Please try again.')
        } else {
            console.log('Task status updated successfully via server action')
            router.refresh()
        }
    }

    const handleDragCancel = () => {
        setActiveTask(null)
    }

    const getTasksByStatus = (status: string) => {
        return tasks.filter((task) => task.status === status)
    }

    // Socket.io Integration
    const { socket, isConnected } = useSocket()

    useEffect(() => {
        if (!socket || !isConnected) return

        // Join project room
        socket.emit('join-project', projectId)

        // Listen for task updates from other users
        const handleTaskUpdate = (data: { taskId: string, status: string, projectId: string }) => {
            console.log('Received task update:', data)
            if (data.projectId !== projectId) return

            setTasks((prevTasks) =>
                prevTasks.map((t) =>
                    t.id === data.taskId ? { ...t, status: data.status } : t
                )
            )
        }

        socket.on('task-updated', handleTaskUpdate)

        return () => {
            socket.off('task-updated', handleTaskUpdate)
            socket.emit('leave-project', projectId)
        }
    }, [socket, isConnected, projectId])

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="h-[calc(100vh-220px)] w-full overflow-x-auto pb-4 select-none">
                <div className="flex h-full gap-4 min-w-[1200px] px-1">
                    {columns.map((column) => (
                        <DroppableColumn
                            key={column.id}
                            column={column}
                            tasks={getTasksByStatus(column.status)}
                            projectId={projectId}
                        />
                    ))}
                </div>
            </div>

            <DragOverlay>
                {activeTask ? (
                    <Card className="cursor-grabbing opacity-90 rotate-3 shadow-lg w-[260px]">
                        <CardContent className="p-3">
                            <h4 className="font-medium text-sm mb-2">{activeTask.title}</h4>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {activeTask.priority}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

interface DroppableColumnProps {
    column: Column
    tasks: Task[]
    projectId: string
}

function DroppableColumn({ column, tasks, projectId }: DroppableColumnProps) {
    const { setNodeRef } = useDroppable({
        id: column.status,
    })

    const Icon = column.icon

    return (
        <div
            ref={setNodeRef}
            className="flex flex-col h-full w-[280px] shrink-0 rounded-lg bg-muted/40 border"
        >
            {/* Column Header */}
            <div className={`p-3 border-b flex items-center justify-between ${column.bgColor}`}>
                <div className="flex items-center gap-2 font-medium text-sm">
                    <Icon className={`h-4 w-4 ${column.color}`} />
                    {column.title}
                </div>
                <Badge variant="secondary" className="text-xs h-5 px-1.5 font-normal">
                    {tasks.length}
                </Badge>
            </div>

            {/* Column Content */}
            <ScrollArea className="flex-1 p-3">
                <div className="space-y-3 pb-3">
                    <CreateTaskDialog projectId={projectId} status={column.status} />

                    {tasks.map((task) => (
                        <DraggableTask key={task.id} task={task} column={column} />
                    ))}

                    {tasks.length === 0 && (
                        <div className="h-24 border-2 border-dashed border-muted-foreground/10 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                            No tasks
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}

interface DraggableTaskProps {
    task: Task
    column: Column
}

function DraggableTask({ task, column }: DraggableTaskProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    })
    const router = useRouter()

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined

    const handleDelete = async () => {
        const result = await deleteTask(task.id)
        if (result.success) {
            router.refresh()
        } else {
            alert(result.error || 'Failed to delete task')
        }
    }

    const priorityColors = {
        low: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`shadow-sm hover:shadow-md transition-all duration-200 border cursor-grab hover:border-primary/50 relative overflow-hidden group/card select-none ${isDragging ? 'opacity-50' : ''
                } ${task.status === 'done' ? 'opacity-75' : ''}`}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${column.bgColor.replace('/10', '')}`} />

            <CardContent className="p-3 pl-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <Link
                        href={`/dashboard/tasks/${task.id}`}
                        className="flex-1 min-w-0 block"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        <h4
                            {...listeners}
                            {...attributes}
                            className={`font-medium text-sm leading-tight line-clamp-2 group-hover/card:text-primary transition-colors ${task.status === 'done' ? 'line-through text-muted-foreground' : ''
                                }`}
                        >
                            {task.title}
                        </h4>
                    </Link>

                    <div
                        className="opacity-0 group-hover/card:opacity-100 transition-opacity -mt-1 -mr-1"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <EditTaskDialog
                                    task={task}
                                    trigger={
                                        <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                    }
                                />
                                <DeleteConfirmDialog
                                    title="Delete Task"
                                    description="Are you sure you want to delete this task? This action cannot be undone."
                                    onConfirm={handleDelete}
                                    trigger={
                                        <DropdownMenuItem
                                            onSelect={(e: Event) => e.preventDefault()}
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

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        {task.assignee ? (
                            <div className="flex items-center gap-1.5" title={task.assignee.fullName || task.assignee.email}>
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={task.assignee.avatarUrl || ''} />
                                    <AvatarFallback className="text-[9px]">
                                        {(task.assignee.fullName || 'U').charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                                    {task.assignee.fullName?.split(' ')[0]}
                                </span>
                            </div>
                        ) : (
                            <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                        )}
                    </div>

                    <Badge
                        variant="secondary"
                        className={`text-[10px] h-4 px-1 ${priorityColors[task.priority as keyof typeof priorityColors]}`}
                    >
                        {task.priority}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    )
}


