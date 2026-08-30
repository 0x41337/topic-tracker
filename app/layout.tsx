import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"

import { AppSidebar } from "@/components/app-sidebar"
import { ClientSidebarProvider } from "@/components/client-sidebar-provider"
import { Logo } from "@/components/logo"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

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
                    <SidebarInset>
                        {/*
                          Visible only below md. This is the only way to open the
                          sidebar on mobile: the Sidebar itself renders as an
                          off-canvas Sheet there, so its own internal trigger is
                          hidden until the sheet is already open.
                        */}
                        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 md:hidden">
                            <SidebarTrigger className="-ml-1" />
                            <div className="h-4 w-px shrink-0 bg-border" />
                            <Logo />
                        </header>
                        <div className="flex-1 p-4">{children}</div>
                    </SidebarInset>
                </ClientSidebarProvider>
            </body>
        </html>
    )
}
