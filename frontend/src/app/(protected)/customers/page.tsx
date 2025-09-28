"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Plus,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Building2,
    User,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    Search,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, BaseDataItem, DataTableConfig } from "@/components/data-table"
import { SectionCardData, SectionCards } from "@/components/section-cards"

// Customer interface extending BaseDataItem
interface Customer extends BaseDataItem {
    id: string | number
    name: string
    email: string
    phone: string
    company: string
    location: string
    status: "Active" | "Inactive" | "Pending"
    inventory: number
    date: string // This will be the main date field (replacing lastOrder)
    sdAmount: string // SD Amount field
    joinDate: string
    avatar: string
    // Keeping these for backward compatibility if needed
    totalOrders?: number
    totalSpent?: string
    lastOrder?: string
}

// Mock data for customers
const customersData: Customer[] = [
    {
        id: "1",
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "+1 (555) 123-4567",
        company: "Tech Solutions Inc.",
        location: "New York, NY",
        status: "Active",
        inventory: 150,
        date: "2024-01-15",
        sdAmount: "$2,500",
        joinDate: "2023-06-15",
        avatar: "JS",
        totalOrders: 12,
        totalSpent: "$15,420",
        lastOrder: "2024-01-15"
    },
    {
        id: "2",
        name: "Sarah Johnson",
        email: "sarah.j@company.com",
        phone: "+1 (555) 987-6543",
        company: "Digital Marketing Pro",
        location: "Los Angeles, CA",
        status: "Active",
        inventory: 89,
        date: "2024-01-12",
        sdAmount: "$1,850",
        joinDate: "2023-08-22",
        avatar: "SJ",
        totalOrders: 8,
        totalSpent: "$9,850",
        lastOrder: "2024-01-12"
    },
    {
        id: "3",
        name: "Michael Brown",
        email: "m.brown@business.com",
        phone: "+1 (555) 456-7890",
        company: "Brown Enterprises",
        location: "Chicago, IL",
        status: "Inactive",
        inventory: 45,
        date: "2023-11-28",
        sdAmount: "$750",
        joinDate: "2023-04-10",
        avatar: "MB",
        totalOrders: 5,
        totalSpent: "$3,200",
        lastOrder: "2023-11-28"
    },
    {
        id: "4",
        name: "Emily Davis",
        email: "emily.davis@startup.io",
        phone: "+1 (555) 321-0987",
        company: "Startup Innovations",
        location: "San Francisco, CA",
        status: "Active",
        inventory: 220,
        date: "2024-01-18",
        sdAmount: "$3,200",
        joinDate: "2023-03-05",
        avatar: "ED",
        totalOrders: 15,
        totalSpent: "$22,100",
        lastOrder: "2024-01-18"
    },
    {
        id: "5",
        name: "Robert Wilson",
        email: "r.wilson@corp.com",
        phone: "+1 (555) 654-3210",
        company: "Wilson Corporation",
        location: "Miami, FL",
        status: "Pending",
        inventory: 32,
        date: "2024-01-10",
        sdAmount: "$950",
        joinDate: "2024-01-05",
        avatar: "RW",
        totalOrders: 2,
        totalSpent: "$1,850",
        lastOrder: "2024-01-10"
    },
]

const customersCards: SectionCardData[] = [
    {
        id: "total-customers",
        title: "Total Customers",
        value: "2,847",
        description: "Total Customers",
        trend: {
            value: "+12%",
            isPositive: true,
        },
    },
    {
        id: "active-customers",
        title: "Active Customers",
        value: "2,432",
        description: "Active Customers",
        trend: {
            value: "+12%",
            isPositive: true,
        },
    },
    {
        id: "bookings",
        title: "Bookings",
        value: "45,678",
        description: "Bookings",
        trend: {
            value: "+2.1%",
            isPositive: true,
        },
    },
    {
        id: "occupancy-rate",
        title: "Occupancy Rate",
        value: "85%",
        description: "Occupancy Rate",
        trend: {
            value: "+8.7%",
            isPositive: true,
        },
    },
]

function getStatusColor(status: string) {
    switch (status) {
        case 'Active':
            return 'bg-green-100 text-green-800'
        case 'Inactive':
            return 'bg-red-100 text-red-800'
        case 'Pending':
            return 'bg-yellow-100 text-yellow-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

// Column definitions for customers table
const customersColumns: ColumnDef<Customer>[] = [
    {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{row.original.avatar}</span>
                </div>
                <div>
                    <div className="font-medium">{row.original.name}</div>
                    <div className="text-sm text-muted-foreground">{row.original.company}</div>
                </div>
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
        accessorKey: "inventory",
        header: "Inventory",
        cell: ({ row }) => (
            <div className="font-medium">{row.original.inventory}</div>
        ),
    },
    {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => (
            <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
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
                {new Date(row.original.date).toLocaleDateString()}
            </div>
        ),
    },
    {
        accessorKey: "sdAmount",
        header: "SD Amount",
        cell: ({ row }) => (
            <div className="font-medium">{row.original.sdAmount}</div>
        ),
    },
]

export default function CustomersPage() {
    // Search state
    const [searchTerm, setSearchTerm] = useState("")

    // Filter customers based on search term
    const filteredCustomers = customersData.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    )

    // Configuration for customers table
    const customersConfig: DataTableConfig<Customer> = {
        enableDragAndDrop: false,
        enableSelection: false,
        enablePagination: true,
        enableColumnVisibility: false,
        enableSorting: ["date"], // Allow sorting on name, email, and location columns
        enableTabs: true,
        // tabs: [
        //     { value: "customers", label: "Customers" },
        //     { value: "analytics", label: "Analytics" },
        // ],
        actions: [
            {
                label: "View Details",
                onClick: (customer) => console.log("View customer:", customer),
            },
            {
                label: "Edit Customer",
                onClick: (customer) => console.log("Edit customer:", customer),
            },
            {
                label: "Delete Customer",
                onClick: (customer) => console.log("Delete customer:", customer),
                variant: "destructive"
            }
        ],
        actionsAsButtons: false, // Enable button display mode
        addButtonLabel: "Add Customer",
        // onAddClick: () => console.log("Add new customer"),
        customColumnsLabel: "Customize Customer Columns",
        emptyStateMessage: "No customers found.",
        pageSize: 10,
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800"
            case "inactive":
                return "bg-gray-100 text-gray-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "default"
            case "inactive":
                return "secondary"
            case "pending":
                return "outline"
            default:
                return "default"
        }
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div>
                <SectionCards cards={customersCards} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search customers..."
                            className="pl-10 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                data={filteredCustomers}
                columns={customersColumns}
                config={customersConfig}
            />
        </div>
    )
}