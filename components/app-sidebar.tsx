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

    const isExpanded = sidebar.state == "expanded"

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="relative h-10">
                    <AnimatePresence mode="wait" initial={false}>
                        {isExpanded ? (
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
                            <SidebarMenuButton render={<Link href="/" />}>
                                <FolderTreeIcon />
                                Topics
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
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
                        <SidebarMenuButton render={<Link href="/settings" />}>
                            <SettingsIcon />
                            Settings
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
