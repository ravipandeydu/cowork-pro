"use client"

import { useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { DataTable, BaseDataItem, DataTableConfig } from "@/components/data-table"
import { SectionCards } from "../section-cards"
import { useProposals } from "@/hooks/useProposals"
import { Proposal } from "@/services/proposals"

// Proposal interface extending BaseDataItem for DataTable compatibility
interface ProposalTableItem extends Proposal, BaseDataItem {
  id: string
  totalAmount: number // Add totalAmount for easier access
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'sent':
      return 'bg-blue-100 text-blue-800'
    case 'under_review':
      return 'bg-yellow-100 text-yellow-800'
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'negotiation':
      return 'bg-orange-100 text-orange-800'
    case 'accepted':
      return 'bg-emerald-100 text-emerald-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Column definitions for proposals table
const proposalsColumns: ColumnDef<ProposalTableItem>[] = [
  {
    accessorKey: "avatar",
    header: "",
    cell: ({ row }) => {
      const initials = row.original.leadId?.name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'PR'

      return (
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-white">{initials}</span>
        </div>
      )
    },
    enableSorting: false,
    size: 50,
  },
  {
    accessorKey: "title",
    header: "Proposal",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.title}</div>
        <div className="text-sm text-muted-foreground">
          {row.original.leadId?.company || 'N/A'}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "leadId",
    header: "Contact",
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-3 w-3 text-muted-foreground" />
          {row.original.leadId?.email || 'N/A'}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3 w-3 text-muted-foreground" />
          {row.original.leadId?.phone || 'N/A'}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: "Value",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        ${row.original.totalAmount?.toLocaleString() || '0'}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={`${getStatusColor(row.original.status)} w-24 justify-center`}>
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

export default function ProposalsContent() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch real data from API
  const { data: proposalsData, isLoading, error } = useProposals()

  console.log(proposalsData, "ppppppppppp")

  // Transform API data for DataTable compatibility
  const tableData: ProposalTableItem[] = useMemo(() => {
    if (!proposalsData?.data?.proposals || !Array.isArray(proposalsData.data.proposals)) return []

    return proposalsData.data.proposals.map(proposal => ({
      ...proposal,
      id: proposal._id, // Map _id to id for DataTable compatibility
      totalAmount: proposal.pricing?.finalAmount || 0, // Use finalAmount from backend
    }))
  }, [proposalsData])

  // Filter data based on search and status
  const filteredProposals = useMemo(() => {
    return tableData.filter(proposal => {
      const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.leadId?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.leadId?.email?.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [tableData, searchTerm])

  // Calculate stats from real data
  const stats = useMemo(() => {
    const total = proposalsData?.pagination?.total || 0
    const accepted = tableData.filter(proposal => proposal.status === 'approved').length
    const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0'

    return [
      {
        id: "total-proposals",
        title: "Total Proposals",
        value: total.toString(),
        description: "Total Proposals",
        trend: {
          value: "+8%",
          isPositive: true,
        },
      },
      {
        id: "acceptance-rate",
        title: "Acceptance Rate",
        value: `${acceptanceRate}%`,
        description: "Acceptance Rate",
        trend: {
          value: "+12.5%",
          isPositive: true,
        },
      },
    ]
  }, [proposalsData, tableData])

  // Configuration for proposals table
  const proposalsConfig: DataTableConfig<ProposalTableItem> = {
    enableDragAndDrop: false,
    enableSelection: false,
    enablePagination: true,
    enableColumnVisibility: false,
    enableTabs: true,
    // tabs: [
    //   { value: "leads", label: "Leads" },
    //   { value: "proposals", label: "Proposals" },
    // ],
    enableSorting: ["title", "createdAt"],
    actions: [
      {
        label: "View Details",
        onClick: (proposal) => console.log("View proposal:", proposal),
      }
    ],
    actionsAsButtons: true,
    addButtonLabel: "Create Proposal",
    customColumnsLabel: "Customize Proposal Columns",
    emptyStateMessage: isLoading ? "Loading proposals..." : "No proposals found.",
    pageSize: 10,
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading proposals</p>
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

      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">Proposals</div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search proposal/company here..."
              className="pl-10 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => router.push("/proposals/create")}
          >
            <Plus className="h-4 w-4" />
            Create Proposal
          </Button>
        </div>
      </div>

      {/* Dynamic Data Table */}
      <DataTable
        data={filteredProposals}
        columns={proposalsColumns}
        config={proposalsConfig}
        onDataChange={(updatedData) => {
          console.log("Proposals data updated:", updatedData)
          // Handle data updates here
        }}
      />
    </div>
  )
}