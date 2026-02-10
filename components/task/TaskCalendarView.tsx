'use client'

import { useState } from 'react'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import Link from 'next/link'

interface TaskCalendarViewProps {
    tasks: any[]
}

export function TaskCalendarView({ tasks }: TaskCalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    })

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const today = () => setCurrentMonth(new Date())

    const priorityColors = {
        low: 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300',
        medium: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-300',
        high: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-900/50 dark:text-orange-300',
        critical: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300',
        urgent: 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-900 dark:text-red-200'
    }

    return (
        <Card className="border shadow-none">
            <CardHeader className="p-4 flex flex-row items-center justify-between border-b space-y-0">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-xl font-bold">
                        {format(currentMonth, 'MMMM yyyy')}
                    </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={today}>
                        Today
                    </Button>
                    <div className="flex items-center rounded-md border bg-background">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={prevMonth}
                            className="h-8 w-8 hover:bg-muted"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="w-[1px] h-4 bg-border" />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextMonth}
                            className="h-8 w-8 hover:bg-muted"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b bg-muted/40 divide-x">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 auto-rows-fr bg-muted/20 gap-px border-b">
                    {calendarDays.map((day, dayIdx) => {
                        const dayTasks = tasks.filter(task => isSameDay(new Date(task.createdAt), day))
                        const isToday = isSameDay(day, new Date())
                        const isCurrentMonth = isSameMonth(day, monthStart)

                        return (
                            <div
                                key={day.toISOString()}
                                className={`min-h-[140px] p-2 transition-colors hover:bg-muted/5 flex flex-col gap-1
                                    ${!isCurrentMonth ? 'bg-muted/5 text-muted-foreground' : 'bg-background'}
                                `}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span
                                        className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full
                                            ${isToday ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}
                                        `}
                                    >
                                        {format(day, 'd')}
                                    </span>
                                    {isToday && <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Today</span>}
                                </div>

                                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[100px] no-scrollbar">
                                    {dayTasks.map(task => {
                                        const colorClass = task.status === 'done'
                                            ? 'bg-slate-100 text-slate-500 border-slate-200 line-through opacity-70 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                            : priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium

                                        return (
                                            <HoverCard key={task.id}>
                                                <HoverCardTrigger asChild>
                                                    <Link href={`/dashboard/tasks/${task.id}`} className="block">
                                                        <div className={`
                                                            text-[11px] px-2 py-1 rounded-md border truncate font-medium
                                                            cursor-pointer hover:opacity-80 transition-all shadow-sm
                                                            ${colorClass}
                                                        `}>
                                                            {task.title}
                                                        </div>
                                                    </Link>
                                                </HoverCardTrigger>
                                                <HoverCardContent className="w-80 p-0 overflow-hidden shadow-lg border-opacity-50" align="start">
                                                    <div className={`h-1.5 w-full ${task.priority === 'critical' ? 'bg-red-500' :
                                                            task.priority === 'high' ? 'bg-orange-500' :
                                                                'bg-primary'
                                                        }`} />
                                                    <div className="p-4 space-y-3">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <h4 className="text-sm font-semibold leading-tight">{task.title}</h4>
                                                            <Badge variant={task.status === 'done' ? 'secondary' : 'default'} className="shrink-0 capitalize">
                                                                {task.status.replace('_', ' ')}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                                                                {task.project?.name}
                                                            </div>
                                                            <span>•</span>
                                                            <span>{format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
                                                        </div>

                                                        {task.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/50 p-2 rounded-md">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </HoverCardContent>
                                            </HoverCard>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
