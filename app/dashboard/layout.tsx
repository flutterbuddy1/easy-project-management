import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user?.email) {
        redirect('/auth/login')
    }

    // Fetch full user details for profile display
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            role: true, // Keep for backward compatibility
            roleRel: {
                select: {
                    name: true,
                    permissions: {
                        select: {
                            action: true
                        }
                    }
                }
            }
        }
    })

    if (!user) {
        // Redirect to error page instead of login to avoid loop with middleware
        redirect('/auth/error?error=UserNotFound')
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar user={user} className="hidden md:flex" />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar user={user} />
                <main className="flex-1 overflow-y-auto bg-background p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
