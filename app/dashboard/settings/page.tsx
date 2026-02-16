import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { OrganizationForm } from '@/components/settings/OrganizationForm'
import { SecurityForm } from '@/components/settings/SecurityForm'

export default async function SettingsPage() {
    const session = await auth()

    if (!session?.user?.email) {
        redirect('/auth/login')
    }

    // Get user data
    const userData = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            organization: true
        }
    })

    if (!userData) {
        redirect('/auth/login')
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your account and organization settings
                </p>
            </div>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                        Update your personal information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm user={{
                        fullName: userData.fullName,
                        email: userData.email,
                        role: userData.role,
                        avatarUrl: userData.avatarUrl,
                        emailNotifications: userData.emailNotifications
                    }} />
                </CardContent>
            </Card>

            {/* Organization Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Organization</CardTitle>
                    <CardDescription>
                        Manage your organization settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OrganizationForm
                        organization={userData.organization}
                        userRole={userData.role}
                    />
                </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>
                        Manage your password and security settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SecurityForm />
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible actions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all associated data
                            </p>
                        </div>
                        <Button variant="destructive">Delete Account</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
