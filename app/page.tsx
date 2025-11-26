import { MainLayout } from "@/components/layout/main-layout"
import { StatsCards } from "@/components/stats-cards"
import { ProposalList } from "@/components/proposal-list"

export default function HomePage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Overview of on-chain governance activity</p>
        </div>

        <StatsCards />

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Proposals</h2>
          <ProposalList limit={6} />
        </div>
      </div>
    </MainLayout>
  )
}
