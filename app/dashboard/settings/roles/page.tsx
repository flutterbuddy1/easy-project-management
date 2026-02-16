import { RolesManager } from '@/components/settings/RolesManager'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Roles & Permissions',
    description: 'Manage user roles and permissions',
}

export default function RolesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <RolesManager />
        </div>
    )
}
