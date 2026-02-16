'use client'

import { useState } from 'react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { PERMISSIONS } from '@/lib/permissions'
import { ProjectCard } from './ProjectCard'
import { CreateProjectDialog } from './CreateProjectDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'

interface ProjectListProps {
    initialProjects: any[]
    members: any[]
    customers: any[]
}

export function ProjectList({ initialProjects, members, customers }: ProjectListProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [paymentFilter, setPaymentFilter] = useState('all')
    const [developerFilter, setDeveloperFilter] = useState('all')

    const filteredProjects = initialProjects.filter(project => {
        // Search
        const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
            (project.clientName && project.clientName.toLowerCase().includes(search.toLowerCase()))

        // Status Filter
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter

        // Developer Filter
        const matchesDeveloper = developerFilter === 'all' || project.assignedLeadId === developerFilter

        // Payment Filter (Logic from Card)
        let matchesPayment = true
        if (paymentFilter !== 'all') {
            const total = Number(project.totalAmount) || 0
            const advance = Number(project.advanceAmount) || 0
            let status = 'pending'
            if (total > 0) {
                if (advance >= total) status = 'paid'
                else if (advance > 0) status = 'partial'
            }
            matchesPayment = status === paymentFilter
        }

        return matchesSearch && matchesStatus && matchesDeveloper && matchesPayment
    })

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('all')
        setPaymentFilter('all')
        setDeveloperFilter('all')
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search projects..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Payment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Payments</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={developerFilter} onValueChange={setDeveloperFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Developer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Developers</SelectItem>
                            {members.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {(search || statusFilter !== 'all' || paymentFilter !== 'all' || developerFilter !== 'all') && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters">
                            <X className="h-4 w-4" />
                        </Button>
                    )}

                    <RoleGuard permission={PERMISSIONS.CREATE_PROJECT}>
                        <CreateProjectDialog members={members} customers={customers} />
                    </RoleGuard>
                </div>
            </div>

            {filteredProjects.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            members={members}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No projects found matching your filters.</p>
                    <Button variant="link" onClick={clearFilters} className="mt-2">Clear all filters</Button>
                </div>
            )}
        </div>
    )
}
