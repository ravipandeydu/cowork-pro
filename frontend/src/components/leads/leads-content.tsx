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

// Lead interface extending BaseDataItem
interface Lead extends BaseDataItem {
  id: string
  name: string
  company: string
  email: string
  phone: string
  location: string
  status: "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Negotiation" | "Won" | "Lost"
  source: string
  value: string
  date: string
  lastContact: string
  avatar: string
}
const leadsData: Lead[] = [
  {
    id: "1",
    name: "John Smith",
    company: "Tech Corp",
    email: "john@techcorp.com",
    phone: "+1 234-567-8900",
    location: "New York, NY",
    status: "New",
    source: "Website",
    value: "$25,000",
    date: "2024-01-15",
    lastContact: "2024-01-14",
    avatar: "JS"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    company: "StartupXYZ",
    email: "sarah@startupxyz.com",
    phone: "+1 234-567-8901",
    location: "San Francisco, CA",
    status: "Qualified",
    source: "Referral",
    value: "$15,000",
    date: "2024-01-14",
    lastContact: "2024-01-13",
    avatar: "SJ"
  },
  {
    id: "3",
    name: "Mike Wilson",
    company: "Global Inc",
    email: "mike@globalinc.com",
    phone: "+1 234-567-8902",
    location: "Chicago, IL",
    status: "Contacted",
    source: "LinkedIn",
    value: "$45,000",
    date: "2024-01-13",
    lastContact: "2024-01-12",
    avatar: "MW"
  },
  {
    id: "4",
    name: "Emily Davis",
    company: "Innovation Labs",
    email: "emily@innovationlabs.com",
    phone: "+1 234-567-8903",
    location: "Austin, TX",
    status: "Proposal Sent",
    source: "Cold Email",
    value: "$30,000",
    date: "2024-01-12",
    lastContact: "2024-01-11",
    avatar: "ED"
  },
  {
    id: "5",
    name: "David Brown",
    company: "Future Systems",
    email: "david@futuresystems.com",
    phone: "+1 234-567-8904",
    location: "Seattle, WA",
    status: "Negotiation",
    source: "Trade Show",
    value: "$20,000",
    date: "2024-01-11",
    lastContact: "2024-01-10",
    avatar: "DB"
  },
  {
    id: "6",
    name: "Lisa Anderson",
    company: "Digital Solutions",
    email: "lisa@digitalsolutions.com",
    phone: "+1 234-567-8905",
    location: "Miami, FL",
    status: "Won",
    source: "Website",
    value: "$35,000",
    date: "2024-01-10",
    lastContact: "2024-01-09",
    avatar: "LA"
  },
  {
    id: "7",
    name: "Robert Taylor",
    company: "Enterprise Co",
    email: "robert@enterpriseco.com",
    phone: "+1 234-567-8906",
    location: "Boston, MA",
    status: "Lost",
    source: "Referral",
    value: "$50,000",
    date: "2024-01-09",
    lastContact: "2024-01-08",
    avatar: "RT"
  },
  {
    id: "8",
    name: "Jennifer White",
    company: "Smart Tech",
    email: "jennifer@smarttech.com",
    phone: "+1 234-567-8907",
    location: "Denver, CO",
    status: "New",
    source: "Social Media",
    value: "$18,000",
    date: "2024-01-08",
    lastContact: "2024-01-07",
    avatar: "JW"
  }
]

function getStatusColor(status: string) {
  switch (status) {
    case 'New':
      return 'bg-blue-100 text-blue-800'
    case 'Qualified':
      return 'bg-green-100 text-green-800'
    case 'Contacted':
      return 'bg-yellow-100 text-yellow-800'
    case 'Proposal Sent':
      return 'bg-purple-100 text-purple-800'
    case 'Negotiation':
      return 'bg-orange-100 text-orange-800'
    case 'Won':
      return 'bg-emerald-100 text-emerald-800'
    case 'Lost':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Column definitions for leads table
const leadsColumns: ColumnDef<Lead>[] = [
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
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        {row.original.location}
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
]

const leadsCards: SectionCardData[] = [
  {
    id: "total-leads",
    title: "Total Leads",
    value: "4,050",
    description: "Total Leads",
    trend: {
      value: "-20%",
      isPositive: false,
    },
  },
  {
    id: "acceptance-rate",
    title: "Acceptance Rate",
    value: "89%",
    description: "Acceptance Rate",
    trend: {
      value: "+12.5%",
      isPositive: true,
    }
  },
]

export default function LeadsContent() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")

  const filteredLeads = leadsData.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter

    return matchesSearch && matchesStatus && matchesSource
  })

  // Configuration for leads table
  const leadsConfig: DataTableConfig<Lead> = {
    enableDragAndDrop: false,
    enableSelection: false,
    enablePagination: true,
    enableColumnVisibility: false,
    enableSorting: ["name", "email"], // Only allow sorting on name and email columns
    initialSorting: {
      columnKey: "name",
      direction: "asc"
    },
    enableTabs: true,
    tabs: [
      { value: "leads", label: "Leads" },
      { value: "proposals", label: "Proposals" },
    ],
    actions: [
      {
        label: "View Details",
        onClick: (lead) => console.log("View lead:", lead),
      }
    ],
    actionsAsButtons: true, // Enable button display mode
    addButtonLabel: "Add Lead",
    // onAddClick: () => console.log("Add new lead"),
    customColumnsLabel: "Customize Lead Columns",
    emptyStateMessage: "No leads found.",
    pageSize: 10,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div>
        <SectionCards cards={leadsCards} className="grid grid-cols-1 md:grid-cols-2 gap-6" />
      </div>

      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">Leads</div>
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
            Add Lead
          </Button>
        </div>
      </div>

      {/* Dynamic Data Table */}
      <DataTable
        data={filteredLeads}
        columns={leadsColumns}
        config={leadsConfig}
        onDataChange={(updatedData) => {
          console.log("Leads data updated:", updatedData)
          // Handle data updates here
        }}
      />
    </div>
  )
}