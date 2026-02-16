'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Save, X } from 'lucide-react'
import { updateTask } from '@/app/actions/tasks'
import { io } from 'socket.io-client'

interface TaskDescriptionProps {
    task: {
        id: string
        title: string
        description: string | null
        status: string
        priority: string
        assigneeId: string | null
        projectId: string
    }
}

export function TaskDescription({ task }: TaskDescriptionProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [description, setDescription] = useState(task.description || '')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const [socket, setSocket] = useState<any>(null)

    useEffect(() => {
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000')
        socketInstance.on('connect', () => {
            // Join project room to ensure we can emit to it (though emit doesn't strictly require join if we just fire event, but good practice)
            if (task.projectId) socketInstance.emit('join-project', task.projectId)
        })
        setSocket(socketInstance)
        return () => {
            socketInstance.disconnect()
        }
    }, [task.projectId])

    const handleSave = async () => {
        setIsLoading(true)

        const result = await updateTask(task.id, {
            title: task.title,
            description: description || null,
            status: task.status,
            priority: task.priority,
            assigneeId: task.assigneeId,
            projectId: task.projectId,
        })

        if (result.success) {
            if (socket) {
                socket.emit('task-updated', {
                    taskId: task.id,
                    projectId: task.projectId,
                    description: description || null
                })
            }
            setIsEditing(false)
            router.refresh()
        } else {
            alert(result.error || 'Failed to update description')
        }

        setIsLoading(false)
    }

    const handleCancel = () => {
        setDescription(task.description || '')
        setIsEditing(false)
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Description</CardTitle>
                    {!isEditing ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="gap-2"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {isLoading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a description for this task..."
                        rows={8}
                        className="resize-none"
                    />
                ) : (
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {task.description || (
                            <span className="italic">No description provided.</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
