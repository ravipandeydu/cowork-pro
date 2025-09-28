"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, FileText, User, Building2, Mail, ArrowRight, CheckCircle, Search, Copy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, } from "@/components/ui/card"
import { Stepper, Step } from "@/components/ui/stepper"
import { Badge } from "@/components/ui/badge"
import { useLeads } from "@/hooks/useLeads"
import { Lead } from "@/services/leads"
import { useCenters } from "@/hooks/useCenters"
import { Center } from "@/services/centers"
import { useCreateProposal, useSendProposal } from "@/hooks/useProposals"
import { pdfGeneratorService } from "@/services/pdfGenerator"

// Hub Centre interface for selection (mapped from Center)
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



// Customer interface for selection (mapped from Lead)
interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  location?: string
  avatar: string
  businessType?: string
  status?: string
}

// Remove the mock customers array as we're now using real lead data

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
  const [hubCentreSearchTerm, setHubCentreSearchTerm] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null)

  // Mutations
  const createProposalMutation = useCreateProposal()
  const sendProposalMutation = useSendProposal()

  // Fetch leads data
  const { data: leadsData, isLoading: leadsLoading, error: leadsError } = useLeads()

  // Fetch centers data
  const { data: centersData, isLoading: centersLoading, error: centersError } = useCenters()

  // Transform leads to customer format
  const customers: Customer[] = leadsData?.data ? leadsData.data.leads.map((lead: Lead) => ({
    id: lead._id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    location: `${lead.businessType} - ${lead.businessSize}`, // Use business info as location
    avatar: lead.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    businessType: lead.businessType,
    status: lead.status
  })) : []

  // Transform centers to hub centre format
  const hubCentres: HubCentre[] = centersData?.data ? centersData.data.centers.map((center: Center) => ({
    id: center._id,
    name: center.name,
    address: `${center.address.street}, ${center.address.city}`,
    location: `${center.address.city}, ${center.address.state}`,
    image: center.images && center.images.length > 0 ? center.images[0] : "/api/placeholder/300/200"
  })) : []

  // Filter hub centres based on search term
  const filteredHubCentres = hubCentres.filter(centre =>
    centre.name.toLowerCase().includes(hubCentreSearchTerm.toLowerCase()) ||
    centre.location.toLowerCase().includes(hubCentreSearchTerm.toLowerCase())
  )

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
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(customerSearchTerm.toLowerCase())
  )

  const steps: Step[] = [
    {
      id: "client",
      title: "Client Information",
      status: currentStep === 0 ? "active" : currentStep > 0 ? "completed" : "inactive",
      icon: <User className="h-4 w-4" />
    },
    {
      id: "hubcentres",
      title: "Select Hub Centres",
      status: currentStep === 1 ? "active" : currentStep > 1 ? "completed" : "inactive",
      icon: <Building2 className="h-4 w-4" />
    },
    {
      id: "offer-details",
      title: "Offer Details",
      status: currentStep === 2 ? "active" : currentStep > 2 ? "completed" : "inactive",
      icon: <FileText className="h-4 w-4" />
    }
  ]

  // Function to handle customer selection
  const selectCustomer = (customer: Customer) => {
    setFormData(prev => {
      // If the same customer is already selected, deselect them
      if (prev.selectedCustomer?.id === customer.id) {
        return {
          ...prev,
          selectedCustomer: null,
          clientName: "",
          clientEmail: "",
          clientPhone: "",
          clientCompany: "",
          clientAddress: ""
        }
      }
      // Otherwise, select the new customer
      return {
        ...prev,
        selectedCustomer: customer,
        clientName: customer.name,
        clientEmail: customer.email,
        clientPhone: customer.phone,
        clientCompany: customer.company,
        clientAddress: customer.location || ""
      }
    })
    
    // Update search term based on selection
    setCustomerSearchTerm(prev => {
      if (formData.selectedCustomer?.id === customer.id) {
        return "" // Clear search term when deselecting
      }
      return `${customer.name}` // Set customer name when selecting
    })
  }

  // Function to handle hub centre selection
  const toggleHubCentre = (hubCentre: HubCentre) => {
    setFormData(prev => {
      const isSelected = prev.selectedHubCentres.some(centre => centre.id === hubCentre.id)
      if (isSelected) {
        // When deselecting, clear the search term if this was the only selected center
        const remainingCentres = prev.selectedHubCentres.filter(centre => centre.id !== hubCentre.id)
        if (remainingCentres.length === 0) {
          setHubCentreSearchTerm("")
        } else {
          // Set search term to the first remaining selected center
          setHubCentreSearchTerm(remainingCentres[0].name)
        }
        return {
          ...prev,
          selectedHubCentres: remainingCentres
        }
      } else {
        // When selecting, update the search term to show the selected center
        setHubCentreSearchTerm(hubCentre.name)
        return {
          ...prev,
          selectedHubCentres: [...prev.selectedHubCentres, hubCentre]
        }
      }
    })
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

    // Validate required fields for proposal creation
    if (!finalFormData.selectedCustomer?.id) {
      alert("Please select a customer")
      return
    }

    if (!finalFormData.selectedHubCentres || finalFormData.selectedHubCentres.length === 0) {
      alert("Please select at least one coworking center")
      return
    }

    // Create proposal in backend first
    setIsGeneratingPdf(true)
    try {
      // Prepare proposal data according to CreateProposalRequest interface
      const proposalData = {
        leadId: finalFormData.selectedCustomer.id,
        centerId: finalFormData.selectedHubCentres[0].id, // Use first selected center
        title: `Proposal for ${finalFormData.clientCompany || finalFormData.selectedCustomer.company}`,
        selectedSeating: {
          hotDesks: parseInt(finalFormData.hotDesks) || 0,
          dedicatedDesks: parseInt(finalFormData.dedicatedDesks) || 0,
          privateCabins: parseInt(finalFormData.privateCabins) || 0,
          meetingRooms: parseInt(finalFormData.meetingRooms) || 0,
        },
        pricing: {
          baseAmount: parseFloat(finalFormData.totalAmount) || 0,
          discountPercentage: parseFloat(finalFormData.discountPercentage) || 0,
          taxPercentage: parseFloat(finalFormData.taxPercentage) || 0,
          breakdown: {
            hotDesks: {
              quantity: parseInt(finalFormData.hotDesks) || 0,
              rate: parseFloat(finalFormData.hotDeskRate) || 0,
              amount: (parseInt(finalFormData.hotDesks) || 0) * (parseFloat(finalFormData.hotDeskRate) || 0)
            },
            dedicatedDesks: {
              quantity: parseInt(finalFormData.dedicatedDesks) || 0,
              rate: parseFloat(finalFormData.dedicatedDeskRate) || 0,
              amount: (parseInt(finalFormData.dedicatedDesks) || 0) * (parseFloat(finalFormData.dedicatedDeskRate) || 0)
            },
            privateCabins: {
              quantity: parseInt(finalFormData.privateCabins) || 0,
              rate: parseFloat(finalFormData.privateCabinRate) || 0,
              amount: (parseInt(finalFormData.privateCabins) || 0) * (parseFloat(finalFormData.privateCabinRate) || 0)
            },
            meetingRooms: {
              quantity: parseInt(finalFormData.meetingRooms) || 0,
              rate: parseFloat(finalFormData.meetingRoomRate) || 0,
              amount: (parseInt(finalFormData.meetingRooms) || 0) * (parseFloat(finalFormData.meetingRoomRate) || 0)
            },
          },
        },
        terms: {
          duration: finalFormData.contractDuration || "monthly",
          startDate: finalFormData.startDate || new Date().toISOString().split('T')[0],
          endDate: finalFormData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paymentTerms: finalFormData.paymentTerms || "Net 30",
          cancellationPolicy: finalFormData.cancellationPolicy || "30 days notice required",
        },
        validUntil: finalFormData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: finalFormData.notes || "",
      }

      // Create the proposal
      const createdProposal = await createProposalMutation.mutateAsync(proposalData)
      setCreatedProposalId(createdProposal._id)

      // Generate PDF using the created proposal data
      const generatedPdfUrl = await pdfGeneratorService.generatePDFUrl(finalFormData)
      setPdfUrl(generatedPdfUrl)
      setShowPdfViewer(true)
    } catch (error) {
      console.error("Error creating proposal or generating PDF:", error)
      alert("Failed to create proposal. Please try again.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Function to handle PDF download
  const handleDownloadPDF = async () => {
    if (!pdfUrl) {
      // Generate PDF if not already generated
      setIsGeneratingPdf(true)
      try {
        const offerData = offerForm.getValues()
        const finalFormData = {
          ...formData,
          ...offerData
        }
        await pdfGeneratorService.downloadPDF(finalFormData, `proposal-${formData.clientCompany || 'draft'}.pdf`)
      } catch (error) {
        console.error("Error downloading PDF:", error)
        alert("Failed to download PDF. Please try again.")
      } finally {
        setIsGeneratingPdf(false)
      }
    } else {
      // Download existing PDF
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `proposal-${formData.clientCompany || 'draft'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Function to clean up PDF URL when component unmounts or PDF viewer closes
  const closePdfViewer = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    setShowPdfViewer(false)
  }

  // Function to handle sending proposal
  const handleSendProposal = async () => {
    if (!createdProposalId) {
      console.error("No proposal ID available for sending")
      return
    }

    try {
      await sendProposalMutation.mutateAsync({
        id: createdProposalId,
        data: {
          emailMessage: `Dear ${formData.clientName},\n\nPlease find attached our proposal for coworking space services.\n\nBest regards,\nCoworkPro Team`
        }
      })

      setShowSuccessModal(false)
      // Optionally redirect to proposals list or show another confirmation
      console.log("Proposal sent successfully to:", formData.clientEmail)
    } catch (error) {
      console.error("Failed to send proposal:", error)
    }
  }

  // Function to copy proposal link to clipboard
  const copyLinkToClipboard = async () => {
    try {
      const proposalLink = "https://proposal.ia.co/#FMfcg" // This would be dynamically generated in a real app
      await navigator.clipboard.writeText(proposalLink)
      // You could add a toast notification here to show success
      console.log("Proposal link copied to clipboard")
    } catch (error) {
      console.error("Failed to copy link to clipboard:", error)
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = "https://proposal.ia.co/#FMfcg"
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
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
                  Select Customer/Company *
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers here..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" className="px-4">
                    Add
                  </Button>
                </div>
              </div>

              {/* Customer List - Always visible */}
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
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Select Hub Centres *
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search hub centres here..."
                      className="pl-10"
                      value={hubCentreSearchTerm}
                      onChange={(e) => setHubCentreSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" className="px-4">
                    Add
                  </Button>
                </div>
              </div>

              {/* Hub Centres Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHubCentres.map((hubCentre) => {
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
                          <div className="relative h-48 bg-muted rounded-lg overflow-hidden">
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>


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
      <div className="w-full px-4 py-8">
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
                    <h4 className="font-medium text-gray-900">{formData.clientCompany || "Company Name"}</h4>
                    <p className="text-sm text-gray-600">{formData.clientName || "Client Name"}</p>
                  </div>
                </div>

                {/* Email Input */}
                <div className="relative mb-4">
                  <Input
                    type="email"
                    value={formData.clientEmail || "client@example.com"}
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
                  disabled={sendProposalMutation.isPending}
                  className="w-full bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {sendProposalMutation.isPending ? "Sending..." : "Send Proposal"}
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
                  onClick={closePdfViewer}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Proposal</span>
                </button>
                <h2 className="text-xl font-semibold">Proposal Preview</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={isGeneratingPdf || createProposalMutation.isPending}
                >
                  {isGeneratingPdf ? "Generating..." : "Download PDF"}
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
                {pdfUrl ? (
                  <object
                    data={pdfUrl}
                    type="application/pdf"
                    className="w-full h-[600px] border-0 rounded"
                    title="Proposal PDF"
                  >
                    <embed
                      src={pdfUrl}
                      type="application/pdf"
                      className="w-full h-[600px] border-0 rounded"
                    />
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                      <p className="mb-4">Unable to display PDF file.</p>
                      <button
                        onClick={handleDownloadPDF}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        disabled={isGeneratingPdf || createProposalMutation.isPending}
                      >
                        {isGeneratingPdf ? "Generating..." : "Download PDF"}
                      </button>
                    </div>
                  </object>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-white border rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating PDF...</p>
                    </div>
                  </div>
                )}
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
                    disabled={isGeneratingPdf}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isGeneratingPdf || createProposalMutation.isPending ? "Creating Proposal..." : "Generate Proposal"}
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