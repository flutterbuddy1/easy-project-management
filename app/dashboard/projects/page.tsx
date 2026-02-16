import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProjects, getProjectStats, getOrganizationUsers } from '@/app/actions/projects'
import { getCustomers } from '@/app/actions/customers'
import { ProjectSummaryStats } from '@/components/project/ProjectSummaryStats'
import { DeveloperWorkload } from '@/components/project/DeveloperWorkload'
import { ProjectList } from '@/components/project/ProjectList'

export const metadata = {
    title: 'Projects | Dashboard',
    description: 'Project Control Center',
}

export default async function ProjectsPage() {
    const session = await auth()
    if (!session?.user?.email) {
        redirect('/auth/login')
    }

    // Fetch data in parallel
    const [projectsData, statsData, usersData, customersData] = await Promise.all([
        getProjects(),
        getProjectStats(),
        getOrganizationUsers(),
        getCustomers()
    ])

    if (!projectsData.success || !statsData.success || !usersData.success || !customersData.success) {
        // Handle error gracefully or show alert
        console.error('Failed to load dashboard data')
    }

    const projects = projectsData.projects || []
    const stats = statsData.stats || {
        activeProjects: 0,
        nearDeadline: 0,
        overdueProjects: 0,
        revenueThisMonth: 0,
        pendingPayments: 0
    }
    const workload = statsData.developerWorkload || []
    const members = usersData.users || []
    const customers = customersData.customers || []

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Project Control Center</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your projects, track revenue, and monitor team workload.
                </p>
            </div>

            <ProjectSummaryStats stats={stats} />

            <div className="grid gap-8 lg:grid-cols-4">
                <div className="lg:col-span-3">
                    <ProjectList
                        initialProjects={projects}
                        members={members}
                        customers={customers}
                    />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <DeveloperWorkload workload={workload} />
                </div>
            </div>
        </div>
    )
}
