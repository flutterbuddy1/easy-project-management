'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface CreateProjectData {
    name: string
    description: string | null
    status: string
    clientName: string
    clientPhone?: string | null
    clientEmail?: string | null
    projectType: string
    totalAmount?: number | null
    advanceAmount?: number | null
    deadline?: Date | null
    revisionLimit?: number
    assignedLeadId?: string | null
    priority: string
    maintenancePlan: boolean
    customerId?: string
    notifyClient?: boolean
}

export async function createProject(data: CreateProjectData) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, organizationId: true, role: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not in an organization' }
        }

        const { hasPermission, PERMISSIONS } = await import('@/lib/permissions')
        if (!hasPermission(user.role, PERMISSIONS.CREATE_PROJECT)) {
            return { success: false, error: 'Unauthorized: Insufficient permissions' }
        }

        // Get customer email/id logic
        let clientEmailToUse = data.clientEmail || null
        let customerIdToUse = data.customerId

        // If no customer ID but client name provided, find or create customer
        if (!customerIdToUse && data.clientName) {
            // Check for existing customer to avoid duplicates
            const existingCustomer = await prisma.customer.findFirst({
                where: {
                    organizationId: user.organizationId,
                    name: { equals: data.clientName, mode: 'insensitive' }
                }
            })

            if (existingCustomer) {
                customerIdToUse = existingCustomer.id
                // Use existing email if not provided in form
                if (!clientEmailToUse) clientEmailToUse = existingCustomer.email
            } else {
                // Create new customer
                try {
                    const newCustomer = await prisma.customer.create({
                        data: {
                            name: data.clientName,
                            email: data.clientEmail,
                            phone: data.clientPhone,
                            organizationId: user.organizationId
                        }
                    })
                    customerIdToUse = newCustomer.id
                } catch (customerError) {
                    console.error('Failed to auto-create customer:', customerError)
                    // Continue without linking if creation fails
                }
            }
        } else if (customerIdToUse && !clientEmailToUse) {
            // Existing logic: fetch email from provided customerId
            const customer = await prisma.customer.findUnique({ where: { id: customerIdToUse } })
            if (customer?.email) clientEmailToUse = customer.email
        }

        // Create project
        const project = await prisma.project.create({
            data: {
                name: data.name,
                description: data.description,
                status: data.status,
                organizationId: user.organizationId,
                createdById: user.id,
                clientName: data.clientName,
                clientPhone: data.clientPhone,
                clientEmail: clientEmailToUse,
                projectType: data.projectType,
                totalAmount: data.totalAmount,
                advanceAmount: data.advanceAmount,
                deadline: data.deadline,
                revisionLimit: data.revisionLimit,
                assignedLeadId: data.assignedLeadId && data.assignedLeadId !== 'none' ? data.assignedLeadId : null,
                priority: data.priority,
                maintenancePlan: data.maintenancePlan,
                customerId: customerIdToUse,
                notifyClient: data.notifyClient ?? true
            }
        })

        // Send Email if requested
        // Send Email if requested
        console.log('Checking email trigger:', { notifyClient: data.notifyClient, clientEmailToUse })

        if (data.notifyClient && clientEmailToUse) {
            console.log('Attempting to send Project Started email to:', clientEmailToUse)
            try {
                // Lazy import to avoid circular dep issues if any, or just import at top
                const { sendProjectStartedEmail } = await import('@/lib/email')
                await sendProjectStartedEmail({
                    to: clientEmailToUse,
                    clientName: data.clientName,
                    projectName: data.name,
                    projectType: data.projectType,
                    deadline: data.deadline,
                    loginLink: `${process.env.NEXT_PUBLIC_APP_URL}/login` // Assuming client portal login
                })
                console.log('Project Started email sent successfully.')
            } catch (emailError) {
                console.error('Failed to send Project Started email:', emailError)
            }
        } else {
            console.log('Skipping email. Reason:', !data.notifyClient ? 'Notify disabled' : 'No email provided')
        }

        revalidatePath('/dashboard/projects')

        return { success: true, project }
    } catch (error) {
        console.error('Error in createProject:', error)
        return { success: false, error: 'Failed to create project' }
    }
}

interface UpdateProjectData {
    name: string
    description: string | null
    status: string
    clientName: string
    clientPhone?: string | null
    clientEmail?: string | null
    projectType?: string | null
    totalAmount?: number | null
    advanceAmount?: number | null
    deadline?: Date | null
    revisionLimit?: number | null
    assignedLeadId?: string | null
    priority?: string | null
    maintenancePlan?: boolean | null
    notifyClient?: boolean
}

export async function updateProject(id: string, data: UpdateProjectData) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        // Get user with organization
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not found or not in an organization' }
        }

        // Verify project belongs to user's organization
        const project = await prisma.project.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        // Check permissions (Legacy role check for now)
        const { hasPermission, PERMISSIONS } = await import('@/lib/permissions')
        if (!hasPermission(user.role, PERMISSIONS.UPDATE_PROJECT)) {
            console.error('Unauthorized update attempt by:', user.email)
            return { success: false, error: 'Unauthorized: Insufficient permissions' }
        }

        console.log('Updating project:', id, 'with data:', JSON.stringify(data))

        // Update project
        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                status: data.status,
                clientName: data.clientName,
                clientPhone: data.clientPhone,
                clientEmail: data.clientEmail,
                projectType: data.projectType || undefined,
                totalAmount: data.totalAmount,
                advanceAmount: data.advanceAmount,
                deadline: data.deadline,
                revisionLimit: data.revisionLimit ?? undefined,
                assignedLeadId: data.assignedLeadId && data.assignedLeadId !== 'none' ? data.assignedLeadId : null,
                priority: data.priority || undefined,
                maintenancePlan: data.maintenancePlan ?? undefined,
                notifyClient: data.notifyClient ?? undefined
            }
        })

        // Sync Customer details if project is linked to a customer
        if (updatedProject.customerId) {
            try {
                await prisma.customer.update({
                    where: { id: updatedProject.customerId },
                    data: {
                        name: data.clientName || undefined,
                        email: data.clientEmail || undefined,
                        phone: data.clientPhone || undefined
                    }
                })
                console.log('Synced customer details for customer:', updatedProject.customerId)
            } catch (syncError) {
                console.error('Failed to sync customer details:', syncError)
                // Non-blocking error, we don't fail the project update
            }
        }

        console.log('Project updated successfully:', updatedProject.id)

        revalidatePath('/dashboard/projects')
        revalidatePath(`/dashboard/projects/${id}`)


        return { success: true }
    } catch (error) {
        console.error('Error in updateProject:', error)
        return { success: false, error: `Failed to update project: ${error instanceof Error ? error.message : String(error)}` }
    }
}

export async function updateProjectStatus(id: string, status: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, organizationId: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not found' }
        }

        await prisma.project.update({
            where: { id, organizationId: user.organizationId },
            data: { status }
        })

        revalidatePath('/dashboard/projects')
        revalidatePath(`/dashboard/projects/${id}`)

        return { success: true }
    } catch (error) {
        console.error('Error updating project status:', error)
        return { success: false, error: 'Failed to update status' }
    }
}

export async function deleteProject(id: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, organizationId: true, role: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not found' }
        }

        // Verify project belongs to user's organization
        const project = await prisma.project.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        if (project._count.tasks > 0) {
            return {
                success: false,
                error: 'Cannot delete project with existing tasks. Please delete all tasks first.'
            }
        }

        // Delete project (cascades to tasks due to schema)
        await prisma.project.delete({
            where: { id }
        })

        revalidatePath('/dashboard/projects')

        return { success: true }
    } catch (error) {
        console.error('Error in deleteProject:', error)
        return { success: false, error: 'Failed to delete project' }
    }
}

export async function getProjects() {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not in organization', projects: [] }
        }

        const { hasPermission, PERMISSIONS, ROLES } = await import('@/lib/permissions')

        let whereClause: any = {
            organizationId: user.organizationId,
        }

        // If user is a viewer/client, only show their projects
        if (session.user.role === ROLES.VIEWER) {
            whereClause = {
                ...whereClause,
                OR: [
                    { clientEmail: session.user.email },
                    { customer: { email: session.user.email } }
                ]
            }
        }

        const projects = await prisma.project.findMany({
            where: whereClause,
            include: {
                assignedLead: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true
                    }
                },
                customer: true, // Include customer to check email if needed
                _count: {
                    select: { tasks: true }
                },
                tasks: {
                    select: { status: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        })


        return { success: true, projects }
    } catch (error) {
        console.error('Error fetching projects:', error)
        return { success: false, error: 'Failed to fetch projects', projects: [] }
    }
}

export async function getOrganizationUsers() {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not in organization', users: [] }
        }

        const users = await prisma.user.findMany({
            where: {
                organizationId: user.organizationId
            },
            select: {
                id: true,
                fullName: true,
                avatarUrl: true
            }
        })

        return { success: true, users }
    } catch (error) {
        console.error('Error fetching users:', error)
        return { success: false, error: 'Failed to fetch users', users: [] }
    }
}

export async function getProjectStats() {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true }
        })

        if (!user || !user.organizationId) {
            return { success: false, error: 'User not in organization' }
        }

        const { ROLES } = await import('@/lib/permissions')

        // Use Prisma.ProjectWhereInput specific type or logic
        // We need to cast or build it carefully to allow relation filtering if Customer exists
        let whereClause: any = {
            organizationId: user.organizationId,
        }

        if (session.user.role === ROLES.VIEWER) {
            whereClause = {
                organizationId: user.organizationId, // Ensure specificity
                OR: [
                    { clientEmail: session.user.email },
                    // Use array for relation if supported by current client, otherwise string filtering
                    { customer: { email: session.user.email } }
                ]
            }
        }

        const projects = await prisma.project.findMany({
            where: whereClause,
            select: {
                status: true,
                deadline: true,
                totalAmount: true,
                advanceAmount: true,
                createdAt: true
            }
        }) as {
            status: string,
            deadline: Date | null,
            totalAmount: any,
            advanceAmount: any,
            createdAt: Date
        }[]

        const now = new Date()
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(now.getDate() + 3)

        const activeProjects = projects.filter(p => p.status === 'active').length
        const nearDeadline = projects.filter(p =>
            p.deadline &&
            new Date(p.deadline) > now &&
            new Date(p.deadline) <= threeDaysFromNow &&
            p.status !== 'completed'
        ).length
        const overdueProjects = projects.filter(p =>
            p.deadline &&
            new Date(p.deadline) < now &&
            p.status !== 'completed'
        ).length

        // Revenue This Month (Projects created this month * totalAmount - simplest approx for "Revenue")
        // Or strictly Advance collected this month? USER SAID "Revenue This Month". 
        // Let's assume (Advance Amount of projects created this month) for now as "Revenue".
        // Or sum of TotalAmount for completed projects this month?
        // Let's go with Total Amount of projects created this month for simple "Projected Revenue" or just Advance.
        // Let's calc Advance Amount of projects created this month + (Total - Advance) of completed projects this month? Too complex.
        // Let's stick to "Advance received this month" + "Remaining received for completed this month".
        // Simplified: Sum of `advanceAmount` for projects created this month.

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const revenueThisMonth = projects
            .filter(p => new Date(p.createdAt) >= startOfMonth)
            .reduce((sum, p) => sum + (Number(p.advanceAmount) || 0), 0)

        const pendingPayments = projects
            .filter(p => p.status !== 'archived')
            .reduce((sum, p) => sum + ((Number(p.totalAmount) || 0) - (Number(p.advanceAmount) || 0)), 0)

        // Workload per developer
        // We need to fetch tasks assigned to users to calculate workload IF we want accurate task-based workload.
        // USER SAID: "For each developer: Show number of active projects assigned."
        // So we need to count projects where user is assignedLead.

        const developers = await prisma.user.findMany({
            where: { organizationId: user.organizationId },
            select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                leadProjects: {
                    where: { status: 'active' },
                    select: { id: true }
                }
            }
        })

        const developerWorkload = developers.map(dev => ({
            id: dev.id,
            name: dev.fullName,
            avatar: dev.avatarUrl,
            activeProjects: dev.leadProjects.length
        }))

        return {
            success: true,
            stats: {
                activeProjects,
                nearDeadline,
                overdueProjects,
                revenueThisMonth,
                pendingPayments
            },
            developerWorkload
        }

    } catch (error) {
        console.error('Error fetching project stats:', error)
        return { success: false, error: 'Failed to fetch project stats' }
    }
}

export async function sendProjectUpdate(projectId: string, message: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return { success: false, error: 'Not authenticated' }
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { customer: true }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        const clientEmail = project.clientEmail || project.customer?.email
        const clientName = project.clientName || project.customer?.name || 'Client'

        if (!clientEmail) {
            return { success: false, error: 'No client email found for this project' }
        }

        const { sendProjectUpdateEmail } = await import('@/lib/email')
        await sendProjectUpdateEmail({
            to: clientEmail,
            clientName,
            projectName: project.name,
            updateMessage: message,
            loginLink: `${process.env.NEXT_PUBLIC_APP_URL}/login`
        })

        return { success: true }
    } catch (error) {
        console.error('Error sending project update:', error)
        return { success: false, error: 'Failed to send update' }
    }
}
