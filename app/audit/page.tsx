"use client"

import useSWR from "swr"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { type VotingMode, VOTING_MODE_LABELS } from "@/lib/contracts"
import { ExternalLink, FileText, Vote, XCircle } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AuditPage() {
  const { data, isLoading } = useSWR("/api/events?first=100", fetcher)

  const events = data?.data || []

  const getEventIcon = (type: string) => {
    switch (type) {
      case "ProposalCreated":
        return <FileText className="h-4 w-4 text-primary" />
      case "VoteSubmitted":
        return <Vote className="h-4 w-4 text-chart-2" />
      case "ProposalClosed":
        return <XCircle className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "ProposalCreated":
        return "bg-primary/20 text-primary"
      case "VoteSubmitted":
        return "bg-chart-2/20 text-chart-2"
      case "ProposalClosed":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
          <p className="mt-1 text-muted-foreground">On-chain event history for full transparency</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 bg-secondary" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No events recorded yet</p>
            ) : (
              <div className="space-y-3">
                {events.map((event: any) => (
                  <div key={event.id} className="flex items-start gap-4 rounded-lg bg-secondary p-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${getEventColor(
                        event.eventType,
                      )}`}
                    >
                      {getEventIcon(event.eventType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={getEventColor(event.eventType)}>
                          {event.eventType}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Proposal #{event.proposalId}</span>
                        {event.votingMode !== undefined && (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            {VOTING_MODE_LABELS[event.votingMode as VotingMode]}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {event.creator && (
                          <span>
                            Created by{" "}
                            <code className="text-xs bg-background px-1 py-0.5 rounded">
                              {event.creator.slice(0, 6)}...{event.creator.slice(-4)}
                            </code>
                          </span>
                        )}
                        {event.voter && (
                          <span>
                            Voted by{" "}
                            <code className="text-xs bg-background px-1 py-0.5 rounded">
                              {event.voter.slice(0, 6)}...{event.voter.slice(-4)}
                            </code>
                            {event.weight && ` (weight: ${event.weight})`}
                          </span>
                        )}
                        {event.description && <p className="mt-1 text-foreground truncate">{event.description}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">Block #{event.blockNumber}</span>
                      <Link
                        href={`https://sepolia.basescan.org/tx/${event.transactionHash}`}
                        target="_blank"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Tx
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
