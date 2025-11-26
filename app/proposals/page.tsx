"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ProposalList } from "@/components/proposal-list"
import { Button } from "@/components/ui/button"
import { VOTING_MODE_LABELS } from "@/lib/contracts"

export default function ProposalsPage() {
  const [selectedMode, setSelectedMode] = useState<number | undefined>(undefined)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proposals</h1>
          <p className="mt-1 text-muted-foreground">Browse and vote on governance proposals</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedMode === undefined ? "default" : "outline"}
            onClick={() => setSelectedMode(undefined)}
            className={selectedMode === undefined ? "bg-primary text-primary-foreground" : ""}
          >
            All
          </Button>
          {Object.entries(VOTING_MODE_LABELS).map(([mode, label]) => (
            <Button
              key={mode}
              variant={selectedMode === Number.parseInt(mode) ? "default" : "outline"}
              onClick={() => setSelectedMode(Number.parseInt(mode))}
              className={selectedMode === Number.parseInt(mode) ? "bg-primary text-primary-foreground" : ""}
            >
              {label}
            </Button>
          ))}
        </div>

        <ProposalList votingMode={selectedMode} />
      </div>
    </MainLayout>
  )
}
