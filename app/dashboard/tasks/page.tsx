import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckSquare, LayoutGrid, List as ListIcon, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { getTasks } from '@/app/actions/tasks'
import { TaskListView } from '@/components/task/TaskListView'
import { TaskFilters } from '@/components/task/TaskFilters'
import { Separator } from '@/components/ui/separator'
import { TaskCalendarView } from '@/components/task/TaskCalendarView'
import { TaskBoardView } from '@/components/task/TaskBoardView'

export default async function MyTasksPage({
    searchParams
}: {
    searchParams: {
        view?: string;
        sort?: string;
        order?: string;
        status?: string;
        priority?: string;
        search?: string;
    }
}) {
    const session = await auth()

    if (!session?.user?.email) {
        redirect('/auth/login')
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    })

    if (!user) {
        redirect('/auth/login')
    }

    const view = searchParams.view || 'board'
    const sort = searchParams.sort || 'createdAt'
    const order = (searchParams.order as 'asc' | 'desc') || 'desc'

    // Fetch tasks using server action
    const { tasks: allTasks } = await getTasks({
        userId: user.id,
        sortBy: sort,
        sortOrder: order,
        status: searchParams.status,
        priority: searchParams.priority,
        search: searchParams.search
    })

    const tasks = allTasks || []

    const tasksByStatus = {
        todo: tasks.filter(t => t.status === 'todo'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        review: tasks.filter(t => t.status === 'review'),
        blocked: tasks.filter(t => t.status === 'blocked'),
        done: tasks.filter(t => t.status === 'done'),
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">My Tasks</h1>
                    <p className="text-muted-foreground mt-1">
                        All tasks assigned to you across all projects
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={view === 'board' ? 'default' : 'outline'}
                        size="sm"
                        asChild
                    >
                        <Link href="?view=board">
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Board
                        </Link>
                    </Button>
                    <Button
                        variant={view === 'list' ? 'default' : 'outline'}
                        size="sm"
                        asChild
                    >
                        <Link href="?view=list">
                            <ListIcon className="h-4 w-4 mr-2" />
                            List
                        </Link>
                    </Button>
                    <Button
                        variant={view === 'calendar' ? 'default' : 'outline'}
                        size="sm"
                        asChild
                    >
                        <Link href="?view=calendar">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Calendar
                        </Link>
                    </Button>
                </div>
            </div>

            <Separator />

            <TaskFilters />



            {/* View Content */}
            {view === 'list' ? (
                <TaskListView tasks={tasks} />
            ) : view === 'calendar' ? (
                <TaskCalendarView tasks={tasks} />
            ) : (
                <TaskBoardView tasks={tasks} />
            )}
        </div>
    )
}
