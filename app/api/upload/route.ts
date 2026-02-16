
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData()
        const file: File | null = data.get('file') as unknown as File
        const projectId = data.get('projectId') as string
        const userId = data.get('userId') as string

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
        }

        if (!projectId || !userId) {
            return NextResponse.json({ success: false, error: 'Missing project or user ID' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Ensure uploads directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads')
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const sanitizedParams = file.name.replace(/\s+/g, '-').replace(/[^\w.-]/g, '')
        const finalFilename = `${uniqueSuffix}-${sanitizedParams}`
        const path = join(uploadDir, finalFilename)

        // Write file
        await writeFile(path, buffer)

        const fileUrl = `/uploads/${finalFilename}`

        // Save to Database
        const dbFile = await prisma.file.create({
            data: {
                name: file.name,
                url: fileUrl,
                size: file.size,
                type: file.type || 'application/octet-stream',
                projectId,
                uploadedById: userId
            }
        })

        return NextResponse.json({
            success: true,
            file: dbFile
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
    }
}
