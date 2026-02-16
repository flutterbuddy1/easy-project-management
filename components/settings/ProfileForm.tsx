'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateProfile } from '@/app/actions/settings'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'

interface ProfileFormProps {
    user: {
        fullName: string | null
        email: string
        role: string
        avatarUrl: string | null
        emailNotifications: boolean
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const fullName = formData.get('fullName') as string

        const result = await updateProfile({
            fullName,
            emailNotifications
        })

        if (result.success) {
            toast({
                title: 'Profile updated',
                description: 'Your profile has been updated successfully.'
            })
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to update profile',
                variant: 'destructive'
            })
        }

        setIsLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatarUrl || ''} alt={user.fullName || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                        {user.fullName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <Button variant="outline" size="sm" type="button" disabled>Change Avatar</Button>
                    <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG or GIF. Max size 2MB.
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                        id="fullName"
                        name="fullName"
                        defaultValue={user.fullName || ''}
                        placeholder="Enter your full name"
                        disabled={isLoading}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        defaultValue={user.email || ''}
                        disabled
                    />
                    <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                    </p>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                        id="role"
                        defaultValue={user.role || ''}
                        disabled
                    />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            Receive emails about task assignments and comments
                        </p>
                    </div>
                    <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                        disabled={isLoading}
                    />
                </div>
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
        </form>
    )
}
