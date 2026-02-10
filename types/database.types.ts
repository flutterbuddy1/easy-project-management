export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string
                    name: string
                    logo_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    logo_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    logo_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            users: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    organization_id: string | null
                    role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    organization_id?: string | null
                    role?: 'owner' | 'admin' | 'manager' | 'member' | 'viewer'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    organization_id?: string | null
                    role?: 'owner' | 'admin' | 'manager' | 'member' | 'viewer'
                    created_at?: string
                    updated_at?: string
                }
            }
            workspaces: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    description: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    description?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    name?: string
                    description?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    workspace_id: string
                    owner_id: string | null
                    name: string
                    description: string | null
                    status: 'active' | 'archived' | 'completed'
                    priority: 'low' | 'medium' | 'high' | 'critical'
                    start_date: string | null
                    due_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    owner_id?: string | null
                    name: string
                    description?: string | null
                    status?: 'active' | 'archived' | 'completed'
                    priority?: 'low' | 'medium' | 'high' | 'critical'
                    start_date?: string | null
                    due_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    owner_id?: string | null
                    name?: string
                    description?: string | null
                    status?: 'active' | 'archived' | 'completed'
                    priority?: 'low' | 'medium' | 'high' | 'critical'
                    start_date?: string | null
                    due_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    project_id: string
                    title: string
                    description: string | null
                    status: 'todo' | 'in_progress' | 'review' | 'blocked' | 'done'
                    priority: 'low' | 'medium' | 'high' | 'critical'
                    assigned_to: string | null
                    created_by: string | null
                    due_date: string | null
                    completed_at: string | null
                    position: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    title: string
                    description?: string | null
                    status?: 'todo' | 'in_progress' | 'review' | 'blocked' | 'done'
                    priority?: 'low' | 'medium' | 'high' | 'critical'
                    assigned_to?: string | null
                    created_by?: string | null
                    due_date?: string | null
                    completed_at?: string | null
                    position?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    title?: string
                    description?: string | null
                    status?: 'todo' | 'in_progress' | 'review' | 'blocked' | 'done'
                    priority?: 'low' | 'medium' | 'high' | 'critical'
                    assigned_to?: string | null
                    created_by?: string | null
                    due_date?: string | null
                    completed_at?: string | null
                    position?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            comments: {
                Row: {
                    id: string
                    task_id: string
                    user_id: string
                    message: string
                    parent_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    task_id: string
                    user_id: string
                    message: string
                    parent_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    task_id?: string
                    user_id?: string
                    message?: string
                    parent_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            attachments: {
                Row: {
                    id: string
                    task_id: string
                    file_name: string
                    file_url: string
                    file_size: number | null
                    file_type: string | null
                    uploaded_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    task_id: string
                    file_name: string
                    file_url: string
                    file_size?: number | null
                    file_type?: string | null
                    uploaded_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    task_id?: string
                    file_name?: string
                    file_url?: string
                    file_size?: number | null
                    file_type?: string | null
                    uploaded_by?: string | null
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: 'task_assigned' | 'comment' | 'mention' | 'due_date' | 'status_change' | 'general'
                    entity_type: string | null
                    entity_id: string | null
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type?: 'task_assigned' | 'comment' | 'mention' | 'due_date' | 'status_change' | 'general'
                    entity_type?: string | null
                    entity_id?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: 'task_assigned' | 'comment' | 'mention' | 'due_date' | 'status_change' | 'general'
                    entity_type?: string | null
                    entity_id?: string | null
                    is_read?: boolean
                    created_at?: string
                }
            }
            activity_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    organization_id: string
                    action: string
                    entity_type: string
                    entity_id: string
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    organization_id: string
                    action: string
                    entity_type: string
                    entity_id: string
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    organization_id?: string
                    action?: string
                    entity_type?: string
                    entity_id?: string
                    metadata?: Json | null
                    created_at?: string
                }
            }
            project_members: {
                Row: {
                    id: string
                    project_id: string
                    user_id: string
                    role: 'owner' | 'editor' | 'viewer'
                    created_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    user_id: string
                    role?: 'owner' | 'editor' | 'viewer'
                    created_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    user_id?: string
                    role?: 'owner' | 'editor' | 'viewer'
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
