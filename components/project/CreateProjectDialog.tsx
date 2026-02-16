'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/app/actions/projects'
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
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Wand2 } from 'lucide-react'

interface CreateProjectDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    members?: { id: string; fullName: string | null; avatarUrl: string | null }[]
    customers?: { id: string; name: string; email: string | null; phone: string | null }[]
}

export function CreateProjectDialog({
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    members = [],
    customers = []
}: CreateProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = (setControlledOpen || setInternalOpen) as (open: boolean) => void

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active',
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        projectType: 'website',
        totalAmount: '',
        advanceAmount: '',
        deadline: '',
        revisionLimit: '2',
        assignedLeadId: 'none',
        priority: 'medium',
        maintenancePlan: 'no',
        customerId: 'new',
        notifyClient: true
    })

    const router = useRouter()

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const handleCustomerChange = (customerId: string) => {
        if (customerId === 'new') {
            handleChange('customerId', 'new')
            setFormData(prev => ({
                ...prev,
                customerId: 'new',
                clientName: '',
                clientEmail: '',
                clientPhone: ''
            }))
        } else {
            const customer = customers.find(c => c.id === customerId)
            if (customer) {
                setFormData(prev => ({
                    ...prev,
                    customerId: customerId,
                    clientName: customer.name,
                    clientEmail: customer.email || '',
                    clientPhone: customer.phone || ''
                }))
            }
        }
    }

    const applyTemplate = () => {
        setFormData(prev => ({
            ...prev,
            deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            revisionLimit: '2',
            projectType: 'website',
            description: 'Standard website development project including homepage, about us, services, and contact page.',
            maintenancePlan: 'no',
            status: 'active',
            priority: 'medium'
            // We can't auto-calculate advance without total, but if total exists:
            // advanceAmount: prev.totalAmount ? (Number(prev.totalAmount) * 0.5).toString() : ''
        }))
    }

    // Auto-calculate remaining logic can be done on blur or effect, but UI asks to "auto-calculate remaining".
    // We display it in the UI maybe? For now just storing inputs.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await createProject({
                name: formData.name,
                description: formData.description,
                status: formData.status,
                clientName: formData.clientName,
                clientPhone: formData.clientPhone,
                clientEmail: formData.clientEmail,
                projectType: formData.projectType,
                totalAmount: formData.totalAmount ? Number(formData.totalAmount) : null,
                advanceAmount: formData.advanceAmount ? Number(formData.advanceAmount) : null,
                deadline: formData.deadline ? new Date(formData.deadline) : null,
                revisionLimit: Number(formData.revisionLimit),
                assignedLeadId: formData.assignedLeadId,
                priority: formData.priority,
                maintenancePlan: formData.maintenancePlan === 'yes',
                customerId: formData.customerId !== 'new' ? formData.customerId : undefined,
                notifyClient: formData.notifyClient
            })

            if (result.success) {
                setOpen(false)
                setFormData({
                    name: '',
                    description: '',
                    status: 'active',
                    clientName: '',
                    clientPhone: '',
                    clientEmail: '',
                    projectType: 'website',
                    totalAmount: '',
                    advanceAmount: '',
                    deadline: '',
                    revisionLimit: '2',
                    assignedLeadId: 'none',
                    priority: 'medium',
                    maintenancePlan: 'no',
                    customerId: 'new',
                    notifyClient: true
                })
                router.refresh()
            } else {
                alert(result.error || 'Failed to create project')
            }
        } catch (error) {
            alert('An error occurred')
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
                        New Project
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                            Enter project details below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end mb-4">
                        <Button type="button" variant="outline" size="sm" onClick={applyTemplate}>
                            <Wand2 className="mr-2 h-3 w-3" />
                            Use Template
                        </Button>
                    </div>

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
                                <Label htmlFor="customer">Customer</Label>
                                <Select value={formData.customerId} onValueChange={handleCustomerChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">-- New Customer --</SelectItem>
                                        {customers.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Client Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="clientName">Client Name *</Label>
                                <Input
                                    id="clientName"
                                    value={formData.clientName}
                                    onChange={(e) => handleChange('clientName', e.target.value)}
                                    required
                                    disabled={formData.customerId !== 'new'}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="clientEmail">Client Email</Label>
                                <Input
                                    id="clientEmail"
                                    type="email"
                                    value={formData.clientEmail}
                                    onChange={(e) => handleChange('clientEmail', e.target.value)}
                                    disabled={formData.customerId !== 'new'}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="clientPhone">Client Phone</Label>
                                <Input
                                    id="clientPhone"
                                    value={formData.clientPhone}
                                    onChange={(e) => handleChange('clientPhone', e.target.value)}
                                    disabled={formData.customerId !== 'new'}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Switch
                                    id="notify-client"
                                    checked={formData.notifyClient}
                                    onCheckedChange={(c) => handleChange('notifyClient', c)}
                                />
                                <Label htmlFor="notify-client">Notify Client via Email</Label>
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
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
