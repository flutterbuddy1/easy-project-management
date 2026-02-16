'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProjectFiles(projectId: string) {
    try {
        const files = await prisma.file.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true
                    }
                }
            }
        })
        return { success: true, files }
    } catch (error) {
        console.error('Error fetching files:', error)
        return { success: false, error: 'Failed to fetch files' }
    }
}

export async function deleteFile(fileId: string, projectId: string) {
    try {
        await prisma.file.delete({
            where: { id: fileId }
        })
        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true }
    } catch (error) {
        console.error('Error deleting file:', error)
        return { success: false, error: 'Failed to delete file' }
    }
}
