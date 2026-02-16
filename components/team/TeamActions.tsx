'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MoreVertical, Shield, Trash2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { cancelInvitation } from '@/app/actions/invitations'
import { removeMember, updateMemberRole } from '@/app/actions/members'

interface MemberActionsProps {
    memberId: string
    currentRole: string
    currentUserId: string
    currentUserRole: string
}

export function MemberActions({ memberId, currentRole, currentUserId, currentUserRole }: MemberActionsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const isSelf = memberId === currentUserId
    const canManage = currentUserRole === 'admin' || (currentUserRole === 'manager' && currentRole !== 'admin')
    const canChangeRole = currentUserRole === 'admin'

    if (isSelf) {
        return (
            <Button variant="outline" size="icon" disabled className="h-8 w-8 bg-muted opacity-50" title="You cannot manage yourself">
                <MoreVertical className="h-4 w-4" />
            </Button>
        )
    }

    if (!canManage) {
        // Debugging: show why it's hidden
        return null // <span className="text-[10px] text-red-500 hidden">No perm</span>
    }

    const handleRemoveMember = async () => {
        setIsLoading(true)
        try {
            const result = await removeMember(memberId)
            if (result.success) {
                toast({ title: 'Member removed' })
                router.refresh()
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' })
        } finally {
            setIsLoading(false)
            setShowDeleteDialog(false)
        }
    }

    const handleRoleChange = async (newRole: string) => {
        if (newRole === currentRole) return
        setIsLoading(true)
        try {
            const result = await updateMemberRole(memberId, newRole)
            if (result.success) {
                toast({ title: 'Role updated' })
                router.refresh()
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading}>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {canChangeRole && (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Change Role</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={currentRole} onValueChange={handleRoleChange}>
                                    <DropdownMenuRadioItem value="viewer">Viewer</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="manager">Manager</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                    )}

                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Remove Member</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the user from your organization. They will lose access to all projects and tasks.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveMember} className="bg-red-600 hover:bg-red-700">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

interface InvitationActionsProps {
    invitationId: string
}

export function InvitationActions({ invitationId }: InvitationActionsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const handleCancel = async () => {
        setIsLoading(true)
        try {
            const result = await cancelInvitation(invitationId)
            if (result.success) {
                toast({ title: 'Invitation cancelled' })
                router.refresh()
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to cancel invitation', variant: 'destructive' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
            className="text-muted-foreground hover:text-destructive"
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            <span className="sr-only">Cancel</span>
        </Button>
    )
}
