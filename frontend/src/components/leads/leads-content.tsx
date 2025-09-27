"use client"

import { useState } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6"
import { CiCirclePlus } from "react-icons/ci"
import { useRouter } from "next/navigation"

// Dummy data for leads
const leadsData = [
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

const getStatusColor = (status: string) => {
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="px-4 py-1">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Leads</p>
                <div className="text-3xl font-bold">4,050</div>
              </div>
              <div>
                <Badge variant="outline" className="text-xs">
                  <span className="mr-1"><FaArrowTrendDown /></span>
                  <span>-20%</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-1">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Acceptance Rate</p>
                <div className="text-3xl font-bold">89 %</div>
              </div>
              <div>
                <Badge variant="outline" className="text-xs">
                  <span className="mr-1"><FaArrowTrendUp /></span>
                  <span>+12.5%</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col gap-6">
        {/* Navigation Tabs */}
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

            <Button className="bg-black hover:bg-gray-800 text-white">
              <CiCirclePlus className="h-4 w-4 mr-2" />
              Create Proposal
            </Button>
          </div>
        </div>
        <div className="w-full">
          <Tabs defaultValue="leads">
            <TabsList>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger 
                value="proposals" 
                onClick={() => router.push('/proposals')}
              >
                Proposals
              </TabsTrigger>
            </TabsList>
            <TabsContent value="leads">
              {/* Leads Table */}
              <Card className="p-0">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-white">{lead.avatar}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{lead.name}</div>
                              <div className="text-sm text-muted-foreground">{lead.company}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {lead.email}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {lead.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {lead.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {lead.date}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Action
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>

                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}