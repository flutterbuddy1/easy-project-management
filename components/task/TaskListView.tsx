
'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, ArrowUpDown } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

interface TaskListViewProps {
    tasks: any[]
}

export function TaskListView({ tasks }: TaskListViewProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSort = (column: string) => {
        const params = new URLSearchParams(searchParams)
        const currentSort = params.get('sort')
        const currentOrder = params.get('order')

        if (currentSort === column) {
            params.set('order', currentOrder === 'asc' ? 'desc' : 'asc')
        } else {
            params.set('sort', column)
            params.set('order', 'asc')
        }

        router.push(`?${params.toString()}`)
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('title')}
                                className="flex items-center gap-1 -ml-4"
                            >
                                Title
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('status')}
                                className="flex items-center gap-1 -ml-4"
                            >
                                Status
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('priority')}
                                className="flex items-center gap-1 -ml-4"
                            >
                                Priority
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('createdAt')}
                                className="flex items-center gap-1 -ml-4"
                            >
                                Created
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((task) => (
                        <TableRow key={task.id}>
                            <TableCell className="font-medium">
                                <Link href={`/dashboard/tasks/${task.id}`} className="hover:underline">
                                    {task.title}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {task.status.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        task.priority === 'critical' || task.priority === 'high'
                                            ? 'destructive'
                                            : 'secondary'
                                    }
                                >
                                    {task.priority}
                                </Badge>
                            </TableCell>
                            <TableCell>{task.project?.name}</TableCell>
                            <TableCell>
                                {format(new Date(task.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/tasks/${task.id}`}>
                                                View Details
                                            </Link>
                                        </DropdownMenuItem>
                                        {/* Future: Add Edit/Delete here if needed directly in list */}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {tasks.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No tasks found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
