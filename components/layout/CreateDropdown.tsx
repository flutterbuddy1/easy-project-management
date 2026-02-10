'use client'

import { useState } from 'react'
import { Plus, FolderPlus, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateProjectDialog } from '@/components/project/CreateProjectDialog'
import { CreateTaskDialog } from '@/components/task/CreateTaskDialog'

// Wrapper to handle dialog state separately from dropdown
export function CreateDropdown() {
    const [projectDialogOpen, setProjectDialogOpen] = useState(false)
    const [taskDialogOpen, setTaskDialogOpen] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Create</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setProjectDialogOpen(true)}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        <span>New Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTaskDialogOpen(true)}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        <span>New Task</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CreateProjectDialog
                open={projectDialogOpen}
                onOpenChange={setProjectDialogOpen}
            />

            <CreateTaskDialog
                open={taskDialogOpen}
                onOpenChange={setTaskDialogOpen}
            // defaultProjectId? We might not know it here. 
            // The dialog should handle empty project ID by asking user to select one,
            // or we redirect to My Tasks which has a create button.
            // Assuming CreateTaskDialog can handle "global" creation or we might need to update it.
            />
        </>
    )
}
