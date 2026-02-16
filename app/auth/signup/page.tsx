'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signIn } from 'next-auth/react'
import { acceptInvitation } from '@/app/actions/invitations'

function SignupForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const emailParam = searchParams.get('email')

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Autofill email if present
    useEffect(() => {
        if (emailParam) {
            setFormData(prev => ({ ...prev, email: emailParam }))
        }
    }, [emailParam])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setLoading(true)

        try {
            // 1. Create User & Auto-accept invite
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    token: token // Pass token to server for atomic creation
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Failed to create account')
                setLoading(false)
                return
            }

            // 2. Sign In (User is already linked to org now)
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            })

            if (result?.error) {
                setError('Account created but failed to sign in')
                setLoading(false)
            } else {
                // Token handled by server, no client-side accept needed
                router.push('/dashboard')
                router.refresh()
            }
        } catch (error) {
            setError('An error occurred. Please try again.')
            setLoading(false)
        }
    }

    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl: '/dashboard' })
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                <CardDescription>
                    {token
                        ? "Register to accept your invitation"
                        : "Enter your information to create your account"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            disabled={loading || !!(token && emailParam)} // Lock if token & email present
                            className={token && emailParam ? "bg-muted" : ""}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Creating account...' : (token ? 'Register & Accept Invite' : 'Create account')}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Google
                </Button>
            </CardContent>
            <CardFooter>
                <p className="text-center text-sm text-muted-foreground w-full">
                    Already have an account?{' '}
                    <Link href={`/auth/login${token ? `?email=${encodeURIComponent(emailParam || '')}&token=${token}` : ''}`} className="text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    )
}

export default function SignupPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <Suspense fallback={<div>Loading form...</div>}>
                <SignupForm />
            </Suspense>
        </div>
    )
}
