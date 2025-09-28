"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Plus, Trash2, Upload, FileText, Calendar, DollarSign, User, Building2, Mail, Phone, MapPin, ArrowRight, CheckCircle, Search, Copy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Stepper, Step } from "@/components/ui/stepper"
import { Badge } from "@/components/ui/badge"

// Hub Centre interface for selection
interface HubCentre {
  id: string
  name: string
  address: string
  location: string
  image: string
}

// Zod schema for offer details validation
const offerDetailsSchema = z.object({
  moveInDate: z.string().min(1, "Move-in date is required"),
  lockIn: z.string().min(1, "Lock-in period is required"),
  noticePeriod: z.string().min(1, "Notice period is required"),
  advanceRent: z.string().min(1, "Advance rent is required"),
  standardPricePrivateCabin: z.string().optional(),
  standardPriceOpenDedicatedDesk: z.string().optional(),
  noRegretOfferedPriceOpenDesk: z.string().optional(),
  offeredPrintingCredits: z.string().optional(),
  parking2Wheeler: z.string().optional(),
  parking4Wheeler: z.string().optional(),
  offeredConferenceRoomCredits: z.string().optional(),
  additionalConferenceRoomCharges: z.string().optional(),
})

type OfferDetailsFormData = z.infer<typeof offerDetailsSchema>

// Mock hub centres data
const mockHubCentres: HubCentre[] = [
  {
    id: "1",
    name: "Godrej W2GHI",
    address: "Mg Road, Imperia",
    location: "Chandigarh",
    image: "/api/placeholder/300/200"
  },
  {
    id: "2",
    name: "Elante Mall",
    address: "Industrial Area Phase I",
    location: "Chandigarh",
    image: "/api/placeholder/300/200"
  },
  {
    id: "3",
    name: "Pune",
    address: "Baner Road, Pune",
    location: "Maharashtra",
    image: "/api/placeholder/300/200"
  },
  {
    id: "4",
    name: "BPTP",
    address: "Sector 37D, Gurgaon",
    location: "Gurugram",
    image: "/api/placeholder/300/200"
  }
]

// Customer interface for selection
interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  location: string
  avatar: string
}

// Mock customer data (in a real app, this would come from an API)
const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Neha Kapoor",
    email: "neha.kapoor@gmail.com",
    phone: "+1 (555) 123-4567",
    company: "WorkNest Spaces",
    location: "New York, NY",
    avatar: "NK"
  },
  {
    id: "2",
    name: "Ananya Iyer",
    email: "ananya.iyer@gmail.com",
    phone: "+1 (555) 987-6543",
    company: "CollabSquare",
    location: "Los Angeles, CA",
    avatar: "AI"
  },
  {
    id: "3",
    name: "Daniel Cohen",
    email: "daniel.cohen@gmail.com",
    phone: "+1 (555) 456-7890",
    company: "WorkNest Spaces",
    location: "Chicago, IL",
    avatar: "DC"
  },
  {
    id: "4",
    name: "Rohani Desai",
    email: "rohani.desai@gmail.com",
    phone: "+1 (555) 321-0987",
    company: "CollabSquare",
    location: "San Francisco, CA",
    avatar: "RD"
  },
  {
    id: "5",
    name: "Ananya Iyer",
    email: "ananya.iyer@gmail.com",
    phone: "+1 (555) 654-3210",
    company: "WorkNest Spaces",
    location: "Miami, FL",
    avatar: "AI"
  },
  {
    id: "6",
    name: "Ayush Gupta",
    email: "ayush.gupta09@gmail.com",
    phone: "+1 (555) 789-0123",
    company: "WorkNest Spaces",
    location: "Austin, TX",
    avatar: "AG"
  }
]

interface ProposalFormData {
  // Selected Customer
  selectedCustomer: Customer | null

  // Selected Hub Centres
  selectedHubCentres: HubCentre[]

  // Client Information (will be populated from selected customer)
  clientName: string
  clientEmail: string
  clientPhone: string
  clientCompany: string
  clientAddress: string

  // Offer Details
  moveInDate: string
  lockIn: string
  noticePeriod: string
  advanceRent: string
  standardPricePrivateCabin: string
  standardPriceOpenDedicatedDesk: string
  noRegretOfferedPriceOpenDesk: string
  offeredPrintingCredits: string
  parking2Wheeler: string
  parking4Wheeler: string
  offeredConferenceRoomCredits: string
  additionalConferenceRoomCharges: string

  // Proposal Details
  proposalTitle: string
  proposalDescription: string
  proposalValue: string
  currency: string
  validUntil: string

  // Services/Items
  services: Array<{
    id: string
    name: string
    description: string
    quantity: number
    rate: number
    amount: number
  }>

  // Terms & Conditions
  terms: string
  notes: string
}

const initialFormData: ProposalFormData = {
  selectedCustomer: null,
  selectedHubCentres: [],
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  clientCompany: "",
  clientAddress: "",
  moveInDate: "",
  lockIn: "",
  noticePeriod: "",
  advanceRent: "",
  standardPricePrivateCabin: "",
  standardPriceOpenDedicatedDesk: "",
  noRegretOfferedPriceOpenDesk: "",
  offeredPrintingCredits: "",
  parking2Wheeler: "",
  parking4Wheeler: "",
  offeredConferenceRoomCredits: "",
  additionalConferenceRoomCharges: "",
  proposalTitle: "",
  proposalDescription: "",
  proposalValue: "",
  currency: "USD",
  validUntil: "",
  services: [
    {
      id: "1",
      name: "",
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    }
  ],
  terms: "",
  notes: ""
}

export default function CreateProposalContent() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<ProposalFormData>(initialFormData)
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)

  // React Hook Form for offer details (step 3)
  const offerForm = useForm<OfferDetailsFormData>({
    resolver: zodResolver(offerDetailsSchema),
    defaultValues: {
      moveInDate: "",
      lockIn: "",
      noticePeriod: "",
      advanceRent: "",
      standardPricePrivateCabin: "",
      standardPriceOpenDedicatedDesk: "",
      noRegretOfferedPriceOpenDesk: "",
      offeredPrintingCredits: "",
      parking2Wheeler: "",
      parking4Wheeler: "",
      offeredConferenceRoomCredits: "",
      additionalConferenceRoomCharges: "",
    }
  })

  // Filter customers based on search term
  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(customerSearchTerm.toLowerCase())
  )

  const steps: Step[] = [
    {
      id: "client",
      title: "Client Information",
      // description: "Basic client details",
      status: currentStep === 0 ? "active" : currentStep > 0 ? "completed" : "inactive",
      icon: <User className="h-4 w-4" />
    },
    {
      id: "hubcentres",
      title: "Select Hub Centres",
      description: "Choose hub centres",
      status: currentStep === 1 ? "active" : currentStep > 1 ? "completed" : "inactive",
      icon: <Building2 className="h-4 w-4" />
    },
    {
      id: "offer-details",
      title: "Offer Details",
      description: "Add offer details",
      status: currentStep === 2 ? "active" : currentStep > 2 ? "completed" : "inactive",
      icon: <FileText className="h-4 w-4" />
    }
  ]

  const updateFormData = (field: keyof ProposalFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Function to handle customer selection
  const selectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      selectedCustomer: customer,
      clientName: customer.name,
      clientEmail: customer.email,
      clientPhone: customer.phone,
      clientCompany: customer.company,
      clientAddress: customer.location
    }))
    setCustomerSearchTerm("")
  }

  // Function to handle hub centre selection
  const toggleHubCentre = (hubCentre: HubCentre) => {
    setFormData(prev => {
      const isSelected = prev.selectedHubCentres.some(centre => centre.id === hubCentre.id)
      if (isSelected) {
        return {
          ...prev,
          selectedHubCentres: prev.selectedHubCentres.filter(centre => centre.id !== hubCentre.id)
        }
      } else {
        return {
          ...prev,
          selectedHubCentres: [...prev.selectedHubCentres, hubCentre]
        }
      }
    })
  }

  const addService = () => {
    const newService = {
      id: Date.now().toString(),
      name: "",
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }))
  }

  const removeService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== id)
    }))
  }

  const updateService = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(service => {
        if (service.id === id) {
          const updated = { ...service, [field]: value }
          if (field === 'quantity' || field === 'rate') {
            updated.amount = updated.quantity * updated.rate
          }
          return updated
        }
        return service
      })
    }))
  }

  const getTotalAmount = () => {
    return formData.services.reduce((total, service) => total + service.amount, 0)
  }

  const handleNext = () => {
    // Validate customer selection on first step
    if (currentStep === 0 && !formData.selectedCustomer) {
      alert("Please select a customer before proceeding to the next step.")
      return
    }

    // Validate hub centres selection on second step
    if (currentStep === 1 && formData.selectedHubCentres.length === 0) {
      alert("Please select at least one hub centre before proceeding.")
      return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    // Validate offer details form using react-hook-form
    const isValid = await offerForm.trigger()

    if (!isValid) {
      // Show first validation error
      const errors = offerForm.formState.errors
      const firstError = Object.values(errors)[0]
      if (firstError?.message) {
        alert(firstError.message)
      }
      return
    }

    // Get form values and merge with existing form data
    const offerData = offerForm.getValues()
    const finalFormData = {
      ...formData,
      ...offerData
    }

    console.log("Proposal submitted:", finalFormData)
    // Show PDF viewer instead of redirecting
    setShowPdfViewer(true)
  }

  // Function to copy link to clipboard
  const copyLinkToClipboard = () => {
    const proposalLink = "https://proposal.ia.co/#FMfcg"
    navigator.clipboard.writeText(proposalLink).then(() => {
      // You could add a toast notification here
      console.log("Link copied to clipboard")
    })
  }

  // Function to handle sending proposal
  const handleSendProposal = () => {
    // In a real app, this would send the proposal via email
    console.log("Sending proposal to:", formData.clientEmail)
    setShowSuccessModal(false)
    // Optionally redirect to proposals list or show another confirmation
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {/* Customer Search Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Select Customer/Company *
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers here..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Customer List */}
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {filteredCustomers.length > 0 ? (
                  <div className="divide-y">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${formData.selectedCustomer?.id === customer.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                          }`}
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {customer.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{customer.company}</h4>
                              {formData.selectedCustomer?.id === customer.id && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {customer.name} • {customer.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No customers found</p>
                  </div>
                )}
              </div>

              {/* Selected Customer Display */}
              {formData.selectedCustomer && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {formData.selectedCustomer.avatar}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-primary">Selected: {formData.selectedCustomer.company}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formData.selectedCustomer.name} • {formData.selectedCustomer.email}
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                </div>
              )}
            </div>

            {/* Client Information (Auto-filled from selected customer) */}
            {formData.selectedCustomer && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Client Name *
                    </Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => updateFormData("clientName", e.target.value)}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientCompany" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company
                    </Label>
                    <Input
                      id="clientCompany"
                      value={formData.clientCompany}
                      onChange={(e) => updateFormData("clientCompany", e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email *
                    </Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => updateFormData("clientEmail", e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    <Input
                      id="clientPhone"
                      value={formData.clientPhone}
                      onChange={(e) => updateFormData("clientPhone", e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="clientAddress" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </Label>
                    <Textarea
                      id="clientAddress"
                      value={formData.clientAddress}
                      onChange={(e) => updateFormData("clientAddress", e.target.value)}
                      placeholder="Enter client address"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Select Hub Centres
                </Label>
                <p className="text-sm text-muted-foreground">
                  Choose hub centres for your proposal (optional)
                </p>
              </div>

              {/* Hub Centres Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockHubCentres.map((hubCentre) => {
                  const isSelected = formData.selectedHubCentres.some(centre => centre.id === hubCentre.id)
                  return (
                    <Card
                      key={hubCentre.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                      onClick={() => toggleHubCentre(hubCentre)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Image */}
                          <div className="relative h-32 bg-muted rounded-lg overflow-hidden">
                            <img
                              src={hubCentre.image}
                              alt={hubCentre.name}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="h-5 w-5 text-primary bg-white rounded-full" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="space-y-1">
                            <h3 className="font-semibold text-sm">{hubCentre.name}</h3>
                            <p className="text-xs text-muted-foreground">{hubCentre.location}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {hubCentre.address}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Selected Hub Centres Summary */}
              {formData.selectedHubCentres.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Hub Centres:</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedHubCentres.map((centre) => (
                      <Badge key={centre.id} variant="secondary" className="text-xs">
                        {centre.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      case 2:
        return (
          <form onSubmit={offerForm.handleSubmit(() => { })}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Offer Details</h3>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="moveInDate">Move-in Date *</Label>
                        <Input
                          id="moveInDate"
                          type="date"
                          {...offerForm.register("moveInDate")}
                          placeholder="Enter your input here..."
                        />
                        {offerForm.formState.errors.moveInDate && (
                          <p className="text-sm text-red-500">{offerForm.formState.errors.moveInDate.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="noticePeriod">Notice Period *</Label>
                        <Input
                          id="noticePeriod"
                          {...offerForm.register("noticePeriod")}
                          placeholder="Enter your input here..."
                        />
                        {offerForm.formState.errors.noticePeriod && (
                          <p className="text-sm text-red-500">{offerForm.formState.errors.noticePeriod.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="standardPricePrivateCabin">Standard Price (Private Cabin)</Label>
                        <Input
                          id="standardPricePrivateCabin"
                          {...offerForm.register("standardPricePrivateCabin")}
                          placeholder="Enter your input here..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="noRegretOfferedPriceOpenDesk">No Regret Offered Price (Open Desk)</Label>
                        <Input
                          id="noRegretOfferedPriceOpenDesk"
                          {...offerForm.register("noRegretOfferedPriceOpenDesk")}
                          placeholder="Enter your input here..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parking2Wheeler">Parking 2 Wheeler</Label>
                        <Input
                          id="parking2Wheeler"
                          {...offerForm.register("parking2Wheeler")}
                          placeholder="Enter your input here..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="offeredConferenceRoomCredits">Offered Conference & Meeting Room Credits (included)</Label>
                        <Input
                          id="offeredConferenceRoomCredits"
                          {...offerForm.register("offeredConferenceRoomCredits")}
                          placeholder="Enter your input here..."
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="lockIn">Lock-in *</Label>
                        <Input
                          id="lockIn"
                          {...offerForm.register("lockIn")}
                          placeholder="Enter your input here..."
                        />
                        {offerForm.formState.errors.lockIn && (
                          <p className="text-sm text-red-500">{offerForm.formState.errors.lockIn.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="advanceRent">Advance Rent *</Label>
                        <Input
                          id="advanceRent"
                          {...offerForm.register("advanceRent")}
                          placeholder="Enter your input here..."
                        />
                        {offerForm.formState.errors.advanceRent && (
                          <p className="text-sm text-red-500">{offerForm.formState.errors.advanceRent.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="standardPriceOpenDedicatedDesk">Standard Price (Open Dedicated Desk)</Label>
                        <Input
                          id="standardPriceOpenDedicatedDesk"
                          {...offerForm.register("standardPriceOpenDedicatedDesk")}
                          placeholder="Enter your input here..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="offeredPrintingCredits">Offered Printing Credits (B/W)</Label>
                        <Input
                          id="offeredPrintingCredits"
                          {...offerForm.register("offeredPrintingCredits")}
                          placeholder="Enter your input here..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parking4Wheeler">Parking 4 Wheeler</Label>
                        <Input
                          id="parking4Wheeler"
                          {...offerForm.register("parking4Wheeler")}
                          placeholder="Enter your input here..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="additionalConferenceRoomCharges">Charges for additional Conference Room usage</Label>
                        <Input
                          id="additionalConferenceRoomCharges"
                          {...offerForm.register("additionalConferenceRoomCharges")}
                          placeholder="Enter your input here..."
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {showSuccessModal ? (
          // Success Modal UI
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              {/* Modal Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Great Job!</h2>
                <p className="text-gray-600">Your proposal is ready</p>
              </div>

              {/* Email Section */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">Directly email the proposal to your client.</p>

                {/* Client Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">WorkNest Innovations</h4>
                    <p className="text-sm text-gray-600">Neha Kapoor</p>
                  </div>
                </div>

                {/* Email Input */}
                <div className="relative mb-4">
                  <Input
                    type="email"
                    value={formData.clientEmail || "neha.kapoor@gmail.com"}
                    readOnly
                    className="pr-10"
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>

                {/* OR Divider */}
                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-3 text-sm text-gray-500">OR COPY LINK</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {/* Copy Link */}
                <div className="relative mb-6">
                  <Input
                    type="text"
                    value="https://proposal.ia.co/#FMfcg"
                    readOnly
                    className="pr-10"
                  />
                  <button
                    onClick={copyLinkToClipboard}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                {/* Send Proposal Button */}
                <Button
                  onClick={handleSendProposal}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  Send Proposal
                </Button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : showPdfViewer ? (
          // PDF Viewer UI
          <div className="bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowPdfViewer(false)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Proposal</span>
                </button>
                <h2 className="text-xl font-semibold">Proposal Preview</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Download PDF
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700" onClick={() => {
                  // Show success modal instead of PDF viewer
                  setShowSuccessModal(true)
                }}>
                  Send Proposal
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="p-4">
              <div className="bg-gray-100 rounded-lg p-4 min-h-[600px] flex items-center justify-center">
                <object
                  data="/resume-sample.pdf"
                  type="application/pdf"
                  className="w-full h-[600px] border-0 rounded"
                  title="Proposal PDF"
                >
                  <embed
                    src="/resume-sample.pdf"
                    type="application/pdf"
                    className="w-full h-[600px] border-0 rounded"
                  />
                  <div className="flex flex-col items-center justify-center h-full text-gray-600">
                    <p className="mb-4">Unable to display PDF file.</p>
                    <a
                      href="/resume-sample.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Download PDF
                    </a>
                  </div>
                </object>
              </div>
            </div>
          </div>
        ) : (
          // Original Stepper UI
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Proposal</h1>
                <p className="text-gray-600">Follow the steps below to create a professional proposal</p>
              </div>

              {/* Stepper */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <Stepper steps={steps} className="mb-0" />
                </CardContent>
              </Card>
            </div>

            {/* Form Content */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                {renderStepContent()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-3">
                {currentStep < 2 ? (
                  <Button
                    onClick={handleNext}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Generate Proposal
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}