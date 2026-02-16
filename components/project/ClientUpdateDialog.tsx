"use client"

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { sendProjectUpdate } from '@/app/actions/projects'

interface ClientUpdateDialogProps {
    projectId: string
    projectName: string
    clientEmail?: string | null
    trigger?: React.ReactNode
}

export function ClientUpdateDialog({
    projectId,
    projectName,
    clientEmail,
    trigger
}: ClientUpdateDialogProps) {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const handleSend = async () => {
        if (!message.trim()) return

        setIsLoading(true)
        const result = await sendProjectUpdate(projectId, message)
        setIsLoading(false)

        if (result.success) {
            setOpen(false)
            setMessage('')
            toast({
                title: "Update Sent",
                description: "The client has been notified successfully.",
            })
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to send update.",
                variant: "destructive"
            })
        }
    }

    if (!clientEmail) {
        return (
            <Button variant="ghost" disabled title="No client email linked">
                <Send className="h-4 w-4 mr-2" />
                Send Update
            </Button>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline">
                        <Send className="h-4 w-4 mr-2" />
                        Send Update
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Send Update to Client</DialogTitle>
                    <DialogDescription>
                        Send a progress update or message to the client for <strong>{projectName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="e.g. We have completed the design phase and are moving to development..."
                            className="min-h-[150px]"
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        An email will be sent to: <strong>{clientEmail}</strong>
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={isLoading || !message.trim()}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Email
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
