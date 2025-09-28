"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPageTitle, formatBreadcrumb } from "@/lib/page-titles"

export function SiteHeader() {
  const pathname = usePathname()
  const pageInfo = getPageTitle(pathname)

  const displayTitle = pageInfo.breadcrumb
    ? formatBreadcrumb(pageInfo.breadcrumb)
    : pageInfo.title

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{displayTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Select defaultValue="mg-road">
            <SelectTrigger className="w-auto border-none shadow-none bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0">
              <div className="flex items-center gap-2">
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mg-road">M G Road</SelectItem>
              <SelectItem value="koramangala">Koramangala</SelectItem>
              <SelectItem value="whitefield">Whitefield</SelectItem>
              <SelectItem value="indiranagar">Indiranagar</SelectItem>
              <SelectItem value="electronic-city">Electronic City</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  )
}
