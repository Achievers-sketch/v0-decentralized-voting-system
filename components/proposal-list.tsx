"use client"

import useSWR from "swr"
import { ProposalCard } from "./proposal-card"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ProposalListProps {
  limit?: number
  status?: number
  votingMode?: number
}

export function ProposalList({ limit = 20, status, votingMode }: ProposalListProps) {
  const params = new URLSearchParams()
  params.set("first", limit.toString())
  if (status !== undefined) params.set("status", status.toString())
  if (votingMode !== undefined) params.set("votingMode", votingMode.toString())

  const { data, isLoading } = useSWR(`/api/proposals?${params}`, fetcher)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 bg-secondary" />
        ))}
      </div>
    )
  }

  const proposals = data?.data || []

  if (proposals.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No proposals found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {proposals.map((proposal: any) => (
        <ProposalCard key={proposal.id} proposal={proposal} />
      ))}
    </div>
  )
}
