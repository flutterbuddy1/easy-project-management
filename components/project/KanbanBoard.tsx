'use client'

import React, { useState, useEffect, useRef } from 'react'
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
import { useToast } from "@/hooks/use-toast"
import { useSocket } from '@/components/providers/SocketProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { format, isPast, isToday } from 'date-fns'
import {
    MoreVertical,
    Pencil,
    Trash2,
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    XCircle,
    Search,
    Filter,
    Calendar,
    X,
    FolderKanban
} from 'lucide-react'

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    assigneeId: string | null
    dueDate: string | null
    position: number
    projectId: string
    createdAt: string
    updatedAt: string
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
    members?: { id: string; fullName: string | null; avatarUrl: string | null }[]
    userRole?: string
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

export function KanbanBoard({ tasks: initialTasks, projectId, members = [], userRole }: KanbanBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [activeTask, setActiveTask] = useState<Task | null>(null)
    const router = useRouter()

    // Filter State
    const [searchQuery, setSearchQuery] = useState('')
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
    const [priorityFilter, setPriorityFilter] = useState<string>('all')

    useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor)
    )
    const { toast } = useToast()

    const isReadOnly = userRole === 'viewer'

    const [activeTab, setActiveTab] = useState(columns[0]?.status || 'todo')

    // Swipe Logic
    const touchStart = useRef<number | null>(null)
    const touchEnd = useRef<number | null>(null)
    const minSwipeDistance = 50

    const handleTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null
        touchStart.current = e.targetTouches[0].clientX
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX
    }

    const handleTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return
        const distance = touchStart.current - touchEnd.current
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe || isRightSwipe) {
            // Standard column swipe logic only
            const currentIndex = columns.findIndex(c => c.status === activeTab)

            if (isLeftSwipe && currentIndex < columns.length - 1) {
                setActiveTab(columns[currentIndex + 1].status)
            }
            if (isRightSwipe && currentIndex > 0) {
                setActiveTab(columns[currentIndex - 1].status)
            }
        }
    }

    const handleDragStart = (event: DragStartEvent) => {
        if (isReadOnly) return
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

        const activeId = active.id as string
        const overId = over.id as string

        const activeTask = tasks.find((t) => t.id === activeId)
        if (!activeTask) return

        // Finding the container (column) for the over element
        const overColumnId = columns.find(col => col.status === overId)?.status ||
            tasks.find(t => t.id === overId)?.status

        if (!overColumnId) return

        if (activeTask.status !== overColumnId) {
            // Moving to a different column
            const newStatus = overColumnId

            // Optimistic update
            const updatedTasks = tasks.map((t) =>
                t.id === activeId ? { ...t, status: newStatus } : t
            )
            setTasks(updatedTasks)

            // Optimistic emit
            if (socket) {
                socket.emit('task-moved', {
                    taskId: activeId,
                    status: newStatus,
                    projectId
                })
            }

            // API call
            const result = await updateTaskStatus(activeId, newStatus)

            if (result.error) {
                // Revert on failure
                setTasks(tasks)
                toast({
                    title: "Error",
                    description: "Failed to update task status",
                    variant: "destructive"
                })
            } else {
                // Notify checking if socket update doesn't come through
            }
        }
    }

    const handleDragCancel = () => {
        setActiveTask(null)
    }

    // Filtering Logic
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesAssignee = assigneeFilter === 'all' ||
            (assigneeFilter === 'unassigned' && !task.assigneeId) ||
            (task.assigneeId === assigneeFilter)

        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter

        return matchesSearch && matchesAssignee && matchesPriority
    })

    const getTasksByStatus = (status: string) => {
        return filteredTasks
            .filter((task) => task.status === status)
            .sort((a, b) => (a.position || 0) - (b.position || 0))
    }

    const clearFilters = () => {
        setSearchQuery('')
        setAssigneeFilter('all')
        setPriorityFilter('all')
    }

    // Socket.io Integration
    const { socket, isConnected } = useSocket()

    useEffect(() => {
        if (!socket || !isConnected) return

        // Join project room
        socket.emit('join-project', projectId)

        // Listen for task updates
        const handleTaskUpdate = (data: { taskId: string, status: string, projectId: string }) => {
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
        <div className="h-full flex flex-col">
            {/* Filters Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                        <SelectTrigger className="w-[140px] sm:w-[150px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-3.5 w-3.5" />
                                <SelectValue placeholder="Assignee" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Assignees</SelectItem>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                    {member.fullName || 'Unknown'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[130px] sm:w-[140px]">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <SelectValue placeholder="Priority" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>

                    {(searchQuery || assigneeFilter !== 'all' || priorityFilter !== 'all') && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2">
                            <X className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                {/* Desktop View: Horizontal Scroll */}
                <div className="hidden sm:flex flex-1 w-full overflow-x-auto overflow-y-hidden pb-4 select-none">
                    <div className="flex h-full gap-4 min-w-full px-1">
                        {columns.map((column) => (
                            <DroppableColumn
                                key={column.id}
                                column={column}
                                tasks={getTasksByStatus(column.status)}
                                projectId={projectId}
                                members={members}
                                isReadOnly={isReadOnly}
                            />
                        ))}
                    </div>
                </div>

                {/* Mobile View: Swipeable Tabs */}
                <div
                    className="sm:hidden flex-1 w-full h-full flex flex-col"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <div className="px-1 mb-2 overflow-x-auto no-scrollbar shrink-0">
                            <TabsList className="h-auto p-1 bg-muted/50 w-full justify-start">
                                {columns.map(column => (
                                    <TabsTrigger
                                        key={column.id}
                                        value={column.status}
                                        className="text-xs px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                    >
                                        {column.title}
                                        <span className="ml-1.5 text-[10px] opacity-70 bg-muted-foreground/10 px-1 rounded-full">
                                            {getTasksByStatus(column.status).length}
                                        </span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {columns.map((column) => (
                            <TabsContent key={column.id} value={column.status} className="flex-1 mt-0 h-full overflow-hidden data-[state=active]:flex flex-col">
                                <DroppableColumn
                                    column={column}
                                    tasks={getTasksByStatus(column.status)}
                                    projectId={projectId}
                                    members={members}
                                    isReadOnly={isReadOnly}
                                    isMobile={true}
                                />
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <Card className="cursor-grabbing opacity-90 rotate-3 shadow-xl w-[280px] border-primary/20">
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
        </div>
    )
}

interface DroppableColumnProps {
    column: Column
    tasks: Task[]
    projectId: string
    members?: any[]
    isReadOnly?: boolean
    isMobile?: boolean
}

function DroppableColumn({ column, tasks, projectId, members, isReadOnly, isMobile }: DroppableColumnProps) {
    const { setNodeRef } = useDroppable({
        id: column.status,
    })

    const Icon = column.icon

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col h-full shrink-0 rounded-xl bg-muted/40 border border-border/50 shadow-sm snap-center ${isMobile ? 'w-full' : 'w-[280px]'
                }`}
        >
            {/* Column Header */}
            <div className={`p-3 border-b flex items-center justify-between shrink-0 rounded-t-xl ${column.bgColor} backdrop-blur-sm`}>
                <div className="flex items-center gap-2 font-medium text-sm">
                    <Icon className={`h-4 w-4 ${column.color}`} />
                    {column.title}
                </div>
                <Badge variant="secondary" className="text-xs h-5 px-1.5 font-normal bg-background/50">
                    {tasks.length}
                </Badge>
            </div>

            {/* Column Content */}
            <ScrollArea className="flex-1 p-3">
                <div className="space-y-3 pb-3">
                    {!isReadOnly && (
                        <CreateTaskDialog projectId={projectId} status={column.status} teamMembers={members} />
                    )}

                    {tasks.map((task) => (
                        <DraggableTask key={task.id} task={task} column={column} members={members} isReadOnly={isReadOnly} />
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
    members?: any[]
    isReadOnly?: boolean
}

function DraggableTask({ task, column, members, isReadOnly }: DraggableTaskProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        disabled: isReadOnly,
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

    // Due Date Logic
    let dateColor = 'text-muted-foreground'
    let isOverdue = false

    if (task.dueDate) {
        const date = new Date(task.dueDate)
        if (task.status !== 'done') {
            if (isPast(date) && !isToday(date)) {
                dateColor = 'text-red-600 font-medium'
                isOverdue = true
            } else if (isToday(date)) {
                dateColor = 'text-orange-600 font-medium'
            }
        }
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`shadow-sm hover:shadow-md transition-all duration-200 border cursor-grab hover:border-primary/50 relative overflow-hidden group/card select-none ${isDragging ? 'opacity-50 ring-2 ring-primary/20' : ''
                } ${task.status === 'done' ? 'opacity-75' : ''}`}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${column.bgColor.replace('/10', '')}`} />

            <CardContent className="p-3 pl-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                    <Link
                        href={`/dashboard/tasks/${task.id}`}
                        className="flex-1 min-w-0 block"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        <h4
                            {...listeners}
                            {...attributes}
                            className={`font-medium text-sm leading-relaxed group-hover/card:text-primary transition-colors ${task.status === 'done' ? 'line-through text-muted-foreground' : ''
                                }`}
                        >
                            {task.title}
                        </h4>
                    </Link>

                    {!isReadOnly && (
                        <div
                            className="opacity-0 group-hover/card:opacity-100 transition-opacity -mr-1"
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
                                        users={members}
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
                    )}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        {task.assignee ? (
                            <div className="flex items-center gap-1.5" title={task.assignee.fullName || task.assignee.email}>
                                <Avatar className="h-5 w-5 ring-1 ring-background">
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

                    {task.dueDate && (
                        <div className={`flex items-center gap-1 text-[10px] ${dateColor}`} title={format(new Date(task.dueDate), 'MMM d, yyyy')}>
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <Badge
                        variant="secondary"
                        className={`text-[10px] h-4 px-1 ${priorityColors[task.priority as keyof typeof priorityColors]}`}
                    >
                        {task.priority}
                    </Badge>
                </div>
            </CardContent >
        </Card >
    )
}


