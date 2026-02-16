import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const { fullName, email, password, token } = await request.json()

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName: fullName || null,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
            }
        })

        // Handle invitation if token provided

        if (token) {
            try {
                const invitation = await prisma.invitation.findUnique({
                    where: { token, status: 'pending' }
                })

                if (invitation && invitation.email === email && invitation.expiresAt > new Date()) {
                    // Update user with org and role
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            organizationId: invitation.organizationId,
                            role: invitation.role
                        }
                    })

                    // Mark invitation as accepted
                    await prisma.invitation.update({
                        where: { id: invitation.id },
                        data: {
                            status: 'accepted',
                            acceptedAt: new Date()
                        }
                    })
                }
            } catch (inviteError) {
                console.error('Error auto-accepting invite during signup:', inviteError)
                // Continue, don't fail signup
            }
        }

        return NextResponse.json(
            { success: true, user },
            { status: 201 }
        )
    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
        )
    }
}
