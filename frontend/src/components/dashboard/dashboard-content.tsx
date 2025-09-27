"use client"

import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  FileText,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts"

// Dummy data for charts
const barChartData = [
  { name: "Jan", value: 400, leads: 240 },
  { name: "Feb", value: 300, leads: 139 },
  { name: "Mar", value: 200, leads: 980 },
  { name: "Apr", value: 278, leads: 390 },
  { name: "May", value: 189, leads: 480 },
  { name: "Jun", value: 239, leads: 380 },
]

const lineChartData = [
  { name: "Week 1", proposals: 65, conversions: 28 },
  { name: "Week 2", proposals: 59, conversions: 48 },
  { name: "Week 3", proposals: 80, conversions: 40 },
  { name: "Week 4", proposals: 81, conversions: 19 },
  { name: "Week 5", proposals: 56, conversions: 96 },
  { name: "Week 6", proposals: 55, conversions: 27 },
]

// Dummy data for table
const tableData = [
  {
    id: "1",
    company: "Tech Corp",
    contact: "John Smith",
    email: "john@techcorp.com",
    phone: "+1 234-567-8900",
    location: "New York",
    status: "Active",
    value: "$25,000",
    date: "2024-01-15"
  },
  {
    id: "2",
    company: "StartupXYZ",
    contact: "Sarah Johnson",
    email: "sarah@startupxyz.com",
    phone: "+1 234-567-8901",
    location: "San Francisco",
    status: "Pending",
    value: "$15,000",
    date: "2024-01-14"
  },
  {
    id: "3",
    company: "Global Inc",
    contact: "Mike Wilson",
    email: "mike@globalinc.com",
    phone: "+1 234-567-8902",
    location: "Chicago",
    status: "Closed",
    value: "$45,000",
    date: "2024-01-13"
  },
  {
    id: "4",
    company: "Innovation Labs",
    contact: "Emily Davis",
    email: "emily@innovationlabs.com",
    phone: "+1 234-567-8903",
    location: "Austin",
    status: "Active",
    value: "$30,000",
    date: "2024-01-12"
  },
  {
    id: "5",
    company: "Future Systems",
    contact: "David Brown",
    email: "david@futuresystems.com",
    phone: "+1 234-567-8904",
    location: "Seattle",
    status: "Pending",
    value: "$20,000",
    date: "2024-01-11"
  }
]

export default function DashboardContent() {
  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23.5%</div>
            <p className="text-xs text-muted-foreground">
              +3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
                <Bar dataKey="leads" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="proposals" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.company}</TableCell>
                  <TableCell>{row.contact}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>{row.location}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        row.status === 'Active' ? 'default' : 
                        row.status === 'Pending' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.value}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}