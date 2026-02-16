'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Role, Permission } from '@prisma/client'
import { getRoles, createRole, updateRole, deleteRole } from '@/app/actions/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Plus, Shield, Trash2, Edit2 } from 'lucide-react'

type RoleWithPermissions = Role & { permissions: Permission[] }

export function RolesManager() {
    const [roles, setRoles] = useState<RoleWithPermissions[]>([])
    const [allPermissions, setAllPermissions] = useState<Permission[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        description: '',
        permissionIds: [] as string[]
    })
    const [saving, setSaving] = useState(false)

    const router = useRouter()

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const result = await getRoles()
        if (result.success && result.roles && result.permissions) {
            setRoles(result.roles)
            setAllPermissions(result.permissions)
        } else {
            toast.error(result.error || 'Failed to load roles')
        }
        setLoading(false)
    }

    function handleOpenDialog(role?: RoleWithPermissions) {
        if (role) {
            setEditingRole(role)
            setFormData({
                name: role.name,
                displayName: role.displayName,
                description: role.description || '',
                permissionIds: role.permissions.map(p => p.id)
            })
        } else {
            setEditingRole(null)
            setFormData({
                name: '',
                displayName: '',
                description: '',
                permissionIds: []
            })
        }
        setIsDialogOpen(true)
    }

    async function handleSubmit() {
        if (!formData.displayName) {
            toast.error('Display name is required')
            return
        }

        // For new roles, name is required
        if (!editingRole && !formData.name) {
            toast.error('Role name is required')
            return
        }

        setSaving(true)
        let result
        if (editingRole) {
            result = await updateRole(editingRole.id, {
                displayName: formData.displayName,
                description: formData.description,
                permissionIds: formData.permissionIds
            })
        } else {
            result = await createRole({
                name: formData.name,
                displayName: formData.displayName,
                description: formData.description,
                permissionIds: formData.permissionIds
            })
        }

        if (result.success) {
            toast.success(editingRole ? 'Role updated' : 'Role created')
            setIsDialogOpen(false)
            loadData()
        } else {
            toast.error(result.error || 'Operation failed')
        }
        setSaving(false)
    }

    async function handleDelete(roleId: string) {
        if (!confirm('Are you sure you want to delete this role? This cannot be undone.')) return

        const result = await deleteRole(roleId)
        if (result.success) {
            toast.success('Role deleted')
            loadData()
        } else {
            toast.error(result.error || 'Failed to delete role')
        }
    }

    function togglePermission(permissionId: string) {
        setFormData(prev => ({
            ...prev,
            permissionIds: prev.permissionIds.includes(permissionId)
                ? prev.permissionIds.filter(id => id !== permissionId)
                : [...prev.permissionIds, permissionId]
        }))
    }

    // Group permissions by group
    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.group]) acc[perm.group] = []
        acc[perm.group].push(perm)
        return acc
    }, {} as Record<string, Permission[]>)

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
                    <p className="text-muted-foreground">Manage user roles and their access levels.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Create Role
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {roles.map(role => (
                    <Card key={role.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{role.displayName}</CardTitle>
                                    <CardDescription className="mt-1">{role.name}</CardDescription>
                                </div>
                                {role.isSystem && <Badge variant="secondary">System</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground mb-4">
                                {role.description || 'No description provided.'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {role.permissions.map(p => (
                                    <Badge key={p.id} variant="outline" className="text-xs">
                                        {p.action}
                                    </Badge>
                                ))}
                                {role.permissions.length === 0 && (
                                    <span className="text-xs text-muted-foreground italic">No permissions assigned</span>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(role)}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                            </Button>
                            {!role.isSystem && (
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(role.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                        <DialogDescription>
                            Configure the role details and assign permissions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    value={formData.displayName}
                                    onChange={e => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                    placeholder="e.g. Project Manager"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Role Identifier (System Name)</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. project_manager"
                                    disabled={!!editingRole}
                                />
                                {editingRole && <p className="text-xs text-muted-foreground">Cannot be changed after creation</p>}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe what this role does..."
                            />
                        </div>

                        <div className="space-y-4 mt-4">
                            <h3 className="text-lg font-medium">Permissions</h3>
                            <div className="grid gap-6">
                                {Object.entries(groupedPermissions).map(([group, permissions]) => (
                                    <div key={group} className="border rounded-lg p-4">
                                        <h4 className="font-medium capitalize mb-3">{group}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {permissions.map(perm => (
                                                <div key={perm.id} className="flex items-start space-x-2">
                                                    <Checkbox
                                                        id={perm.id}
                                                        checked={formData.permissionIds.includes(perm.id)}
                                                        onCheckedChange={() => togglePermission(perm.id)}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <Label
                                                            htmlFor={perm.id}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {perm.action}
                                                        </Label>
                                                        {perm.description && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {perm.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingRole ? 'Update Role' : 'Create Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
