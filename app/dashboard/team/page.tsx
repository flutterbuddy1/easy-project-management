import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog'

export default async function TeamPage() {
    const session = await auth()

    if (!session?.user?.email) {
        redirect('/auth/login')
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { organizationId: true }
    })

    if (!user?.organizationId) {
        redirect('/dashboard')
    }

    // Fetch team members
    const teamMembers = await prisma.user.findMany({
        where: {
            organizationId: user.organizationId
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    // Fetch pending invitations
    const pendingInvitations = await prisma.invitation.findMany({
        where: {
            organizationId: user.organizationId,
            status: 'pending'
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Team</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your organization members
                    </p>
                </div>
                <InviteMemberDialog
                    trigger={
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Invite Member
                        </Button>
                    }
                />
            </div>

            {/* Team Members */}
            {teamMembers && teamMembers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teamMembers.map((member) => (
                        <Card key={member.id}>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={member.avatarUrl || ''} alt={member.fullName || 'User'} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                            {member.fullName?.charAt(0) || member.email?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base truncate">
                                            {member.fullName || 'Unnamed User'}
                                        </CardTitle>
                                        <CardDescription className="truncate">
                                            {member.email}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                                        {member.role}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Users className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Invite your first team member to get started
                        </p>
                        <InviteMemberDialog
                            trigger={
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Invite Member
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>
            )}

            {/* Pending Invitations */}
            {pendingInvitations && pendingInvitations.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Pending Invitations</h2>
                    <div className="space-y-2">
                        {pendingInvitations.map((invitation) => (
                            <Card key={invitation.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{invitation.email}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Invited {new Date(invitation.createdAt).toLocaleDateString()} • {invitation.role}
                                            </p>
                                        </div>
                                        <Badge variant="outline">Pending</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
