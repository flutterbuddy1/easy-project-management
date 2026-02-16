import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { NotificationManager } from '@/components/notifications/NotificationManager'
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Project Management Tool",
    description: "Enterprise-grade project management platform",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <AuthProvider>
                    <SocketProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            <NotificationManager />
                            {children}
                            <Toaster />
                            <SonnerToaster />
                        </ThemeProvider>
                    </SocketProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
