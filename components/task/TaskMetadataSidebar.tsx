'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { User, Tag, AlertCircle } from 'lucide-react'
import { updateTask } from '@/app/actions/tasks'
import { io, Socket } from 'socket.io-client'

interface TaskMetadataSidebarProps {
    task: {
        id: string
        title: string
        description: string | null
        status: string
        priority: string
        assigneeId: string | null
        projectId: string
        assignee?: {
            id: string
            email: string
            fullName: string | null
            avatarUrl: string | null
        } | null
    }
    users: Array<{
        id: string
        email: string
        fullName: string | null
        avatarUrl: string | null
    }>
}

export function TaskMetadataSidebar({ task, users }: TaskMetadataSidebarProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const router = useRouter()
    const [socket, setSocket] = useState<Socket | null>(null)

    // We need projectId to emit to the correct room. Assuming task.projectId exists.
    const projectId = task.projectId

    useEffect(() => {
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000')

        socketInstance.on('connect', () => {
            console.log('Sidebar Socket connected')
            socketInstance.emit('join-project', projectId)
        })

        socketInstance.on('task-updated', (data: any) => {
            if (data.taskId === task.id) {
                console.log('Task updated externally, refreshing...')
                router.refresh()
            }
        })

        setSocket(socketInstance)

        return () => {
            socketInstance.disconnect()
        }
    }, [projectId, task.id, router])

    const handleUpdate = async (field: 'status' | 'priority' | 'assigneeId', value: string) => {
        setIsUpdating(true)

        const updateData = {
            title: task.title,
            description: task.description,
            status: field === 'status' ? value : task.status,
            priority: field === 'priority' ? value : task.priority,
            assigneeId: field === 'assigneeId' ? (value === 'unassigned' ? null : value) : task.assigneeId,
            projectId: task.projectId,
        }

        const result = await updateTask(task.id, updateData)

        if (result.success) {
            // Emitting system comment if one was generated
            if (socket) {
                if (result.systemComment) {
                    socket.emit('task-comment', {
                        ...result.systemComment,
                        createdAt: result.systemComment.createdAt.toISOString(),
                        updatedAt: result.systemComment.updatedAt.toISOString(),
                        projectId: task.projectId
                    })
                }

                // Emit task-updated to sync other clients
                socket.emit('task-updated', {
                    ...updateData,
                    taskId: task.id,
                    projectId: task.projectId
                })
            }
            router.refresh()
        } else {
            alert(result.error || 'Failed to update task')
        }

        setIsUpdating(false)
    }

    const statusLabels = {
        todo: 'To Do',
        in_progress: 'In Progress',
        review: 'Review',
        blocked: 'Blocked',
        done: 'Done',
    }

    const priorityLabels = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical',
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Assignee */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Assignee
                    </label>
                    {task.assignee ? (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={task.assignee.avatarUrl || ''} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                    {task.assignee.fullName?.charAt(0) || task.assignee.email.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">
                                {task.assignee.fullName || task.assignee.email}
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Unassigned</p>
                    )}
                    <Select
                        value={task.assigneeId || 'unassigned'}
                        onValueChange={(value) => handleUpdate('assigneeId', value)}
                        disabled={isUpdating}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Change assignee..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.fullName || user.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Status
                    </label>
                    <Select
                        value={task.status}
                        onValueChange={(value) => handleUpdate('status', value)}
                        disabled={isUpdating}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(statusLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Priority
                    </label>
                    <Select
                        value={task.priority}
                        onValueChange={(value) => handleUpdate('priority', value)}
                        disabled={isUpdating}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(priorityLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    )
}
