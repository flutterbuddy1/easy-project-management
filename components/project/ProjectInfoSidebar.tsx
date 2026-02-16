import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Mail, Phone, DollarSign, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ClientContactDetails } from './ClientContactDetails'

interface ProjectInfoSidebarProps {
    project: {
        id: string
        name: string
        description: string | null
        status: string
        createdAt: Date
        updatedAt: Date
        clientName: string | null
        clientPhone: string | null
        clientEmail: string | null
        projectType: string | null
        totalAmount: any
        advanceAmount: any
        deadline: Date | null
        revisionLimit: number | null
        priority: string | null
        maintenancePlan: boolean | null
        assignedLead: {
            id: string
            fullName: string | null
            image?: string | null
            avatarUrl?: string | null
        } | null
    }
    userRole: string
}

export function ProjectInfoSidebar({ project, userRole }: ProjectInfoSidebarProps) {
    // Payment Status Logic
    const total = Number(project.totalAmount) || 0
    const advance = Number(project.advanceAmount) || 0
    let paymentStatus = 'pending'
    let paymentColor = 'bg-yellow-100 text-yellow-800 border-yellow-200'

    if (total > 0) {
        if (advance >= total) {
            paymentStatus = 'paid'
            paymentColor = 'bg-green-100 text-green-800 border-green-200'
        } else if (advance > 0) {
            paymentStatus = 'partial'
            paymentColor = 'bg-blue-100 text-blue-800 border-blue-200'
        }
    } else {
        paymentStatus = 'unpaid'
        paymentColor = 'bg-gray-100 text-gray-800 border-gray-200'
    }

    // Deadline Logic
    const daysLeft = project.deadline ? differenceInDays(new Date(project.deadline), new Date()) : null
    let deadlineColor = 'text-green-600'
    if (daysLeft !== null && daysLeft <= 3) deadlineColor = 'text-orange-600'
    if (daysLeft !== null && daysLeft < 0) deadlineColor = 'text-red-600'

    return (
        <Card className="h-full border-none shadow-none bg-transparent space-y-8">
            {/* Client Info Section */}
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center uppercase tracking-wider">
                    <User className="h-3.5 w-3.5 mr-2" />
                    Client Details
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 border space-y-3">
                    <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Contact Name</p>
                        <p className="text-sm font-medium">{project.clientName || 'N/A'}</p>
                    </div>

                    <ClientContactDetails
                        email={project.clientEmail}
                        phone={project.clientPhone}
                        userRole={userRole}
                    />
                </div>
            </div>

            {/* Project Details Section */}
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5 mr-2" />
                    Project Details
                </h3>
                <div className="bg-card rounded-lg border divide-y shadow-sm">
                    <div className="p-3 flex justify-between items-center bg-muted/10">
                        <span className="text-sm text-muted-foreground">Type</span>
                        <Badge variant="outline" className="capitalize bg-background text-xs font-normal">{project.projectType || 'Standard'}</Badge>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Priority</span>
                        <Badge variant={project.priority === 'high' ? 'destructive' : project.priority === 'medium' ? 'default' : 'secondary'} className="capitalize text-xs">
                            {project.priority || 'Medium'}
                        </Badge>
                    </div>
                    <div className="p-3 flex justify-between items-center bg-muted/10">
                        <span className="text-sm text-muted-foreground">Deadline</span>
                        <div className="text-right">
                            <div className={`text-sm font-medium ${deadlineColor}`}>
                                {project.deadline ? format(new Date(project.deadline), 'MMM d, yyyy') : 'No Date'}
                            </div>
                            {daysLeft !== null && (
                                <div className={`text-[10px] ${daysLeft < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    {daysLeft < 0 ? `${Math.abs(daysLeft as number)} days overdue` : `${daysLeft} days left`}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Lead</span>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={project.assignedLead?.avatarUrl || project.assignedLead?.image || ''} />
                                <AvatarFallback className="text-[9px]">
                                    {project.assignedLead?.fullName?.charAt(0) || <User className="h-3 w-3" />}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs truncate max-w-[100px]" title={project.assignedLead?.fullName || 'Unassigned'}>
                                {project.assignedLead?.fullName || 'Unassigned'}
                            </span>
                        </div>
                    </div>
                    <div className="p-3 flex justify-between items-center bg-muted/10">
                        <span className="text-sm text-muted-foreground">Revisions</span>
                        <span className="text-sm font-medium">{project.revisionLimit || 0}</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Maintenance</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${project.maintenancePlan ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {project.maintenancePlan ? 'Active' : 'No'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Financials Section */}
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center uppercase tracking-wider">
                    <DollarSign className="h-3.5 w-3.5 mr-2" />
                    Financials
                </h3>
                <div className="bg-card rounded-lg border p-4 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant="outline" className={`${paymentColor} border-0 capitalize`}>{paymentStatus}</Badge>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Budget</span>
                            <span className="font-semibold">${total.toLocaleString('en-US')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Paid so far</span>
                            <span className="text-green-600 font-medium">+${advance.toLocaleString('en-US')}</span>
                        </div>
                    </div>

                    <div className="pt-3 border-t flex justify-between items-center">
                        <span className="text-sm font-medium">Remaining</span>
                        <span className="text-lg font-bold text-orange-600">
                            ${(total - advance).toLocaleString('en-US')}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    )
}
