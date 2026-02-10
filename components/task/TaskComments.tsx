'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Send, Pencil, Trash2, X, Check } from 'lucide-react'
import { createComment, updateComment, deleteComment } from '@/app/actions/comments'

interface Comment {
    id: string
    content: string
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
}

export function TaskComments({ taskId, comments, currentUserId }: TaskCommentsProps) {
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        setIsSubmitting(true)

        const result = await createComment(taskId, newComment)

        if (result.success) {
            setNewComment('')
            router.refresh()
        } else {
            alert(result.error || 'Failed to add comment')
        }

        setIsSubmitting(false)
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
            router.refresh()
        } else {
            alert(result.error || 'Failed to delete comment')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Comments ({comments.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Comment List */}
                {comments.length > 0 ? (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={comment.user.avatarUrl || ''} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                        {comment.user.fullName?.charAt(0) || comment.user.email.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">
                                            {comment.user.fullName || comment.user.email}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {editingId === comment.id ? (
                                        <div className="space-y-2">
                                            <Textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                rows={3}
                                                className="text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSaveEdit(comment.id)}
                                                    className="gap-1"
                                                >
                                                    <Check className="h-3 w-3" />
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleCancelEdit}
                                                    className="gap-1"
                                                >
                                                    <X className="h-3 w-3" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {comment.content}
                                            </p>
                                            {comment.user.id === currentUserId && (
                                                <div className="flex gap-2 mt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEdit(comment)}
                                                        className="h-7 gap-1 text-xs"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(comment.id)}
                                                        className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No comments yet. Be the first to comment!
                    </p>
                )}

                {/* New Comment Form */}
                <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        disabled={isSubmitting}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting || !newComment.trim()} className="gap-2">
                            <Send className="h-4 w-4" />
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
