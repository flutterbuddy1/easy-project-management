'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getCustomers() {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: 'Not authenticated' }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { organizationId: true }
        })

        if (!user?.organizationId) return { success: false, error: 'No organization found' }

        const customers = await prisma.customer.findMany({
            where: { organizationId: user.organizationId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { projects: true }
                }
            }
        })

        return { success: true, customers }
    } catch (error) {
        console.error('Error fetching customers:', error)
        return { success: false, error: 'Failed to fetch customers' }
    }
}

export async function createCustomer(data: { name: string; email?: string; phone?: string }) {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: 'Not authenticated' }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { organizationId: true }
        })

        if (!user?.organizationId) return { success: false, error: 'No organization found' }

        const customer = await prisma.customer.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                organizationId: user.organizationId
            }
        })

        revalidatePath('/dashboard/customers')
        return { success: true, customer }
    } catch (error) {
        console.error('Error creating customer:', error)
        return { success: false, error: 'Failed to create customer' }
    }
}

export async function updateCustomer(id: string, data: { name: string; email?: string; phone?: string }) {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: 'Not authenticated' }

        await prisma.customer.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone
            }
        })

        // Sync updates to linked projects
        await prisma.project.updateMany({
            where: { customerId: id },
            data: {
                clientName: data.name,
                clientEmail: data.email,
                clientPhone: data.phone
            }
        })

        revalidatePath('/dashboard/customers')
        return { success: true }
    } catch (error) {
        console.error('Error updating customer:', error)
        return { success: false, error: 'Failed to update customer' }
    }
}

export async function deleteCustomer(id: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: 'Not authenticated' }

        await prisma.customer.delete({
            where: { id }
        })

        revalidatePath('/dashboard/customers')
        return { success: true }
    } catch (error) {
        console.error('Error deleting customer:', error)
        return { success: false, error: 'Failed to delete customer' }
    }
}
