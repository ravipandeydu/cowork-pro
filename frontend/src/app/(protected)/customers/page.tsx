"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Search,
    Filter,
    Download,
    Plus,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Phone,
    Mail,
    MapPin,
} from "lucide-react"

// Mock data for customers
const customers = [
    {
        id: 1,
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "+1 (555) 123-4567",
        company: "Tech Solutions Inc.",
        location: "New York, NY",
        status: "Active",
        totalOrders: 12,
        totalSpent: "$15,420",
        lastOrder: "2024-01-15",
        joinDate: "2023-06-15",
    },
    {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.j@company.com",
        phone: "+1 (555) 987-6543",
        company: "Digital Marketing Pro",
        location: "Los Angeles, CA",
        status: "Active",
        totalOrders: 8,
        totalSpent: "$9,850",
        lastOrder: "2024-01-12",
        joinDate: "2023-08-22",
    },
    {
        id: 3,
        name: "Michael Brown",
        email: "m.brown@business.com",
        phone: "+1 (555) 456-7890",
        company: "Brown Enterprises",
        location: "Chicago, IL",
        status: "Inactive",
        totalOrders: 5,
        totalSpent: "$3,200",
        lastOrder: "2023-11-28",
        joinDate: "2023-04-10",
    },
    {
        id: 4,
        name: "Emily Davis",
        email: "emily.davis@startup.io",
        phone: "+1 (555) 321-0987",
        company: "Startup Innovations",
        location: "San Francisco, CA",
        status: "Active",
        totalOrders: 15,
        totalSpent: "$22,100",
        lastOrder: "2024-01-18",
        joinDate: "2023-03-05",
    },
    {
        id: 5,
        name: "Robert Wilson",
        email: "r.wilson@corp.com",
        phone: "+1 (555) 654-3210",
        company: "Wilson Corporation",
        location: "Miami, FL",
        status: "Pending",
        totalOrders: 2,
        totalSpent: "$1,850",
        lastOrder: "2024-01-10",
        joinDate: "2024-01-05",
    },
]

export default function CustomersPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    const filteredCustomers = customers.filter((customer) => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.company.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || customer.status.toLowerCase() === statusFilter.toLowerCase()
        return matchesSearch && matchesStatus
    })

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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-600">Manage your customer relationships and data</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customers.length}</div>
                        <p className="text-xs text-muted-foreground">+2 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {customers.filter(c => c.status === "Active").length}
                        </div>
                        <p className="text-xs text-muted-foreground">80% of total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$52,420</div>
                        <p className="text-xs text-muted-foreground">+12% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$1,248</div>
                        <p className="text-xs text-muted-foreground">+5% from last month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Filter className="h-4 w-4 mr-2" />
                                Status: {statusFilter === "all" ? "All" : statusFilter}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                                All Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                                Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                                Inactive
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                                Pending
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
            </div>

            {/* Customers Table */}
            <Card className="p-0">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Orders</TableHead>
                                <TableHead>Total Spent</TableHead>
                                <TableHead>Last Order</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-600">
                                                    {customer.name.split(" ").map(n => n[0]).join("")}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium">{customer.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    Joined {new Date(customer.joinDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-3 w-3 text-gray-400" />
                                                {customer.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-3 w-3 text-gray-400" />
                                                {customer.phone}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{customer.company}</div>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <MapPin className="h-3 w-3" />
                                                {customer.location}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(customer.status)}>
                                            {customer.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{customer.totalOrders}</TableCell>
                                    <TableCell className="font-medium">{customer.totalSpent}</TableCell>
                                    <TableCell>{new Date(customer.lastOrder).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Customer
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Customer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                    Showing {filteredCustomers.length} of {customers.length} customers
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600">
                        1
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}