"use client"

import { useState } from "react"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6"
import { CiCirclePlus } from "react-icons/ci"
import { useRouter } from "next/navigation"
import { DataTable, BaseDataItem, DataTableConfig } from "@/components/data-table"
import { SectionCardData, SectionCards } from "../section-cards"

// Proposal interface extending BaseDataItem
interface Proposal extends BaseDataItem {
  id: string
  name: string
  company: string
  email: string
  phone: string
  location: string
  status: "Draft" | "Sent" | "Under Review" | "Approved" | "Rejected" | "Negotiation" | "Accepted"
  value: string
  date: string
  lastContact: string
  avatar: string
  proposalNumber: string
  expiryDate: string
}

// Dummy data for proposals
const proposalsData: Proposal[] = [
  {
    id: "1",
    name: "John Smith",
    company: "Tech Corp",
    email: "john@techcorp.com",
    phone: "+1 234-567-8900",
    location: "New York, NY",
    status: "Sent",
    source: "Website",
    value: "$25,000",
    date: "2024-01-15",
    lastContact: "2024-01-14",
    avatar: "JS",
    proposalNumber: "PROP-001",
    expiryDate: "2024-02-15"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    company: "StartupXYZ",
    email: "sarah@startupxyz.com",
    phone: "+1 234-567-8901",
    location: "San Francisco, CA",
    status: "Under Review",
    value: "$15,000",
    date: "2024-01-14",
    lastContact: "2024-01-13",
    avatar: "SJ",
    proposalNumber: "PROP-002",
    expiryDate: "2024-02-14"
  },
  {
    id: "3",
    name: "Mike Wilson",
    company: "Global Inc",
    email: "mike@globalinc.com",
    phone: "+1 234-567-8902",
    location: "Chicago, IL",
    status: "Approved",
    value: "$45,000",
    date: "2024-01-13",
    lastContact: "2024-01-12",
    avatar: "MW",
    proposalNumber: "PROP-003",
    expiryDate: "2024-02-13"
  },
  {
    id: "4",
    name: "Emily Davis",
    company: "Innovation Labs",
    email: "emily@innovationlabs.com",
    phone: "+1 234-567-8903",
    location: "Austin, TX",
    status: "Sent",
    value: "$30,000",
    date: "2024-01-12",
    lastContact: "2024-01-11",
    avatar: "ED",
    proposalNumber: "PROP-004",
    expiryDate: "2024-02-12"
  },
  {
    id: "5",
    name: "David Brown",
    company: "Future Systems",
    email: "david@futuresystems.com",
    phone: "+1 234-567-8904",
    location: "Seattle, WA",
    status: "Negotiation",
    value: "$20,000",
    date: "2024-01-11",
    lastContact: "2024-01-10",
    avatar: "DB",
    proposalNumber: "PROP-005",
    expiryDate: "2024-02-11"
  },
  {
    id: "6",
    name: "Lisa Anderson",
    company: "Digital Solutions",
    email: "lisa@digitalsolutions.com",
    phone: "+1 234-567-8905",
    location: "Miami, FL",
    status: "Accepted",
    value: "$35,000",
    date: "2024-01-10",
    lastContact: "2024-01-09",
    avatar: "LA",
    proposalNumber: "PROP-006",
    expiryDate: "2024-02-10"
  },
  {
    id: "7",
    name: "Robert Taylor",
    company: "Enterprise Co",
    email: "robert@enterpriseco.com",
    phone: "+1 234-567-8906",
    location: "Boston, MA",
    status: "Rejected",
    value: "$50,000",
    date: "2024-01-09",
    lastContact: "2024-01-08",
    avatar: "RT",
    proposalNumber: "PROP-007",
    expiryDate: "2024-02-09"
  },
  {
    id: "8",
    name: "Jennifer White",
    company: "Smart Tech",
    email: "jennifer@smarttech.com",
    phone: "+1 234-567-8907",
    location: "Denver, CO",
    status: "Draft",
    value: "$18,000",
    date: "2024-01-08",
    lastContact: "2024-01-07",
    avatar: "JW",
    proposalNumber: "PROP-008",
    expiryDate: "2024-02-08"
  }
]

function getStatusColor(status: string) {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-800'
    case 'Sent':
      return 'bg-blue-100 text-blue-800'
    case 'Under Review':
      return 'bg-yellow-100 text-yellow-800'
    case 'Approved':
      return 'bg-green-100 text-green-800'
    case 'Rejected':
      return 'bg-red-100 text-red-800'
    case 'Negotiation':
      return 'bg-orange-100 text-orange-800'
    case 'Accepted':
      return 'bg-emerald-100 text-emerald-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Column definitions for proposals table
const proposalsColumns: ColumnDef<Proposal>[] = [
  {
    accessorKey: "avatar",
    header: "",
    cell: ({ row }) => (
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
        <span className="text-sm font-medium text-white">{row.original.avatar}</span>
      </div>
    ),
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
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {row.original.date}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={`${getStatusColor(row.original.status)} w-24 justify-center`}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "action",
    header: "",
    cell: ({ row }) => (
      <Button className={`${getStatusColor(row.original.status)} w-26 justify-center`}>
        {row.original.status}
      </Button>
    ),
  },
]

const proposalsCards: SectionCardData[] = [
  {
    id: "total-proposals",
    title: "Total Proposals",
    value: "2040",
    description: "Total Proposals",
    trend: {
      value: "-15%",
      isPositive: false,
    },
  },
  {
    id: "acceptance-rate",
    title: "Acceptance Rate",
    value: "89 %",
    description: "Acceptance Rate",
    trend: {
      value: "+12.5%",
      isPositive: true,
    },
  },
]

export default function ProposalsContent() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")

  const filteredProposals = proposalsData.filter(proposal => {
    const matchesSearch = proposal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter
    const matchesSource = sourceFilter === "all" || proposal.source === sourceFilter

    return matchesSearch && matchesStatus && matchesSource
  })

  // Configuration for proposals table
  const proposalsConfig: DataTableConfig<Proposal> = {
    enableDragAndDrop: false,
    enableSelection: false,
    enablePagination: true,
    enableColumnVisibility: false,
    enableTabs: true,
    tabs: [
      { value: "leads", label: "Leads" },
      { value: "proposals", label: "Proposals" },
    ],
    enableSorting: ["date", "status"], // Only allow sorting on name and email columns
    // actions: [
    //   {
    //     label: "View Details",
    //     onClick: (proposal) => console.log("View proposal:", proposal),
    //   }
    // ],
    actionsAsButtons: true,
    addButtonLabel: "Create Proposal",
    customColumnsLabel: "Customize Proposal Columns",
    emptyStateMessage: "No proposals found.",
    pageSize: 10,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div>
        <SectionCards cards={proposalsCards} className="grid grid-cols-1 md:grid-cols-2 gap-6" />
      </div>

      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">Proposals</div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customer/company here..."
              className="pl-10 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="flex items-center gap-2">
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