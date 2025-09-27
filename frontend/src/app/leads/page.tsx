import DashboardLayout from "../dashboard/layout"
import LeadsContent from "@/components/leads/leads-content"

export default function Leads() {
  return (
    <DashboardLayout title="Leads">
      <LeadsContent />
    </DashboardLayout>
  )
}