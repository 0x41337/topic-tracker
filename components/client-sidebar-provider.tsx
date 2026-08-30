"use client"

import dynamic from "next/dynamic"

const SidebarProvider = dynamic(
    () =>
        import("@/components/ui/sidebar").then((mod) => mod.SidebarProvider),
    { ssr: false },
)

export function ClientSidebarProvider({
    children,
}: {
    children: React.ReactNode
}) {
    return <SidebarProvider>{children}</SidebarProvider>
}
