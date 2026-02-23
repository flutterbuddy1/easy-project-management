import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
    request: NextRequest,
    { params }: { params: { filename: string } }
) {
    const filename = params.filename
    const filePath = join(process.cwd(), 'public', 'uploads', filename)

    if (!existsSync(filePath)) {
        return new NextResponse('File not found', { status: 404 })
    }

    try {
        const fileBuffer = await readFile(filePath)

        // Determine content type based on extension
        const ext = filename.split('.').pop()?.toLowerCase()
        const contentTypeMap: { [key: string]: string } = {
            'pdf': 'application/pdf',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'txt': 'text/plain',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'zip': 'application/zip',
            'csv': 'text/csv'
        }

        const contentType = contentTypeMap[ext || ''] || 'application/octet-stream'

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (error) {
        console.error('Error serving file:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
