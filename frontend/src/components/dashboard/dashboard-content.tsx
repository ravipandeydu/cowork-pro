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
import { useLeads, useLeadStats } from "@/hooks/useLeads"
import { useProposals, useProposalStats } from "@/hooks/useProposals"
import { useCenters } from "@/hooks/useCenters"
import { useMemo } from "react"

export default function DashboardContent() {
  // Fetch real data from APIs
  const { data: leadsData, isLoading: leadsLoading } = useLeads()
  const { data: leadStats, isLoading: leadStatsLoading } = useLeadStats()
  const { data: proposalsData, isLoading: proposalsLoading } = useProposals()
  const { data: proposalStats, isLoading: proposalStatsLoading } = useProposalStats()
  const { data: centersData, isLoading: centersLoading } = useCenters()

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalLeads = Array.isArray(leadsData?.data) ? leadsData.data.length : 0
    const totalProposals = Array.isArray(proposalsData?.data) ? proposalsData.data.length : 0
    const activeProposals = Array.isArray(proposalsData?.data) 
      ? proposalsData.data.filter(p => p.status === 'sent' || p.status === 'viewed').length 
      : 0
    
    // Calculate conversion rate (proposals / leads * 100)
    const conversionRate = totalLeads > 0 ? ((totalProposals / totalLeads) * 100).toFixed(1) : '0'
    
    // Calculate total revenue from approved proposals
    const totalRevenue = Array.isArray(proposalsData?.data)
      ? proposalsData.data.reduce((sum, proposal) => {
          if (proposal.status === 'approved') {
            return sum + (proposal.pricing?.totalAmount || 0)
          }
          return sum
        }, 0)
      : 0

    return {
      totalLeads,
      totalRevenue,
      conversionRate,
      activeProposals
    }
  }, [leadsData, proposalsData])

  // Generate chart data from real data
  const chartData = useMemo(() => {
    // For now, we'll use dummy data for charts since we need historical data
    // In a real app, you'd have endpoints for analytics data
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

    return { barChartData, lineChartData }
  }, [])

  const isLoading = leadsLoading || proposalsLoading || leadStatsLoading || proposalStatsLoading
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
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.totalLeads.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total leads in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : `$${stats.totalRevenue.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              From approved proposals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : `${stats.conversionRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Proposals per lead
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.activeProposals}
            </div>
            <p className="text-xs text-muted-foreground">
              Sent or viewed proposals
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
            <BarChart data={chartData.barChartData}>
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
            <LineChart data={chartData.lineChartData}>
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
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading leads...</div>
            </div>
          ) : leadsData?.data && leadsData.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Business Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsData.data.slice(0, 5).map((lead) => (
                  <TableRow key={lead._id}>
                    <TableCell className="font-medium">{lead.company}</TableCell>
                    <TableCell>{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.businessType}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          lead.status === 'converted' ? 'default' : 
                          lead.status === 'contacted' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">No leads found</div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}