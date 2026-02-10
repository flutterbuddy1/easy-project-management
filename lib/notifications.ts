import 'server-only'
import { prisma } from '@/lib/prisma'
// We need to access the socket server to emit events, but we are in a server action/Next.js API context.
// Next.js doesn't natively support emitting to a separate socket server process easily without an HTTP call or Redis adapter.
// For now, the client-side socket connection handles the "real-time" part via event listeners on the client.
// However, to trigger a "notification" event to a specific user, we might need a way to tell the socket server to emit it.
// OPTION: We can just insert into DB, and the Client polls? No, that's not real-time.
// OPTION: We use the existing socket connection in the client to listen for specific events.
// BUT: How does the server action tell the user "Hey, you got a notification"?
// SOLUTION: The simpler approach for this architecture is:
// 1. Server Action updates DB.
// 2. Server Action sends Email.
// 3. Server Action returns success.
// 4. Client (who initiated the action) might emit a socket event "I did X"? No, that's insecure/trusting client.
//
// BETTER SOLUTION: The separate Socket Server (port 4000) should handle the "notify" logic if possible, OR we allow the Next.js server to "talk" to the Socket Server via a private API/webhook.
// Given constraints, we will stick to:
// - DB & Email in this helper.
// - Real-time alerts for "chat" and "kanban" are already handled via client socket emits.
// - For "Async" things like "Assigned a task", the `createTask` action is called.
// - We can't easily emit to the socket server from here without an internal API on the socket server.
// - Lets add a simple HTTP endpoint on the Socket Server to accept "emit this event" requests from the Next.js backend.

import { sendEmail } from '@/lib/email'

// Define notification types
export type NotificationType = 'task_assigned' | 'task_updated' | 'comment_added' | 'project_invite'

export async function createNotification({
    userId,
    title,
    message,
    type,
    link,
    emailData
}: {
    userId: string
    title: string
    message: string
    type: NotificationType
    link?: string
    emailData?: {
        subject: string
        html: string
        text: string
    }
}) {
    // 1. Create DB Notification
    const notification = await prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type,
            link,
            read: false
        }
    })

    // 2. Send Email (if emailData provided)
    if (emailData) {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (user?.email) {
            await sendEmail({
                to: user.email,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text
            })
        }
    }

    // 3. Trigger Real-time Notification via Socket Server Webhook
    // We'll implement a fetch call to the socket server (localhost:4000/notify)
    try {
        await fetch('http://localhost:4000/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                notification
            })
        })
    } catch (error) {
        console.error('Failed to trigger socket notification:', error)
    }

    return notification
}
