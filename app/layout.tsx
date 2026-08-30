import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"

import { AppSidebar } from "@/components/app-sidebar"
import { ClientSidebarProvider } from "@/components/client-sidebar-provider"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Topic tracker",
    description: "Track your performance across study topics.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full">
                <ClientSidebarProvider>
                    <AppSidebar />
                    <main className="flex-1 p-4">{children}</main>
                </ClientSidebarProvider>
            </body>
        </html>
    )
}
