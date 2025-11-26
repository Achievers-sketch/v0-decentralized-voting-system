"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users } from "lucide-react"
import { VotingMode, VOTING_MODE_LABELS, ProposalStatus, STATUS_LABELS } from "@/lib/contracts"

interface ProposalCardProps {
  proposal: {
    id: string
    proposalId: string
    description: string
    votingMode: number
    status: number
    deadline: string
    totalVotes: string
    creator: string
  }
}

const VOTING_MODE_COLORS: Record<VotingMode, string> = {
  [VotingMode.YES_NO]: "bg-[var(--yes-color)] text-primary-foreground",
  [VotingMode.RANKED_CHOICE]: "bg-chart-2 text-primary-foreground",
  [VotingMode.QUADRATIC]: "bg-chart-3 text-primary-foreground",
  [VotingMode.WEIGHTED]: "bg-chart-4 text-primary-foreground",
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const deadline = new Date(Number.parseInt(proposal.deadline) * 1000)
  const isExpired = deadline < new Date()
  const status = isExpired ? ProposalStatus.CLOSED : proposal.status

  return (
    <Link href={`/proposals/${proposal.id}`}>
      <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-base font-medium leading-snug text-card-foreground line-clamp-2">
              {proposal.description}
            </CardTitle>
            <Badge variant="secondary" className={VOTING_MODE_COLORS[proposal.votingMode as VotingMode]}>
              {VOTING_MODE_LABELS[proposal.votingMode as VotingMode]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{proposal.totalVotes} votes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{isExpired ? "Ended" : `Ends ${deadline.toLocaleDateString()}`}</span>
            </div>
            <Badge
              variant={status === ProposalStatus.ACTIVE ? "default" : "secondary"}
              className={
                status === ProposalStatus.ACTIVE
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }
            >
              {STATUS_LABELS[status as ProposalStatus]}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
