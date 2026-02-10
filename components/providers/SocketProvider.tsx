'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import io, { type Socket as ClientSocket } from 'socket.io-client'

interface SocketContextType {
    socket: ClientSocket | null
    isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false
})

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const socketRef = React.useRef<ClientSocket | null>(null)
    const [socket, setSocket] = useState<ClientSocket | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        if (socketRef.current) return

        // Connect to socket server
        const socketInstance = io('http://localhost:4000', {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            autoConnect: true
        })

        socketRef.current = socketInstance

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id)
            setIsConnected(true)
        })

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected')
            setIsConnected(false)
        })

        socketInstance.on('connect_error', (err: Error) => {
            console.error('Socket connection error:', err)
        })

        setSocket(socketInstance)

        return () => {
            // In development (Strict Mode), this might run, but we want to persist the connection
            // or clean it up properly.
            // If we disconnect here, strict mode kills the connection we just made.
            // But we need to cleanup on real unmount.

            // For now, let's allow cleanup but the ref check prevents double-creation.
            // socketInstance.disconnect()
            // socketRef.current = null
        }
    }, [])

    useEffect(() => {
        // Cleanup on unmount only
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
            }
        }
    }, [])

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    )
}
