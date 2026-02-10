'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    XCircle,
    MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Task {
    id: string
    title: string
    status: string
    priority: string
    project: {
        id: string
        name: string
    }
    createdAt: Date
    assignee?: {
        avatarUrl?: string | null
    } | null
}

interface TaskBoardViewProps {
    tasks: Task[]
}

export function TaskBoardView({ tasks }: TaskBoardViewProps) {
    const columns = [
        {
            id: 'todo',
            label: 'To Do',
            icon: Circle,
            color: 'text-slate-500',
            bgColor: 'bg-slate-500/10',
            borderColor: 'border-slate-200 dark:border-slate-800'
        },
        {
            id: 'in_progress',
            label: 'In Progress',
            icon: Clock,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-200 dark:border-blue-900'
        },
        {
            id: 'review',
            label: 'Review',
            icon: AlertCircle,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-200 dark:border-purple-900'
        },
        {
            id: 'blocked',
            label: 'Blocked',
            icon: XCircle,
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-200 dark:border-red-900'
        },
        {
            id: 'done',
            label: 'Done',
            icon: CheckCircle2,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-200 dark:border-green-900'
        }
    ]

    const getTasksByStatus = (status: string) => {
        return tasks.filter(task => task.status === status)
    }

    const priorityColors = {
        low: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    }

    return (
        <div className="h-[calc(100vh-220px)] w-full overflow-x-auto pb-4">
            <div className="flex h-full gap-4 min-w-[1200px] px-1">
                {columns.map(column => {
                    const columnTasks = getTasksByStatus(column.id)
                    const Icon = column.icon

                    return (
                        <div
                            key={column.id}
                            className="flex flex-col h-full w-[280px] shrink-0 rounded-lg bg-muted/40 border"
                        >
                            {/* Column Header */}
                            <div className={`p-3 border-b flex items-center justify-between ${column.bgColor}`}>
                                <div className="flex items-center gap-2 font-medium text-sm">
                                    <Icon className={`h-4 w-4 ${column.color}`} />
                                    {column.label}
                                </div>
                                <Badge variant="secondary" className="text-xs h-5 px-1.5 font-normal">
                                    {columnTasks.length}
                                </Badge>
                            </div>

                            {/* Column Content */}
                            <ScrollArea className="flex-1 p-3">
                                <div className="space-y-3">
                                    {columnTasks.map(task => (
                                        <Link
                                            key={task.id}
                                            href={`/dashboard/tasks/${task.id}`}
                                            className="block group"
                                        >
                                            <Card className="shadow-sm hover:shadow-md transition-all duration-200 border cursor-pointer hover:border-primary/50 relative overflow-hidden">
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${column.bgColor.replace('/10', '')}`} />
                                                <CardContent className="p-3 pl-4 space-y-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                                            {task.title}
                                                        </h3>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-1">
                                                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px] flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                                                            {task.project.name}
                                                        </span>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`text-[10px] h-4 px-1 ${priorityColors[task.priority as keyof typeof priorityColors]}`}
                                                        >
                                                            {task.priority}
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                    {columnTasks.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-muted-foreground/10 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                                            No tasks
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
