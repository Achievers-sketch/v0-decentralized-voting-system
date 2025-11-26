"use client"

import { use } from "react"
import useSWR from "swr"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { VotingMode, VOTING_MODE_LABELS, ProposalStatus, STATUS_LABELS } from "@/lib/contracts"
import { YesNoVote } from "@/components/voting/yes-no-vote"
import { RankedChoiceVote } from "@/components/voting/ranked-choice-vote"
import { QuadraticVote } from "@/components/voting/quadratic-vote"
import { WeightedVote } from "@/components/voting/weighted-vote"
import { YesNoResults } from "@/components/results/yes-no-results"
import { RankedChoiceResults } from "@/components/results/ranked-choice-results"
import { QuadraticResults } from "@/components/results/quadratic-results"
import { WeightedResults } from "@/components/results/weighted-results"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { votingSystemConfig } from "@/lib/contracts"
import { Clock, User, ExternalLink } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { address, isConnected } = useAccount()

  const { data: proposalData, isLoading: proposalLoading } = useSWR(`/api/proposals/${id}`, fetcher)
  const { data: resultsData } = useSWR(`/api/proposals/${id}/results`, fetcher)
  const { data: voterData } = useSWR(address ? `/api/voter/${address}` : null, fetcher)

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const proposal = proposalData?.data
  const results = resultsData?.data?.results
  const tokenBalance = voterData?.data?.tokenBalance || "0"

  const deadline = proposal ? new Date(Number.parseInt(proposal.deadline) * 1000) : null
  const isExpired = deadline ? deadline < new Date() : false
  const hasVoted = proposal?.votes?.some((v: any) => v.voter?.address?.toLowerCase() === address?.toLowerCase())

  const handleYesNoVote = (voteYes: boolean) => {
    writeContract({
      ...votingSystemConfig,
      functionName: "voteYesNo",
      args: [BigInt(id), voteYes],
    })
  }

  const handleRankedChoiceVote = (rankings: number[]) => {
    writeContract({
      ...votingSystemConfig,
      functionName: "voteRankedChoice",
      args: [BigInt(id), rankings.map((r) => BigInt(r))],
    })
  }

  const handleQuadraticVote = (optionIndex: number, voteAmount: number) => {
    writeContract({
      ...votingSystemConfig,
      functionName: "voteQuadratic",
      args: [BigInt(id), BigInt(optionIndex), BigInt(voteAmount)],
    })
  }

  const handleWeightedVote = (optionIndex: number) => {
    writeContract({
      ...votingSystemConfig,
      functionName: "voteWeighted",
      args: [BigInt(id), BigInt(optionIndex)],
    })
  }

  if (proposalLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 bg-secondary" />
          <Skeleton className="h-64 bg-secondary" />
        </div>
      </MainLayout>
    )
  }

  if (!proposal) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Proposal not found</p>
        </div>
      </MainLayout>
    )
  }

  const canVote = isConnected && !isExpired && !hasVoted && proposal.status === ProposalStatus.ACTIVE

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-chart-2 text-primary-foreground">
                {VOTING_MODE_LABELS[proposal.votingMode as VotingMode]}
              </Badge>
              <Badge
                variant={proposal.status === ProposalStatus.ACTIVE && !isExpired ? "default" : "secondary"}
                className={
                  proposal.status === ProposalStatus.ACTIVE && !isExpired
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              >
                {isExpired ? "Ended" : STATUS_LABELS[proposal.status as ProposalStatus]}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground text-balance">{proposal.description}</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>
              Created by{" "}
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                {proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}
              </code>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>
              {isExpired
                ? `Ended ${deadline?.toLocaleDateString()}`
                : `Ends ${deadline?.toLocaleDateString()} at ${deadline?.toLocaleTimeString()}`}
            </span>
          </div>
          <Link
            href={`https://sepolia.basescan.org/tx/${proposal.transactionHash}`}
            target="_blank"
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View on Explorer</span>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Voting Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                {hasVoted ? "You have voted" : canVote ? "Cast Your Vote" : "Voting"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <p className="text-muted-foreground">Connect your wallet to vote</p>
              ) : hasVoted ? (
                <p className="text-muted-foreground">Thank you for participating in this proposal.</p>
              ) : isExpired ? (
                <p className="text-muted-foreground">This proposal has ended.</p>
              ) : (
                <>
                  {proposal.votingMode === VotingMode.YES_NO && (
                    <YesNoVote onVote={handleYesNoVote} disabled={!canVote} isLoading={isPending || isConfirming} />
                  )}
                  {proposal.votingMode === VotingMode.RANKED_CHOICE && (
                    <RankedChoiceVote
                      options={proposal.options}
                      onVote={handleRankedChoiceVote}
                      disabled={!canVote}
                      isLoading={isPending || isConfirming}
                    />
                  )}
                  {proposal.votingMode === VotingMode.QUADRATIC && (
                    <QuadraticVote
                      options={proposal.options}
                      onVote={handleQuadraticVote}
                      disabled={!canVote}
                      isLoading={isPending || isConfirming}
                      tokenBalance={tokenBalance}
                    />
                  )}
                  {proposal.votingMode === VotingMode.WEIGHTED && (
                    <WeightedVote
                      options={proposal.options}
                      onVote={handleWeightedVote}
                      disabled={!canVote}
                      isLoading={isPending || isConfirming}
                      tokenBalance={tokenBalance}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {results && (
            <>
              {results.type === "yes_no" && <YesNoResults results={results} />}
              {results.type === "ranked_choice" && <RankedChoiceResults results={results} />}
              {results.type === "quadratic" && <QuadraticResults results={results} />}
              {results.type === "weighted" && <WeightedResults results={results} />}
            </>
          )}
        </div>

        {/* Recent Votes */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Votes</CardTitle>
          </CardHeader>
          <CardContent>
            {proposal.votes?.length > 0 ? (
              <div className="space-y-3">
                {proposal.votes.slice(0, 10).map((vote: any) => (
                  <div key={vote.id} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {vote.voter?.address?.slice(2, 4).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <code className="text-xs text-foreground">
                          {vote.voter?.address?.slice(0, 6)}...
                          {vote.voter?.address?.slice(-4)}
                        </code>
                        <p className="text-xs text-muted-foreground">Weight: {vote.weight}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(Number.parseInt(vote.timestamp) * 1000).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No votes yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
