"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import {
  Search,
  Plus,
  MapPin,
  Building2,
  Users,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable, BaseDataItem, DataTableConfig } from "@/components/data-table"
// import { SectionCards } from "../section-cards"
import { useCenters } from "@/hooks/useCenters"
// import { Center } from "@/types/center"

interface CenterTableItem extends BaseDataItem {
  name: string
  location: string
  totalCapacity: number
  availableCapacity: number
  status: string
}

export function CentersContent() {
  const router = useRouter()
  const { data, isLoading } = useCenters()
  const centers = data || []
  const [searchQuery, setSearchQuery] = useState("")
  console.log(centers, "ccccccccccccc")

  const tableData: CenterTableItem[] = useMemo(() =>
    (centers?.data?.centers || []).map(center => ({
      id: center._id,
      name: center.name,
      location: `${center.address.city}, ${center.address.state}`,
      totalCapacity:
        (center.capacity.hotDesks.total || 0) +
        (center.capacity.dedicatedDesks.total || 0) +
        (center.capacity.privateCabins.total || 0) +
        (center.capacity.meetingRooms.total || 0),
      availableCapacity:
        (center.capacity.hotDesks.available || 0) +
        (center.capacity.dedicatedDesks.available || 0) +
        (center.capacity.privateCabins.available || 0) +
        (center.capacity.meetingRooms.available || 0),
      status: center.isActive ? "Active" : "Inactive"
    })), [centers]
  )

  const filteredData = useMemo(() => {
    if (!searchQuery) return tableData
    const query = searchQuery.toLowerCase()
    return tableData.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
    )
  }, [tableData, searchQuery])

  const columns: ColumnDef<CenterTableItem>[] = [
    {
      accessorKey: "name",
      header: "Center Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue("location")}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalCapacity",
      header: "Total Capacity",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue("totalCapacity")}</span>
        </div>
      ),
    },
    {
      accessorKey: "availableCapacity",
      header: "Available",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue("availableCapacity")}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "Active" ? "default" : "secondary"}>
            {status}
          </Badge>
        )
      },
    },
  ]

  const tableConfig: DataTableConfig<CenterTableItem> = {
    enableSelection: true,
    enableColumnVisibility: true,
    enableSorting: true,
    actions: [
      {
        label: "View Details",
        onClick: (center) => router.push(`/centers/${center.id}`),
      },
      {
        label: "Edit",
        onClick: (center) => router.push(`/centers/${center.id}/edit`),
      },
    ],
    addButtonLabel: "Add Center",
    onAddClick: () => router.push("/centers/new"),
  }

  const stats = useMemo(() => [
    {
      title: "Total Centers",
      value: (centers || []).length,
      description: "Active and inactive centers",
      icon: Building2,
    },
    {
      title: "Total Capacity",
      value: (tableData || []).reduce((sum, center) => sum + center.totalCapacity, 0),
      description: "Across all centers",
      icon: Users,
    },
    {
      title: "Available Capacity",
      value: (tableData || []).reduce((sum, center) => sum + center.availableCapacity, 0),
      description: "Ready for booking",
      icon: Calendar,
    },
  ], [centers, tableData])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Centers</h1>
        <Button onClick={() => router.push("/centers/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Center
        </Button>
      </div>

      {/* <SectionCards cards={stats} /> */}

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search centers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        config={tableConfig}
      />
    </div>
  )
}