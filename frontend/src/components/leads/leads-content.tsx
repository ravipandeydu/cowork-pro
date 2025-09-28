"use client"

import { useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Building2,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6"
import { CiCirclePlus } from "react-icons/ci"
import { useRouter } from "next/navigation"
import { DataTable, BaseDataItem, DataTableConfig } from "@/components/data-table"
import { SectionCardData, SectionCards } from "../section-cards"
import { useLeads, useLeadStats } from "@/hooks/useLeads"
import { Lead } from "@/services/leads"
import AddLeadForm from "./add-lead-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Extend Lead interface for DataTable compatibility
interface LeadTableItem extends Lead, BaseDataItem {
  id: string
}

function getStatusColor(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800"
    case "contacted":
      return "bg-yellow-100 text-yellow-800"
    case "qualified":
      return "bg-green-100 text-green-800"
    case "proposal_sent":
      return "bg-purple-100 text-purple-800"
    case "negotiation":
      return "bg-orange-100 text-orange-800"
    case "won":
      return "bg-emerald-100 text-emerald-800"
    case "lost":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Define columns for the leads table
const leadsColumns: ColumnDef<LeadTableItem>[] = [
  {
    accessorKey: "avatar",
    header: "",
    cell: ({ row }) => {
      const initials = row.original.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()

      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
          {initials}
        </div>
      )
    },
    enableSorting: false,
    size: 50,
  },
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-sm text-muted-foreground">{row.original.company}</div>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-3 w-3 text-muted-foreground" />
          {row.original.email}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3 w-3 text-muted-foreground" />
          {row.original.phone}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "businessType",
    header: "Business Type",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        {row.original.businessType}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={getStatusColor(row.original.status)}>
        {row.original.status.replace('_', ' ').toUpperCase()}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {new Date(row.original.createdAt).toLocaleDateString()}
      </div>
    ),
  },
]

export default function LeadsContent() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false)

  // Fetch real data from API
  const { data: leadsData, isLoading, error, refetch } = useLeads()
  const { data: leadStats, isLoading: statsLoading } = useLeadStats()

  // Debug logs
  console.log("Raw leadsData:", leadsData)
  console.log("leadsData structure:", {
    data: leadsData?.data,
    pagination: leadsData?.pagination,
    isArray: Array.isArray(leadsData?.data)
  })

  // Transform API data for DataTable compatibility
  const tableData: LeadTableItem[] = useMemo(() => {
    console.log("Processing tableData transformation...")
    // The API returns data.leads, not data directly
    const leadsArray = leadsData?.data?.leads || leadsData?.data;

    if (!leadsArray || !Array.isArray(leadsArray)) {
      console.log("No leads array or not array:", leadsArray)
      return []
    }

    const transformed = leadsArray.map(lead => ({
      ...lead,
      id: lead._id, // Map _id to id for DataTable compatibility
    }))

    console.log("Transformed tableData:", transformed)
    return transformed
  }, [leadsData])

  // Filter data based on search and status
  const filteredLeads = useMemo(() => {
    console.log("Processing filteredLeads...")
    console.log("tableData length:", tableData.length)

    const filtered = tableData.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter

      return matchesSearch && matchesStatus
    })

    console.log("Filtered leads:", filtered)
    console.log("Filtered leads length:", filtered.length)
    return filtered
  }, [tableData, searchTerm, statusFilter])

  // Calculate stats from real data
  const stats = useMemo(() => {
    const total = leadsData?.pagination?.total || 0
    const qualified = tableData.filter(lead => lead.status === 'converted').length
    const acceptanceRate = total > 0 ? ((qualified / total) * 100).toFixed(1) : '0'

    return [
      {
        id: "total-leads",
        title: "Total Leads",
        value: total.toString(),
        description: "Total Leads",
        trend: {
          value: "+12%",
          isPositive: true,
        },
      },
      {
        id: "acceptance-rate",
        title: "Qualified Rate",
        value: `${acceptanceRate}%`,
        description: "Qualified Rate",
        trend: {
          value: "+12.5%",
          isPositive: true,
        }
      },
    ]
  }, [leadsData, tableData])

  // Configuration for leads table
  const leadsConfig: DataTableConfig<LeadTableItem> = {
    enableSelection: true,
    enablePagination: true,
    enableColumnVisibility: true,
    actions: [
      {
        label: "View Details",
        onClick: (lead) => console.log("View lead:", lead),
      }
    ],
    actionsAsButtons: true,
    addButtonLabel: "Add Lead",
    onAddClick: () => {
      console.log("Add Lead button clicked!")
      setIsAddLeadDialogOpen(true)
    },
    customColumnsLabel: "Customize Lead Columns",
    emptyStateMessage: isLoading ? "Loading leads..." : "No leads found.",
    pageSize: 10,
  }

  console.log("leadsConfig:", leadsConfig)
  console.log("onAddClick function:", leadsConfig.onAddClick)

  const handleLeadCreated = () => {
    setIsAddLeadDialogOpen(false)
    refetch() // Refresh the leads data
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading leads</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div>
        <SectionCards cards={stats} className="grid grid-cols-1 md:grid-cols-2 gap-6" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
            <SelectItem value="closed_won">Closed Won</SelectItem>
            <SelectItem value="closed_lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <div className="rounded-md border">
        <DataTable
          data={filteredLeads}
          columns={leadsColumns}
          config={leadsConfig}
        />
      </div>

      {/* Add Lead Dialog */}
      <Dialog open={isAddLeadDialogOpen} onOpenChange={setIsAddLeadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <AddLeadForm
            onSuccess={handleLeadCreated}
            onCancel={() => setIsAddLeadDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}