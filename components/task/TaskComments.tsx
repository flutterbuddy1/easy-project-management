'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Send, Pencil, Trash2, X, Check, Paperclip, FileText, Edit2 } from 'lucide-react'
import { createComment, updateComment, deleteComment } from '@/app/actions/comments'
import { io, Socket } from 'socket.io-client' // Ensure socket.io-client is installed
import { Badge } from '@/components/ui/badge'

interface Comment {
    id: string
    content: string
    type: string // 'user' | 'system'
    fileUrl?: string | null
    fileName?: string | null
    taskId: string
    createdAt: string
    updatedAt: string
    user: {
        id: string
        email: string
        fullName: string | null
        avatarUrl: string | null
    }
}

interface TaskCommentsProps {
    taskId: string
    comments: Comment[]
    currentUserId?: string
    projectId?: string // Pass projectId for socket room
}

export function TaskComments({ taskId, comments: initialComments, currentUserId, projectId }: TaskCommentsProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')
    const [socket, setSocket] = useState<Socket | null>(null)
    const commentsEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    // File Upload State
    const [isUploading, setIsUploading] = useState(false)
    const [attachment, setAttachment] = useState<{ fileUrl: string, fileName: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Sync props to state if initialComments update (e.g. from server refresh)
    useEffect(() => {
        setComments(initialComments)
    }, [initialComments])

    // Scroll to bottom on new comments
    useEffect(() => {
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [comments])

    // Socket Connection
    useEffect(() => {
        if (!projectId) {
            console.log('Socket: No projectId provided')
            return
        }

        console.log('Socket: Initializing connection for project', projectId)
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000')

        socketInstance.on('connect', () => {
            console.log('Socket: Connected', socketInstance.id)
            socketInstance.emit('join-project', projectId)
        })

        socketInstance.on('connect_error', (err) => {
            console.error('Socket: Connection error', err)
        })

        socketInstance.on('new-comment', (newComment: Comment) => {
            console.log('Socket: Received new-comment', newComment)
            if (newComment.taskId === taskId) { // Only add if it belongs to this task
                setComments((prev) => {
                    // Avoid duplicates
                    if (prev.some(c => c.id === newComment.id)) return prev
                    return [...prev, newComment]
                })
            }
        })

        setSocket(socketInstance)

        return () => {
            console.log('Socket: Disconnecting')
            socketInstance.disconnect()
        }
    }, [projectId, taskId])


    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setIsUploading(true)

            const formData = new FormData()
            formData.append('file', file)

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                const data = await response.json()

                if (data.success) {
                    setAttachment({
                        fileUrl: data.fileUrl,
                        fileName: data.fileName
                    })
                } else {
                    alert('Upload failed: ' + data.error)
                }
            } catch (error) {
                console.error('Upload error:', error)
                alert('Upload failed')
            } finally {
                setIsUploading(false)
                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        }
    }

    const handleRemoveAttachment = () => {
        setAttachment(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() && !attachment) return

        setIsSubmitting(true)

        try {
            // Optimistic update could go here, but let's wait for server for simplicity
            const result = await createComment(
                taskId,
                newComment,
                'user',
                attachment?.fileUrl,
                attachment?.fileName
            )

            if (result.success && result.comment) {
                setNewComment('')
                setAttachment(null) // Clear attachment

                // Emit to socket
                if (socket && projectId) {
                    console.log('Socket: Emitting task-comment to project', projectId)

                    // Safely handle date conversion
                    const createdAt = result.comment.createdAt instanceof Date
                        ? result.comment.createdAt.toISOString()
                        : String(result.comment.createdAt)

                    const updatedAt = result.comment.updatedAt instanceof Date
                        ? result.comment.updatedAt.toISOString()
                        : String(result.comment.updatedAt)

                    const commentWithUser = {
                        ...result.comment,
                        createdAt,
                        updatedAt,
                        // User is included in result.comment from our action
                    }

                    socket.emit('task-comment', {
                        ...commentWithUser,
                        projectId // Important for room broadcasting
                    })

                    // Also update local state immediately
                    setComments(prev => [...prev, commentWithUser as unknown as Comment])
                } else {
                    console.log('Socket or projectId missing, refreshing router')
                    router.refresh()
                }

            } else {
                alert(result.error || 'Failed to add comment')
            }
        } catch (error) {
            console.error('Error submitting comment:', error)
            alert('An error occurred while posting the comment')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (comment: Comment) => {
        setEditingId(comment.id)
        setEditContent(comment.content)
    }

    const handleSaveEdit = async (commentId: string) => {
        const result = await updateComment(commentId, editContent)

        if (result.success) {
            setEditingId(null)
            router.refresh()
        } else {
            alert(result.error || 'Failed to update comment')
        }
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditContent('')
    }

    const handleDelete = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return

        const result = await deleteComment(commentId)

        if (result.success) {
            setComments(prev => prev.filter(c => c.id !== commentId))
            router.refresh()
        } else {
            alert(result.error || 'Failed to delete comment')
        }
    }

    const renderCommentContent = (comment: Comment) => {
        if (comment.type === 'system') {
            return (
                <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                    <Badge variant="outline" className="text-[10px] h-4 px-1">System</Badge>
                    <span>{comment.content}</span>
                </div>
            )
        }

        if (editingId === comment.id) {
            return (
                <div className="space-y-2 w-full">
                    <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="text-sm"
                    />
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(comment.id)} className="gap-1">
                            <Check className="h-3 w-3" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="gap-1">
                            <X className="h-3 w-3" /> Cancel
                        </Button>
                    </div>
                </div>
            )
        }

        return (
            <div className="space-y-1">
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                {comment.fileUrl && (
                    <a href={comment.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded border bg-muted/50 w-fit hover:bg-muted transition-colors mt-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-xs underline text-blue-600">{comment.fileName || 'Attached File'}</span>
                    </a>
                )}
            </div>
        )
    }


    const [isConnected, setIsConnected] = useState(false)

    // ...

    // Socket Connection
    useEffect(() => {
        if (!projectId) {
            console.log('Socket: No projectId provided')
            return
        }

        console.log('Socket: Initializing connection for project', projectId)
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000')

        socketInstance.on('connect', () => {
            console.log('Socket: Connected', socketInstance.id)
            setIsConnected(true)
            socketInstance.emit('join-project', projectId)
        })

        socketInstance.on('connect_error', (err) => {
            console.error('Socket: Connection error', err)
            setIsConnected(false)
        })

        socketInstance.on('disconnect', () => {
            console.log('Socket: Disconnected')
            setIsConnected(false)
        })

        // ... existing listeners ...

        return () => {
            console.log('Socket: Disconnecting')
            socketInstance.disconnect()
        }
    }, [projectId, taskId])


    return (
        <Card className="flex flex-col h-full max-h-[600px]">
            <CardHeader className="py-3">
                <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Activity & Comments ({comments.length})
                    </div>
                    <Badge variant={isConnected ? "default" : "destructive"} className="text-[10px] h-5 px-1.5">
                        {isConnected ? "Live" : "Offline"}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden p-0">
                {/* Comment List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {comments.length > 0 ? (
                        comments.map((comment) => (
                            <div key={comment.id} className={`flex gap-3 ${comment.type === 'system' ? 'opacity-80' : ''}`}>
                                <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                                    <AvatarImage src={comment.user.avatarUrl || ''} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                        {comment.type === 'system' ? 'SYS' : (comment.user.fullName?.charAt(0) || comment.user.email.charAt(0))}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 bg-muted/30 p-3 rounded-lg border">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">
                                                {comment.type === 'system' ? 'System' : (comment.user.fullName || comment.user.email)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {mounted ? new Date(comment.createdAt).toLocaleString() : ''}
                                            </span>
                                        </div>
                                        {comment.user.id === currentUserId && comment.type !== 'system' && !editingId && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(comment)}>
                                                    <Edit2 className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(comment.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {renderCommentContent(comment)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No comments yet</p>
                            <p className="text-xs">Be the first to comment on this task</p>
                        </div>
                    )}
                    <div ref={commentsEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-background">
                    {/* Attachment Preview */}
                    {attachment && (
                        <div className="flex items-center gap-2 px-2 py-1 mb-2 text-xs bg-muted rounded border w-fit">
                            <Paperclip className="h-3 w-3" />
                            <span className="max-w-[200px] truncate">{attachment.fileName}</span>
                            <button onClick={handleRemoveAttachment} className="text-muted-foreground hover:text-destructive">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                    {isUploading && (
                        <div className="flex items-center gap-2 px-2 py-1 mb-2 text-xs text-muted-foreground">
                            <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                            Uploading...
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                        <Textarea
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[80px] text-sm resize-none focus-visible:ring-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSubmit(e)
                                }
                            }}
                        />
                        <div className="flex justify-between items-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <Paperclip className="h-4 w-4 mr-2" />
                                Attach File
                            </Button>
                            <Button type="submit" disabled={isSubmitting || (!newComment.trim() && !attachment) || isUploading} size="sm" className="gap-2">
                                <Send className="h-4 w-4" />
                                {isSubmitting ? 'Sending...' : 'Send'}
                            </Button>
                        </div>
                    </form>
                </div>
            </CardContent>
        </Card>
    )
}
