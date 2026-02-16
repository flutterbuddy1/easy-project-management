'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Clock, AlertTriangle, CheckCircle2, FolderOpen } from 'lucide-react'

interface ProjectStats {
    activeProjects: number
    nearDeadline: number
    overdueProjects: number
    revenueThisMonth: number
    pendingPayments: number
}

interface ProjectSummaryStatsProps {
    stats: ProjectStats
}

export function ProjectSummaryStats({ stats }: ProjectSummaryStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Active Projects
                    </CardTitle>
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeProjects}</div>
                    <p className="text-xs text-muted-foreground">
                        Currently in progress
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Due Soon
                    </CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.nearDeadline}</div>
                    <p className="text-xs text-muted-foreground">
                        Within next 3 days
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Overdue
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.overdueProjects}</div>
                    <p className="text-xs text-muted-foreground">
                        Past deadline
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Revenue (Mo)
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ${stats.revenueThisMonth.toLocaleString('en-US')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Collected this month
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Pending
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ${stats.pendingPayments.toLocaleString('en-US')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Total pending amount
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
