import DashboardLayout from "../dashboard/layout"
import ProposalsContent from "@/components/proposals/proposals-content"

export default function Proposals() {
  return (
    <DashboardLayout title="Proposals">
      <ProposalsContent />
    </DashboardLayout>
  )
}