"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Building2,
  DollarSign,
  Users,
  Plus,
  X
} from "lucide-react"
import { useCreateLead } from "@/hooks/useLeads"
import { CreateLeadRequest } from "@/services/leads"
import { toast } from "sonner"

// Form validation schema
const addLeadSchema = z.object({
  name: z.string().min(1, "Name is required").min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone is required").min(10, "Phone must be at least 10 digits"),
  company: z.string().min(1, "Company is required"),
  businessType: z.string().min(1, "Business type is required"),
  businessSize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise'], {
    message: "Please select a business size"
  }),
  budgetMin: z.number().min(0, "Budget minimum must be positive"),
  budgetMax: z.number().min(0, "Budget maximum must be positive"),
  timeline: z.string().min(1, "Timeline is required"),
  source: z.enum(['website', 'referral', 'cold_call', 'social_media', 'other'], {
    message: "Please select a lead source"
  }),
  hotDesks: z.number().min(0, "Hot desks must be 0 or more"),
  dedicatedDesks: z.number().min(0, "Dedicated desks must be 0 or more"),
  privateCabins: z.number().min(0, "Private cabins must be 0 or more"),
  meetingRooms: z.number().min(0, "Meeting rooms must be 0 or more"),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: "Budget maximum must be greater than or equal to minimum",
  path: ["budgetMax"],
})

type AddLeadFormData = z.infer<typeof addLeadSchema>

interface AddLeadFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function AddLeadForm({ onSuccess, onCancel }: AddLeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createLeadMutation = useCreateLead()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddLeadFormData>({
    resolver: zodResolver(addLeadSchema),
    defaultValues: {
      budgetMin: 0,
      budgetMax: 0,
      hotDesks: 0,
      dedicatedDesks: 0,
      privateCabins: 0,
      meetingRooms: 0,
    }
  })

  const onSubmit = async (data: AddLeadFormData) => {
    setIsSubmitting(true)

    try {
      const leadData: CreateLeadRequest = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        businessType: data.businessType,
        businessSize: data.businessSize,
        budgetRange: {
          min: data.budgetMin,
          max: data.budgetMax,
        },
        timeline: data.timeline,
        source: data.source,
        seatingRequirements: {
          hotDesks: data.hotDesks,
          dedicatedDesks: data.dedicatedDesks,
          privateCabins: data.privateCabins,
          meetingRooms: data.meetingRooms,
        },
      }

      await createLeadMutation.mutateAsync(leadData)

      toast.success("Lead created successfully!")
      reset()
      onSuccess?.()
    } catch (error) {
      console.error("Error creating lead:", error)
      toast.error("Failed to create lead. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset()
    onCancel?.()
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  {...register("phone")}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  placeholder="Enter company name"
                  {...register("company")}
                  className={errors.company ? "border-red-500" : ""}
                />
                {errors.company && (
                  <p className="text-sm text-red-500">{errors.company.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Business Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Input
                  id="businessType"
                  placeholder="e.g., Technology, Marketing, Consulting"
                  {...register("businessType")}
                  className={errors.businessType ? "border-red-500" : ""}
                />
                {errors.businessType && (
                  <p className="text-sm text-red-500">{errors.businessType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessSize">Business Size *</Label>
                <Select onValueChange={(value) => setValue("businessSize", value as any)}>
                  <SelectTrigger className={errors.businessSize ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select business size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                    <SelectItem value="small">Small (11-50 employees)</SelectItem>
                    <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                    <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.businessSize && (
                  <p className="text-sm text-red-500">{errors.businessSize.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline *</Label>
                <Input
                  id="timeline"
                  placeholder="e.g., Immediate, 1-3 months, 3-6 months"
                  {...register("timeline")}
                  className={errors.timeline ? "border-red-500" : ""}
                />
                {errors.timeline && (
                  <p className="text-sm text-red-500">{errors.timeline.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Lead Source *</Label>
                <Select onValueChange={(value) => setValue("source", value as any)}>
                  <SelectTrigger className={errors.source ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.source && (
                  <p className="text-sm text-red-500">{errors.source.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Budget Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Budget Range</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">Minimum Budget</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("budgetMin", { valueAsNumber: true })}
                  className={errors.budgetMin ? "border-red-500" : ""}
                />
                {errors.budgetMin && (
                  <p className="text-sm text-red-500">{errors.budgetMin.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetMax">Maximum Budget</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("budgetMax", { valueAsNumber: true })}
                  className={errors.budgetMax ? "border-red-500" : ""}
                />
                {errors.budgetMax && (
                  <p className="text-sm text-red-500">{errors.budgetMax.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Seating Requirements */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Seating Requirements</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotDesks">Hot Desks</Label>
                <Input
                  id="hotDesks"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("hotDesks", { valueAsNumber: true })}
                  className={errors.hotDesks ? "border-red-500" : ""}
                />
                {errors.hotDesks && (
                  <p className="text-sm text-red-500">{errors.hotDesks.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dedicatedDesks">Dedicated Desks</Label>
                <Input
                  id="dedicatedDesks"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("dedicatedDesks", { valueAsNumber: true })}
                  className={errors.dedicatedDesks ? "border-red-500" : ""}
                />
                {errors.dedicatedDesks && (
                  <p className="text-sm text-red-500">{errors.dedicatedDesks.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="privateCabins">Private Cabins</Label>
                <Input
                  id="privateCabins"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("privateCabins", { valueAsNumber: true })}
                  className={errors.privateCabins ? "border-red-500" : ""}
                />
                {errors.privateCabins && (
                  <p className="text-sm text-red-500">{errors.privateCabins.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingRooms">Meeting Rooms</Label>
                <Input
                  id="meetingRooms"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("meetingRooms", { valueAsNumber: true })}
                  className={errors.meetingRooms ? "border-red-500" : ""}
                />
                {errors.meetingRooms && (
                  <p className="text-sm text-red-500">{errors.meetingRooms.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lead
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}