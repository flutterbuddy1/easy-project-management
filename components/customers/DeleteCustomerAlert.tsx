'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteCustomer } from '@/app/actions/customers'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface DeleteCustomerAlertProps {
    customerId: string
    customerName: string
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function DeleteCustomerAlert({
    customerId,
    customerName,
    trigger,
    open: controlledOpen,
    onOpenChange: setControlledOpen
}: DeleteCustomerAlertProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? (setControlledOpen as (open: boolean) => void) : setInternalOpen

    const handleDelete = async () => {
        setIsLoading(true)
        try {
            const result = await deleteCustomer(customerId)
            if (result.success) {
                toast({ title: 'Customer deleted' })
                router.refresh()
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' })
        } finally {
            setIsLoading(false)
            setOpen(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the customer <strong>{customerName}</strong>.
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
