"use client"

import { motion, AnimatePresence } from "framer-motion"

import {
    Sidebar,
    useSidebar,
    SidebarMenu,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
    SidebarContent,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
} from "@/components/ui/sidebar"

import { Logo } from "@/components/logo"

import Link from "next/link"

import { SettingsIcon, ChartAreaIcon, FolderTreeIcon } from "lucide-react"

export function AppSidebar() {
    const sidebar = useSidebar()

    // On mobile the sidebar always renders full-width as a sheet, regardless
    // of the desktop expanded/collapsed preference — so show the full header
    // (logo + trigger) whenever we're on mobile, not just when "expanded".
    const showExpandedHeader = sidebar.isMobile || sidebar.state === "expanded"

    // Tapping a nav item should close the mobile sheet; harmless on desktop
    // since openMobile has no effect on the persistent sidebar there.
    const closeOnMobile = () => sidebar.setOpenMobile(false)

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="relative h-10">
                    <AnimatePresence mode="wait" initial={false}>
                        {showExpandedHeader ? (
                            <motion.div
                                key="expanded"
                                className="absolute inset-0 flex flex-row items-center justify-between"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.1 }}
                            >
                                <Logo />
                                <SidebarTrigger />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="collapsed"
                                className="absolute inset-0 flex items-center justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.1 }}
                            >
                                <SidebarTrigger />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={closeOnMobile}
                                render={<Link href="/" />}
                            >
                                <FolderTreeIcon />
                                Topics
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={closeOnMobile}
                                render={<Link href="/statistics" />}
                            >
                                <ChartAreaIcon />
                                Statistics
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={closeOnMobile}
                            render={<Link href="/settings" />}
                        >
                            <SettingsIcon />
                            Settings
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
