'use client'

import { useEffect, useRef } from 'react'
import { useSocket } from '@/components/providers/SocketProvider'
// import { useToast } from '@/components/ui/use-toast' // If using shadcn toast

export function NotificationManager() {
    const { socket } = useSocket()
    // const { toast } = useToast()

    // Audio refs
    const messageAudioRef = useRef<HTMLAudioElement | null>(null)
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Initialize audio
        messageAudioRef.current = new Audio('/assets/beats/message.mp3')
        notificationAudioRef.current = new Audio('/assets/beats/notification.mp3')

        // Preload
        messageAudioRef.current.load()
        notificationAudioRef.current.load()
    }, [])

    useEffect(() => {
        if (!socket) return

        const handleNewMessage = (data: any) => {
            // Play sound if not from current user (managed by caller or check ID here if available)
            // For now, simpler to just play it, or check if we are the sender in the socket event data?
            // Ideally data should have senderId.

            // Assuming optimistic UI handles "sent" sound or silence for self.
            // We play sound for incoming.
            playMessageSound()
        }

        const handleNotification = (data: any) => {
            playNotificationSound()
            // toast({ title: data.title, description: data.message })
        }

        socket.on('new-message', handleNewMessage) // This event already exists
        socket.on('notification', handleNotification) // New event we need to emit from server

        return () => {
            socket.off('new-message', handleNewMessage)
            socket.off('notification', handleNotification)
        }
    }, [socket])

    const playMessageSound = () => {
        if (messageAudioRef.current) {
            messageAudioRef.current.currentTime = 0
            messageAudioRef.current.play().catch(e => console.error('Error playing message sound:', e))
        }
    }

    const playNotificationSound = () => {
        if (notificationAudioRef.current) {
            notificationAudioRef.current.currentTime = 0
            notificationAudioRef.current.play().catch(e => console.error('Error playing notification sound:', e))
        }
    }

    return null // logical component only
}
