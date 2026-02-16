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
import { updateProject } from '@/app/actions/projects'
import { useToast } from '@/hooks/use-toast'

interface EditProjectDialogProps {
    project: {
        id: string
        name: string
        description: string | null
        status: string
        clientName: string | null
        clientPhone: string | null
        clientEmail: string | null
        projectType: string | null
        totalAmount: any
        advanceAmount: any
        deadline: Date | null
        revisionLimit: number | null
        assignedLeadId: string | null
        priority: string | null
        maintenancePlan: boolean | null
        notifyClient: boolean | null
    }
    trigger?: React.ReactNode
    members?: { id: string; fullName: string | null; avatarUrl: string | null }[]
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function EditProjectDialog({
    project,
    trigger,
    members = [],
    open: controlledOpen,
    onOpenChange: setControlledOpen
}: EditProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const { toast } = useToast()
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = (setControlledOpen || setInternalOpen) as (open: boolean) => void

    const [formData, setFormData] = useState({
        name: project.name,
        description: project.description || '',
        status: project.status,
        clientName: project.clientName || '',
        clientPhone: project.clientPhone || '',
        clientEmail: project.clientEmail || '',
        projectType: project.projectType || 'website',
        totalAmount: project.totalAmount ? project.totalAmount.toString() : '',
        advanceAmount: project.advanceAmount ? project.advanceAmount.toString() : '',
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
        revisionLimit: project.revisionLimit ? project.revisionLimit.toString() : '2',
        assignedLeadId: project.assignedLeadId || 'none',
        priority: project.priority || 'medium',
        maintenancePlan: project.maintenancePlan ? 'yes' : 'no'
    })

    // Initialize notifyClient separately if needed or ensure project type matches
    const [notifyClient, setNotifyClient] = useState(true)

    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // DEBUG: Alert using standard alert to ensure user sees it
        // alert('Submit Triggered') 

        console.log('Submitting Edit Form...', formData)

        if (!formData.name.trim()) {
            alert('Validation Failed: Project Name is required')
            return
        }

        setIsLoading(true)

        try {
            // alert('Sending data to server...')
            const result = await updateProject(project.id, {
                name: formData.name,
                description: formData.description || null,
                status: formData.status,
                clientName: formData.clientName,
                clientPhone: formData.clientPhone || null,
                clientEmail: formData.clientEmail || null,
                projectType: formData.projectType || null,
                // Safely handle number conversions - fallback to null or 0 if NaN
                totalAmount: formData.totalAmount ? (isNaN(Number(formData.totalAmount)) ? null : Number(formData.totalAmount)) : null,
                advanceAmount: formData.advanceAmount ? (isNaN(Number(formData.advanceAmount)) ? null : Number(formData.advanceAmount)) : null,
                deadline: formData.deadline ? new Date(formData.deadline) : null,
                revisionLimit: formData.revisionLimit ? (isNaN(Number(formData.revisionLimit)) ? null : Number(formData.revisionLimit)) : null,
                assignedLeadId: formData.assignedLeadId === 'none' ? null : formData.assignedLeadId,
                priority: formData.priority || null,
                maintenancePlan: formData.maintenancePlan === 'yes',
                notifyClient: notifyClient
            })

            console.log('Update result:', result)

            if (result.success) {
                setOpen(false)
                router.refresh()
                toast({
                    title: "Project Updated",
                    description: "The project details have been successfully updated.",
                })
            } else {
                console.error('Update failed:', result.error)
                alert(`Update Failed: ${result.error}`)
            }
        } catch (error) {
            console.error('Submission error:', error)
            alert(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setIsLoading(false)
        }
    }

    // Pass `isLoading` or `setOpen` logic if needed. 
    // Trigger logic:
    // If trigger is provided, use it. Else default button.

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Edit Project</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                            Update project details.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Project Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="clientName">Client Name *</Label>
                                <Input
                                    id="clientName"
                                    value={formData.clientName}
                                    onChange={(e) => handleChange('clientName', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Client Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="clientEmail">Client Email</Label>
                                <Input
                                    id="clientEmail"
                                    type="email"
                                    value={formData.clientEmail}
                                    onChange={(e) => handleChange('clientEmail', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="clientPhone">Client Phone</Label>
                                <Input
                                    id="clientPhone"
                                    value={formData.clientPhone}
                                    onChange={(e) => handleChange('clientPhone', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={2}
                            />
                        </div>

                        {/* Project Settings */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="projectType">Type</Label>
                                <Select value={formData.projectType} onValueChange={(v) => handleChange('projectType', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="website">Website</SelectItem>
                                        <SelectItem value="app">App</SelectItem>
                                        <SelectItem value="both">Both</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on_hold">On Hold</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Financials & Dates */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="totalAmount">Total Amount</Label>
                                <Input
                                    id="totalAmount"
                                    type="number"
                                    value={formData.totalAmount}
                                    onChange={(e) => handleChange('totalAmount', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="advanceAmount">Advance</Label>
                                <Input
                                    id="advanceAmount"
                                    type="number"
                                    value={formData.advanceAmount}
                                    onChange={(e) => handleChange('advanceAmount', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="deadline">Deadline</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => handleChange('deadline', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Assignment & Other */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="assignedLead">Assigned Lead</Label>
                                <Select value={formData.assignedLeadId} onValueChange={(v) => handleChange('assignedLeadId', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Lead" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        {members.map(member => (
                                            <SelectItem key={member.id} value={member.id}>
                                                {member.fullName || member.id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="revisionLimit">Rev. Limit</Label>
                                <Input
                                    id="revisionLimit"
                                    type="number"
                                    value={formData.revisionLimit}
                                    onChange={(e) => handleChange('revisionLimit', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="maintenance">Maintenance</Label>
                                <Select value={formData.maintenancePlan} onValueChange={(v) => handleChange('maintenancePlan', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no">No</SelectItem>
                                        <SelectItem value="yes">Yes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

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
                        <Button
                            type="button"
                            onClick={(e) => handleSubmit(e as any)}
                            disabled={isLoading || !formData.name.trim()}
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
