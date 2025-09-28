import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { AuthGuard } from "@/components/auth/auth-guard"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./dashboard/data.json"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />
                    <div className="px-4 py-4">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    )
}
