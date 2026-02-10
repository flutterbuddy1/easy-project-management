'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useSocket } from '@/components/providers/SocketProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react'
import { getProjectMessages, sendMessage } from '@/app/actions/chat'
import { format } from 'date-fns'

interface Message {
    id: string
    content: string
    userId: string
    projectId: string
    createdAt: string
    user: {
        id: string
        fullName: string | null
        avatarUrl: string | null
        email: string
    }
}

interface ProjectChatProps {
    projectId: string
    currentUser: {
        id: string
        fullName: string | null
        avatarUrl: string | null
    }
}

export function ProjectChat({ projectId, currentUser }: ProjectChatProps) {
    const { socket, isConnected } = useSocket()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Load initial messages
    useEffect(() => {
        if (isOpen && projectId) {
            getProjectMessages(projectId).then(result => {
                if (result.success && result.messages) {
                    // Convert dates to strings for consistent type usage
                    const formattedMessages = result.messages.map((msg: any) => ({
                        ...msg,
                        createdAt: msg.createdAt.toISOString()
                    }))
                    setMessages(formattedMessages)
                } else {
                    console.error('Failed to load messages:', result.error)
                }
            })
                .catch(err => console.error('Error loading messages:', err))
                .finally(() => setIsLoading(false))
        }
    }, [isOpen, projectId])

    // Socket listeners
    useEffect(() => {
        if (!socket || !isConnected) return

        socket.emit('join-project', projectId)

        const handleNewMessage = (message: Message) => {
            console.log('Received new message:', message)
            setMessages(prev => {
                // Avoid duplicates by checking ID or client-generated distinct key? 
                // Since we fetch history, we might have IDs. 
                // The socket message has a real DB ID. 
                // The optimistic message has a 'tempId'.
                // If this is the sender receiving (which shouldn't happen now with socket.to), we'd need to dedupe.
                // But for others, it's just a new message.
                if (prev.some(m => m.id === message.id)) return prev
                return [...prev, message]
            })
            // Scroll to bottom
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }

        socket.on('new-message', handleNewMessage)

        return () => {
            socket.off('new-message', handleNewMessage)
            socket.emit('leave-project', projectId)
        }
    }, [socket, isConnected, projectId])

    // Scroll to bottom on open or new messages
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
    }, [isOpen, messages])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim()) return

        const tempId = Math.random().toString(36).substring(7)
        const content = newMessage
        setNewMessage('')

        // Optimistic update
        const optimisticMessage: Message = {
            id: tempId,
            content,
            userId: currentUser.id,
            projectId,
            createdAt: new Date().toISOString(),
            user: {
                id: currentUser.id,
                fullName: currentUser.fullName,
                avatarUrl: currentUser.avatarUrl,
                email: ''
            }
        }

        setMessages(prev => [...prev, optimisticMessage])

        // Send to server
        const result = await sendMessage(projectId, content)

        if (result.success && result.message && socket) {
            // Replace optimistic message with real one (in state) via ID matching or just let the socket event handle it?
            // Socket event will come back.
            // Better to emit socket event here if we want instant update for others, 
            // but the server action saves to DB first. 

            // Actually, we should emit to socket server so it broadcasts.
            // My socket-server.ts listens for 'send-message' and broadcasts 'new-message'.
            const realMessage = {
                ...result.message,
                createdAt: result.message.createdAt.toISOString(),
                user: optimisticMessage.user // Attach user info since create return might usually lack it unless included
            }

            socket.emit('send-message', realMessage)
        } else {
            // Revert on failure (simplified)
            console.error('Failed to send message')
        }
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 flex items-center justify-center p-0"
            >
                <MessageSquare className="h-6 w-6" />
                {/* Could add unread badge here */}
            </Button>
        )
    }

    return (
        <Card className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] shadow-xl z-50 flex flex-col border-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <CardHeader className="p-3 border-b bg-primary/5 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold">Team Chat</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center text-xs text-muted-foreground py-4">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-xs text-muted-foreground py-10">
                            No messages yet. Start the conversation!
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.userId === currentUser.id
                            const showAvatar = !isMe && (i === 0 || messages[i - 1].userId !== msg.userId)

                            return (
                                <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {!isMe && (
                                        <div className="w-6 shrink-0 flex flex-col justify-end">
                                            {showAvatar ? (
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={msg.user.avatarUrl || ''} />
                                                    <AvatarFallback className="text-[9px]">{msg.user.fullName?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                            ) : <div className="w-6" />}
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] space-y-1`}>
                                        {!isMe && showAvatar && (
                                            <p className="text-[10px] text-muted-foreground ml-1">{msg.user.fullName}</p>
                                        )}
                                        <div
                                            className={`p-2 rounded-lg text-xs break-words px-3 ${isMe
                                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                                : 'bg-muted rounded-bl-none'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <p className={`text-[9px] text-muted-foreground ${isMe ? 'text-right' : 'text-left'}`}>
                                            {format(new Date(msg.createdAt), 'h:mm a')}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
            <div className="p-3 border-t bg-background">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        className="h-9 text-sm focus-visible:ring-1"
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </Card>
    )
}
