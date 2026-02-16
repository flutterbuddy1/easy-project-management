import { auth } from '@/lib/auth'
import { getCustomers } from '@/app/actions/customers'
import { redirect } from 'next/navigation'
import { Plus, Search, MoreVertical, Pencil, Trash2, Mail, Phone, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CustomerDialog } from '@/components/customers/CustomerDialog'
import { CustomerActions } from '@/components/customers/CustomerActions'
import { ClientContactDetails } from '@/components/project/ClientContactDetails'

export default async function CustomersPage() {
    const session = await auth()
    if (!session?.user) redirect('/auth/login')

    const { customers, error } = await getCustomers()

    if (error) {
        return <div className="p-8 text-center text-red-500">Error loading customers: {error}</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Customers</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your client database
                    </p>
                </div>
                <CustomerDialog
                    trigger={
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Customer
                        </Button>
                    }
                />
            </div>

            <div className="flex items-center gap-2 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search customers..."
                        className="pl-9"
                    />
                </div>
            </div>

            {customers && customers.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {customers.map((customer: any) => (
                        <Card key={customer.id} className="relative group hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{customer.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                Added {new Date(customer.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <CustomerActions customer={customer} />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <ClientContactDetails
                                    email={customer.email}
                                    phone={customer.phone}
                                    userRole={(session.user as any).role}
                                />
                                <div className="pt-2 mt-2 border-t flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Active Projects</span>
                                    <span className="font-medium bg-secondary px-2 py-0.5 rounded-full text-xs">
                                        {/* @ts-ignore: _count property is included in the query */}
                                        {customer._count?.projects || 0}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No customers yet</h3>
                    <p className="text-muted-foreground mb-4">Add your first customer to get started.</p>
                    <CustomerDialog
                        trigger={
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Customer
                            </Button>
                        }
                    />
                </div>
            )}
        </div>
    )
}
