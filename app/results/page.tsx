"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { ProposalList } from "@/components/proposal-list"
import { ProposalStatus } from "@/lib/contracts"

export default function ResultsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Results</h1>
          <p className="mt-1 text-muted-foreground">View completed proposal results and outcomes</p>
        </div>

        <ProposalList status={ProposalStatus.CLOSED} />
      </div>
    </MainLayout>
  )
}
