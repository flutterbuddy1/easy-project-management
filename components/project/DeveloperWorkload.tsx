'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, AlertCircle } from 'lucide-react'

interface DeveloperWorkloadProps {
    workload: {
        id: string
        name: string | null
        avatar: string | null
        activeProjects: number
    }[]
}

export function DeveloperWorkload({ workload }: DeveloperWorkloadProps) {
    // Sort by active projects desc
    const sortedWorkload = [...workload].sort((a, b) => b.activeProjects - a.activeProjects)

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Team Workload
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sortedWorkload.map(dev => {
                        const isOverloaded = dev.activeProjects > 3

                        return (
                            <div key={dev.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={dev.avatar || ''} />
                                        <AvatarFallback>
                                            {dev.name?.charAt(0) || <User className="h-4 w-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{dev.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {dev.activeProjects} Active Projects
                                        </p>
                                    </div>
                                </div>
                                {isOverloaded && (
                                    <Badge variant="destructive" className="h-6 gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Overload
                                    </Badge>
                                )}
                            </div>
                        )
                    })}
                    {sortedWorkload.length === 0 && (
                        <p className="text-sm text-muted-foreground">No developers found.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
