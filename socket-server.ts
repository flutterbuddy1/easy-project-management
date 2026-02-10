import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const app = express()
app.use(express.json()) // Enable JSON body parsing
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }))

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allow all origins for simplicity in development
        methods: ['GET', 'POST']
    }
})

// Types
interface SocketData {
    userId: string
    projectId: string
}

io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-project', (data: string | { projectId: string; userId?: string }) => {
        // Handle both string and object payloads for backward compatibility
        const projectId = typeof data === 'string' ? data : data.projectId
        const userId = typeof data === 'object' ? data.userId : undefined

        socket.join(projectId)
        console.log(`Socket ${socket.id} joined project: ${projectId}`)

        if (userId) {
            socket.join(`user:${userId}`)
            console.log(`Socket ${socket.id} joined user room: user:${userId}`)
        }
    })

    socket.on('leave-project', (projectId: string) => {
        socket.leave(projectId)
        console.log(`Socket ${socket.id} left project: ${projectId}`)
    })

    socket.on('join-user', (userId: string) => {
        socket.join(`user:${userId}`)
        console.log(`Socket ${socket.id} joined user room: user:${userId}`)
    })

    // Kanban Events
    socket.on('task-moved', (data: any) => {
        // Broadcast to everyone else in the project room
        socket.to(data.projectId).emit('task-updated', data)
        console.log(`Task moved in project ${data.projectId} by ${socket.id}`)
    })

    // Chat Events
    socket.on('send-message', (data: any) => {
        // Broadcast to everyone else (exclude sender)
        socket.to(data.projectId).emit('new-message', data)
        if (data.content) {
            console.log(`Message sent in project ${data.projectId} by ${socket.id}`)
        }
    })

    // Typing Indicators (Optional)
    socket.on('typing', (data: { projectId: string, user: string }) => {
        socket.to(data.projectId).emit('user-typing', data)
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
    })
})

// Webhook for server-side notifications
app.post('/notify', (req: express.Request, res: express.Response) => {
    const { userId, notification } = req.body

    if (!userId || !notification) {
        return res.status(400).json({ error: 'Missing userId or notification data' })
    }

    console.log(`Sending notification to user ${userId}`)
    io.to(`user:${userId}`).emit('notification', notification)

    res.json({ success: true })
})

const PORT = 4000
httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`)
    console.log(`Express server running on port ${PORT}`)
})
