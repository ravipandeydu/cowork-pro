"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, BaseDataItem, DataTableConfig } from "./data-table"

// Example data types
interface Lead extends BaseDataItem {
  id: string
  name: string
  email: string
  status: "new" | "contacted" | "qualified" | "closed"
  value: number
  createdAt: string
}

interface Proposal extends BaseDataItem {
  id: string
  title: string
  client: string
  status: "draft" | "sent" | "approved" | "rejected"
  amount: number
  deadline: string
}

// Sample data
const leadsData: Lead[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    status: "new",
    value: 5000,
    createdAt: "2024-01-15"
  },
  {
    id: "2", 
    name: "Jane Smith",
    email: "jane@example.com",
    status: "qualified",
    value: 12000,
    createdAt: "2024-01-10"
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com", 
    status: "contacted",
    value: 8000,
    createdAt: "2024-01-12"
  }
]

const proposalsData: Proposal[] = [
  {
    id: "1",
    title: "Website Redesign",
    client: "Acme Corp",
    status: "sent",
    amount: 25000,
    deadline: "2024-02-15"
  },
  {
    id: "2",
    title: "Mobile App Development", 
    client: "Tech Solutions",
    status: "draft",
    amount: 45000,
    deadline: "2024-03-01"
  },
  {
    id: "3",
    title: "E-commerce Platform",
    client: "Retail Plus",
    status: "approved", 
    amount: 75000,
    deadline: "2024-04-30"
  }
]

// Column definitions for leads
const leadsColumns: ColumnDef<Lead>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email", 
    header: "Email",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variants = {
        new: "default",
        contacted: "secondary", 
        qualified: "outline",
        closed: "destructive"
      } as const
      
      return (
        <Badge variant={variants[status as keyof typeof variants]}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => {
      const value = row.getValue("value") as number
      return `$${value.toLocaleString()}`
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
  },
]

// Column definitions for proposals
const proposalsColumns: ColumnDef<Proposal>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "client",
    header: "Client", 
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variants = {
        draft: "secondary",
        sent: "default",
        approved: "outline", 
        rejected: "destructive"
      } as const
      
      return (
        <Badge variant={variants[status as keyof typeof variants]}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number
      return `$${amount.toLocaleString()}`
    },
  },
  {
    accessorKey: "deadline",
    header: "Deadline",
  },
]

export function DataTableExample() {
  const [activeExample, setActiveExample] = React.useState<"leads" | "proposals">("leads")

  // Configuration for leads table
  const leadsConfig: DataTableConfig<Lead> = {
    enableDragAndDrop: true,
    enableSelection: true,
    enablePagination: true,
    enableColumnVisibility: true,
    enableTabs: false,
    actions: [
      {
        label: "Edit",
        onClick: (lead) => console.log("Edit lead:", lead),
      },
      {
        label: "Contact",
        onClick: (lead) => console.log("Contact lead:", lead),
      },
      {
        label: "Delete",
        onClick: (lead) => console.log("Delete lead:", lead),
        variant: "destructive",
      },
    ],
    addButtonLabel: "Add Lead",
    onAddClick: () => console.log("Add new lead"),
    customColumnsLabel: "Customize Lead Columns",
    emptyStateMessage: "No leads found.",
    pageSize: 5,
  }

  // Configuration for proposals table
  const proposalsConfig: DataTableConfig<Proposal> = {
    enableDragAndDrop: false,
    enableSelection: true,
    enablePagination: true,
    enableColumnVisibility: true,
    enableTabs: true,
    tabs: [
      { value: "all", label: "All Proposals", badge: proposalsData.length },
      { value: "draft", label: "Drafts", badge: proposalsData.filter(p => p.status === "draft").length },
      { value: "sent", label: "Sent", badge: proposalsData.filter(p => p.status === "sent").length },
      { value: "approved", label: "Approved", badge: proposalsData.filter(p => p.status === "approved").length },
    ],
    defaultTab: "all",
    actions: [
      {
        label: "View",
        onClick: (proposal) => console.log("View proposal:", proposal),
      },
      {
        label: "Edit",
        onClick: (proposal) => console.log("Edit proposal:", proposal),
      },
      {
        label: "Duplicate",
        onClick: (proposal) => console.log("Duplicate proposal:", proposal),
      },
      {
        label: "Delete",
        onClick: (proposal) => console.log("Delete proposal:", proposal),
        variant: "destructive",
      },
    ],
    addButtonLabel: "Create Proposal",
    onAddClick: () => console.log("Create new proposal"),
    customColumnsLabel: "Customize Proposal Columns",
    emptyStateMessage: "No proposals found.",
    pageSize: 10,
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dynamic Data Table Examples</h1>
        <div className="flex gap-2">
          <Button
            variant={activeExample === "leads" ? "default" : "outline"}
            onClick={() => setActiveExample("leads")}
          >
            Leads Example
          </Button>
          <Button
            variant={activeExample === "proposals" ? "default" : "outline"}
            onClick={() => setActiveExample("proposals")}
          >
            Proposals Example
          </Button>
        </div>
      </div>

      {activeExample === "leads" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Leads Management</h2>
            <p className="text-muted-foreground">
              This example shows a leads table with drag-and-drop reordering, row selection, 
              custom actions, and pagination.
            </p>
          </div>
          <DataTable
            data={leadsData}
            columns={leadsColumns}
            config={leadsConfig}
            onDataChange={(newData) => console.log("Leads data changed:", newData)}
          />
        </div>
      )}

      {activeExample === "proposals" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Proposals Management</h2>
            <p className="text-muted-foreground">
              This example shows a proposals table with tabs, row selection, custom actions, 
              and column visibility controls.
            </p>
          </div>
          <DataTable
            data={proposalsData}
            columns={proposalsColumns}
            config={proposalsConfig}
            onDataChange={(newData) => console.log("Proposals data changed:", newData)}
          />
        </div>
      )}
    </div>
  )
}