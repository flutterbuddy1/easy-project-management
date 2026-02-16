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
        const projectId = typeof data === 'string' ? data : data.projectId
        socket.join(projectId)
        console.log(`Socket ${socket.id} joined project: ${projectId}`)
        console.log(`Socket ${socket.id} rooms:`, socket.rooms)
    })

    socket.on('leave-project', (projectId: string) => {
        socket.leave(projectId)
        console.log(`Socket ${socket.id} left project: ${projectId}`)
    })

    // Task Comment Events
    socket.on('task-comment', (data: any) => {
        console.log(`Server received task-comment for project ${data.projectId} from ${socket.id}`)
        console.log(`Broadcasting to room: ${data.projectId}`)

        // Broadcast to everyone else in the project room
        const result = socket.to(data.projectId).emit('new-comment', data)
        console.log(`Broadcasted new-comment to room ${data.projectId}`)
    })

    // Task Update Events (Status, Priority, Assignee)
    socket.on('task-updated', (data: any) => {
        console.log(`Server received task-updated for project ${data.projectId} from ${socket.id}`)
        socket.to(data.projectId).emit('task-updated', data)
        console.log(`Broadcasted task-updated to room ${data.projectId}`)
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
