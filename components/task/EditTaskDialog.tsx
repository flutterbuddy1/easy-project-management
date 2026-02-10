'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { updateTask } from '@/app/actions/tasks'

interface EditTaskDialogProps {
    task: {
        id: string
        title: string
        description: string | null
        status: string
        priority: string
        assigneeId: string | null
        projectId: string
    }
    users?: Array<{ id: string; email: string }>
    trigger?: React.ReactNode
}

export function EditTaskDialog({ task, users = [], trigger }: EditTaskDialogProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description || '')
    const [status, setStatus] = useState(task.status)
    const [priority, setPriority] = useState(task.priority)
    const [assignedTo, setAssignedTo] = useState(task.assigneeId || '')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setIsLoading(true)

        const result = await updateTask(task.id, {
            title,
            description: description || null,
            status,
            priority,
            assigneeId: assignedTo === 'unassigned' || !assignedTo ? null : assignedTo,
            projectId: task.projectId,
        })

        if (result.success) {
            setOpen(false)
            router.refresh()
        } else {
            alert(result.error || 'Failed to update task')
        }

        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Edit Task</Button>}
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                        <DialogDescription>
                            Update your task details below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter task title"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter task description (optional)"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todo">To Do</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="review">Review</SelectItem>
                                        <SelectItem value="blocked">Blocked</SelectItem>
                                        <SelectItem value="done">Done</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {users.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="assigned_to">Assign To</Label>
                                <Select value={assignedTo} onValueChange={setAssignedTo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Assign to..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !title.trim()}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
