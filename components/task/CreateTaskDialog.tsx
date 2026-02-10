'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTask } from '@/app/actions/tasks'
import { getProjects } from '@/app/actions/projects'
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
import { Plus } from 'lucide-react'

interface CreateTaskDialogProps {
    projectId?: string
    status?: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    teamMembers?: Array<{ id: string; fullName: string | null; email: string }>
}

export function CreateTaskDialog({ projectId: propProjectId, status = 'todo', open: controlledOpen, onOpenChange: setControlledOpen, teamMembers = [] }: CreateTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = (setControlledOpen || setInternalOpen) as (open: boolean) => void

    // If projectId is not passed, we need to let user select one
    const [selectedProjectId, setSelectedProjectId] = useState(propProjectId || '')
    const [projects, setProjects] = useState<{ id: string, name: string }[]>([])

    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState('medium')
    const [taskStatus, setTaskStatus] = useState(status)
    const [assignedTo, setAssignedTo] = useState('unassigned')
    const router = useRouter()

    useEffect(() => {
        if (!propProjectId && open) {
            // Fetch projects if not provided and dialog is open
            getProjects().then((result) => {
                if (result.success && result.projects) {
                    setProjects(result.projects)
                    if (result.projects.length > 0 && !selectedProjectId) {
                        setSelectedProjectId(result.projects[0].id)
                    }
                }
            })
        } else if (propProjectId) {
            setSelectedProjectId(propProjectId)
        }
    }, [open, propProjectId, selectedProjectId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!selectedProjectId) return

        try {
            const result = await createTask({
                title,
                description,
                projectId: selectedProjectId,
                status: taskStatus,
                priority,
                assigneeId: assignedTo === 'unassigned' ? undefined : assignedTo
            })

            if (result.success) {
                setOpen(false)
                setTitle('')
                setDescription('')
                setPriority('medium')
                setTaskStatus(status)
                setAssignedTo('unassigned')
                router.refresh()
            } else {
                console.error('Error creating task:', result.error || 'Failed to create task')
            }
        } catch (error) {
            console.error('An error occurred:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Task
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>
                            Add a new task to your project.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {!propProjectId && (
                            <div className="grid gap-2">
                                <Label htmlFor="project">Project</Label>
                                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter task title"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter task description"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={taskStatus} onValueChange={setTaskStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todo">To Do</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="done">Done</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {teamMembers.length > 0 && (
                            <div className="grid gap-2">
                                <Label htmlFor="assignee">Assignee</Label>
                                <Select value={assignedTo} onValueChange={setAssignedTo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select assignee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {teamMembers.map((member) => (
                                            <SelectItem key={member.id} value={member.id}>
                                                {member.fullName || member.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
