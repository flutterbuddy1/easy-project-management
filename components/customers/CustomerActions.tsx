"use client"

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CustomerDialog } from './CustomerDialog'
import { DeleteCustomerAlert } from './DeleteCustomerAlert'

interface CustomerActionsProps {
    customer: {
        id: string
        name: string
        email: string | null
        phone: string | null
    }
}

export function CustomerActions({ customer }: CustomerActionsProps) {
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => setShowDeleteAlert(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CustomerDialog
                customer={customer}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />

            <DeleteCustomerAlert
                customerId={customer.id}
                customerName={customer.name}
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
            />
        </>
    )
}
