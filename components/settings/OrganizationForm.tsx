'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateOrganization } from '@/app/actions/settings'
import { useToast } from '@/hooks/use-toast'

interface OrganizationFormProps {
    organization: {
        id: string
        name: string
    } | null
    userRole: string
}

export function OrganizationForm({ organization, userRole }: OrganizationFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const canEdit = userRole === 'owner' || userRole === 'admin'

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!canEdit) return

        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const name = formData.get('orgName') as string

        const result = await updateOrganization({ name })

        if (result.success) {
            toast({
                title: 'Organization updated',
                description: 'Organization details have been updated successfully.'
            })
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to update organization',
                variant: 'destructive'
            })
        }

        setIsLoading(false)
    }

    if (!organization) return null

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                    id="orgName"
                    name="orgName"
                    defaultValue={organization.name || ''}
                    placeholder="Enter organization name"
                    disabled={!canEdit || isLoading}
                />
                {!canEdit && (
                    <p className="text-xs text-muted-foreground">
                        Only owners and admins can edit organization details.
                    </p>
                )}
            </div>

            {canEdit && (
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Organization'}
                </Button>
            )}
        </form>
    )
}
