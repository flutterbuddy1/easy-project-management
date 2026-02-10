import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { NotificationManager } from '@/components/notifications/NotificationManager'

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
        <SocketProvider>
            <html lang="en" suppressHydrationWarning>
                <body className={inter.className}>
                    <NotificationManager />
                    {children}
                    <Toaster />
                </body>
            </html>
        </SocketProvider>
    );
}
