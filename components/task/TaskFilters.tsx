'use client'

import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, Search, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'

export function TaskFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [status, setStatus] = useState(searchParams.get('status') || 'all')
    const [priority, setPriority] = useState(searchParams.get('priority') || 'all')
    const [search, setSearch] = useState(searchParams.get('search') || '')

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams)
            if (search) params.set('search', search)
            else params.delete('search')
            router.push(`?${params.toString()}`)
        }, 500)
        return () => clearTimeout(timer)
    }, [search, router, searchParams])

    const handleStatusChange = (value: string) => {
        setStatus(value)
        const params = new URLSearchParams(searchParams)
        if (value && value !== 'all') params.set('status', value)
        else params.delete('status')
        router.push(`?${params.toString()}`)
    }

    const handlePriorityChange = (value: string) => {
        setPriority(value)
        const params = new URLSearchParams(searchParams)
        if (value && value !== 'all') params.set('priority', value)
        else params.delete('priority')
        router.push(`?${params.toString()}`)
    }

    const clearFilters = () => {
        setStatus('all')
        setPriority('all')
        setSearch('')
        router.push('?view=' + (searchParams.get('view') || 'board'))
    }

    const hasFilters = status !== 'all' || priority !== 'all' || search !== ''

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-muted/30 p-3 rounded-lg border">
            <div className="flex-1 w-full sm:w-auto relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-background"
                />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
                <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[140px] bg-background">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="w-[140px] bg-background">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                </Select>

                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearFilters}
                        title="Clear filters"
                        className="shrink-0"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear filters</span>
                    </Button>
                )}
            </div>
        </div>
    )
}
