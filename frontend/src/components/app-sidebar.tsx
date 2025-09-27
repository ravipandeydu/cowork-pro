"use client"

import * as React from "react"
import {
    BarChart3,
    Users,
    Bell,
    FileText,
    MoreHorizontal,
    UserCheck,
    Contact,
    HelpCircle,
    MoreVertical
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSales } from "@/components/nav-sales"
import { NavContract } from "@/components/nav-contract"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
    user: {
        name: "Ray Bryant",
        email: "m@example.com",
        avatar: "/avatars/ray-bryant.jpg",
    },
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <NavMain items={data.navMain} />
                <NavSales items={data.navSales} />
                <NavContract items={data.navContract} />
                <NavSecondary items={data.navSettings} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
        </Sidebar>
    )
}
