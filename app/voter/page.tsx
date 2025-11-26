"use client"

import useSWR from "swr"
import { useAccount } from "wagmi"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { type VotingMode, VOTING_MODE_LABELS } from "@/lib/contracts"
import { Vote, Coins, Calendar, ExternalLink } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function VoterPage() {
  const { address, isConnected } = useAccount()
  const { data, isLoading } = useSWR(address ? `/api/voter/${address}` : null, fetcher)

  const voter = data?.data

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Votes</h1>
          <p className="mt-1 text-muted-foreground">Your voting history and governance participation</p>
        </div>

        {!isConnected ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Connect your wallet to view your voting history</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 bg-secondary" />
              ))}
            </div>
            <Skeleton className="h-64 bg-secondary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                      <Vote className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Votes</p>
                      <p className="text-2xl font-bold text-foreground">{voter?.totalVotesCast || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-3/20">
                      <Coins className="h-6 w-6 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Token Balance</p>
                      <p className="text-2xl font-bold text-foreground">
                        {Number.parseFloat(voter?.tokenBalance || "0").toFixed(2)} GOV
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-4/20">
                      <Calendar className="h-6 w-6 text-chart-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="text-lg font-bold text-foreground">
                        {voter?.firstVoteAt
                          ? new Date(Number.parseInt(voter.firstVoteAt) * 1000).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Voting History</CardTitle>
              </CardHeader>
              <CardContent>
                {voter?.votes?.length > 0 ? (
                  <div className="space-y-3">
                    {voter.votes.map((vote: any) => (
                      <Link key={vote.id} href={`/proposals/${vote.proposal.id}`} className="block">
                        <div className="flex items-center justify-between rounded-lg bg-secondary p-4 hover:bg-secondary/80 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-chart-2/20 text-chart-2">
                                {VOTING_MODE_LABELS[vote.proposal.votingMode as VotingMode]}
                              </Badge>
                              <span className="text-sm text-muted-foreground">Weight: {vote.weight}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground truncate max-w-md">
                              {vote.proposal.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {new Date(Number.parseInt(vote.timestamp) * 1000).toLocaleDateString()}
                            </span>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">You haven't voted on any proposals yet</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  )
}
