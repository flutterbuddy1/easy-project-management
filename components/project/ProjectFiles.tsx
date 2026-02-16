'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, File as FileIcon, Trash2, Download, Image as ImageIcon, FileText, Film, Music } from 'lucide-react'
import { getProjectFiles, deleteFile } from '@/app/actions/files'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface FileData {
    id: string
    name: string
    url: string
    size: number
    type: string
    createdAt: Date
    uploadedBy: {
        id: string
        fullName: string | null
    }
}

interface ProjectFilesProps {
    projectId: string
    currentUserId: string
}

export function ProjectFiles({ projectId, currentUserId }: ProjectFilesProps) {
    const [files, setFiles] = useState<FileData[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const fetchFiles = async () => {
        setIsLoading(true)
        const result = await getProjectFiles(projectId)
        if (result.success && result.files) {
            setFiles(result.files)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchFiles()
    }, [projectId])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('projectId', projectId)
        formData.append('userId', currentUserId)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()

            if (data.success) {
                toast({ title: 'Success', description: 'File uploaded successfully' })
                fetchFiles()
            } else {
                toast({ title: 'Error', description: data.error || 'Upload failed', variant: 'destructive' })
            }
        } catch (error) {
            console.error(error)
            toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' })
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return

        const result = await deleteFile(fileId, projectId)
        if (result.success) {
            toast({ title: 'Success', description: 'File deleted' })
            setFiles(prev => prev.filter(f => f.id !== fileId))
        } else {
            toast({ title: 'Error', description: 'Failed to delete file', variant: 'destructive' })
        }
    }

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />
        if (type.startsWith('video/')) return <Film className="h-8 w-8 text-purple-500" />
        if (type.startsWith('audio/')) return <Music className="h-8 w-8 text-pink-500" />
        if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
        return <FileIcon className="h-8 w-8 text-gray-500" />
    }

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Project Files</h3>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading files...</div>
            ) : files.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 bg-muted/20">
                    <FileIcon className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No files uploaded yet</p>
                    <Button variant="link" onClick={() => fileInputRef.current?.click()}>
                        Upload your first file
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-4">
                    {files.map(file => (
                        <Card key={file.id} className="overflow-hidden group hover:shadow-md transition-all">
                            <CardContent className="p-3">
                                <div className="aspect-square bg-muted/30 rounded-md flex items-center justify-center mb-3 relative group-hover:bg-muted/50 transition-colors">
                                    {file.type.startsWith('image/') ? (
                                        <img src={file.url} alt={file.name} className="w-full h-full object-cover rounded-md" />
                                    ) : (
                                        getFileIcon(file.type)
                                    )}

                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-md">
                                        <Link href={file.url} target="_blank" download>
                                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-8 w-8 rounded-full"
                                            onClick={() => handleDelete(file.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{formatSize(file.size)}</span>
                                        <span>{format(new Date(file.createdAt), 'MMM d')}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        by {file.uploadedBy.fullName || 'Unknown'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
