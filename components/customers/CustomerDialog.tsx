'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { createCustomer, updateCustomer } from '@/app/actions/customers'
import { useRouter } from 'next/navigation'

const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
})

interface CustomerDialogProps {
    trigger?: React.ReactNode
    customer?: {
        id: string
        name: string
        email: string | null
        phone: string | null
    }
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CustomerDialog({ trigger, customer, open: controlledOpen, onOpenChange: setControlledOpen }: CustomerDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen

    const setOpen = (newOpen: boolean) => {
        if (isControlled) {
            setControlledOpen?.(newOpen)
        } else {
            setInternalOpen(newOpen)
        }
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: customer?.name || '',
            email: customer?.email || '',
            phone: customer?.phone || '',
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            let result
            if (customer) {
                result = await updateCustomer(customer.id, values)
            } else {
                result = await createCustomer(values)
            }

            if (result.success) {
                toast({
                    title: customer ? 'Customer updated' : 'Customer created',
                    description: `${values.name} has been ${customer ? 'updated' : 'added'} successfully.`,
                })
                setOpen(false)
                router.refresh()
                if (!customer) form.reset()
            } else {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Something went wrong. Please try again.',
                variant: 'destructive',
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{customer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
                    <DialogDescription>
                        {customer ? 'Update customer details.' : 'Add a new customer to your organization.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Corp" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="contact@acme.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+1 234 567 890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {customer ? 'Save Changes' : 'Add Customer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
