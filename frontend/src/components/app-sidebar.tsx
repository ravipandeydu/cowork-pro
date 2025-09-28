"use client"

import * as React from "react"
import {
    BarChart3,
    Users,
    Bell,
    FileText,
    UserCheck,
    Contact,
    HelpCircle,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSales } from "@/components/nav-sales"
import { NavContract } from "@/components/nav-contract"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useAuthStore } from "@/stores/auth"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: BarChart3,
        },
    ],
    navSales: [
        {
            title: "Leads",
            url: "/leads",
            icon: Users,
        },
        {
            title: "Proposal",
            url: "/proposals",
            icon: FileText,
        },
        {
            title: "Customers",
            url: "/customers",
            icon: UserCheck,
        },
    ],
    navContract: [
        {
            title: "New Contract",
            url: "/contracts/new",
            icon: Contact,
        },
        {
            title: "Contract Details",
            url: "/contracts",
            icon: FileText,
        },
        {
            title: "Document",
            url: "/documents",
            icon: FileText,
        },
    ],
    navSettings: [
        {
            title: "Notifications",
            url: "/notifications",
            icon: Bell,
        },
        {
            title: "Support & Help",
            url: "/support",
            icon: HelpCircle,
        },
    ],
}

export function AppSidebar({ pathname, ...props }: React.ComponentProps<typeof Sidebar> & { pathname?: string }) {
    const { user } = useAuthStore()

    // Create user object for NavUser component
    const userData = user ? {
        name: user.name,
        email: user.email,
        avatar: "/avatars/default-avatar.jpg", // Default avatar since we don't have user avatars yet
    } : {
        name: "Guest User",
        email: "guest@example.com",
        avatar: "/avatars/default-avatar.jpg",
    }

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <a href="#">
                                <span className="text-base font-semibold">INDIA ACCELERATOR</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} pathname={pathname} />
                <NavSales items={data.navSales} pathname={pathname} />
                <NavContract items={data.navContract} pathname={pathname} />
                <NavSecondary items={data.navSettings} className="mt-auto" pathname={pathname} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
        </Sidebar>
    )
}
