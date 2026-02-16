'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Phone, Eye, EyeOff } from 'lucide-react'

interface ClientContactDetailsProps {
    email: string | null
    phone: string | null
    userRole: string
}

export function ClientContactDetails({ email, phone, userRole }: ClientContactDetailsProps) {
    const [showDetails, setShowDetails] = useState(false)
    const isAdmin = userRole === 'admin'

    // If not admin, do not render anything
    if (!isAdmin) {
        return null
    }

    if (!email && !phone) {
        return <p className="text-xs text-muted-foreground italic">No contact details available</p>
    }

    return (
        <div className="space-y-4 pt-2">
            {!showDetails ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(true)}
                    className="w-full text-xs"
                >
                    <Eye className="h-3 w-3 mr-2" />
                    View Contact Details
                </Button>
            ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 p-3 bg-muted/30 rounded-md border">
                    {email && (
                        <div className="flex items-center gap-2 text-sm overflow-hidden">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a href={`mailto:${email}`} className="hover:underline text-blue-600 truncate" title={email}>
                                {email}
                            </a>
                        </div>
                    )}
                    {phone && (
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a href={`tel:${phone}`} className="hover:underline text-blue-600 truncate">
                                {phone}
                            </a>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(false)}
                        className="w-full h-7 text-xs text-muted-foreground hover:bg-white"
                    >
                        <EyeOff className="h-3 w-3 mr-2" />
                        Hide Details
                    </Button>
                </div>
            )}
        </div>
    )
}
