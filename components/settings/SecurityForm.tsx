'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword } from '@/app/actions/settings'
import { useToast } from '@/hooks/use-toast'

export function SecurityForm() {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const currentPassword = formData.get('currentPassword') as string
        const newPassword = formData.get('newPassword') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (newPassword !== confirmPassword) {
            toast({
                title: 'Error',
                description: 'New password and confirm password do not match',
                variant: 'destructive'
            })
            setIsLoading(false)
            return
        }

        const result = await changePassword({ current: currentPassword, new: newPassword })

        if (result.success) {
            toast({
                title: 'Password changed',
                description: 'Your password has been changed successfully.'
            })
            // clear form
            const form = e.target as HTMLFormElement
            form.reset()
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to change password',
                variant: 'destructive'
            })
        }

        setIsLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    disabled={isLoading}
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    disabled={isLoading}
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    disabled={isLoading}
                    required
                />
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Changing Proxy...' : 'Change Password'}
            </Button>
        </form>
    )
}
