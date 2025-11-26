import { type NextRequest, NextResponse } from "next/server"
import { querySubgraph } from "@/lib/subgraph"
import { VotingMode } from "@/lib/contracts"

interface VoteCountsResponse {
  voteCounts: Array<{
    id: string
    optionIndex: string
    optionName: string
    count: string
    weight: string
    quadraticVotes: string
    firstChoiceCount: string
    rankCounts: string[]
  }>
  proposal: {
    id: string
    votingMode: number
    totalVotes: string
    yesVotes: string | null
    noVotes: string | null
    tokensStaked: string | null
    options: string[]
  } | null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Query subgraph for vote counts
    const query = `
      query GetProposalResults($proposalId: String!) {
        voteCounts(
          where: { proposal: $proposalId }
          orderBy: optionIndex
          orderDirection: asc
        ) {
          id
          optionIndex
          optionName
          count
          weight
          quadraticVotes
          firstChoiceCount
          rankCounts
        }
        proposal(id: $proposalId) {
          id
          votingMode
          totalVotes
          yesVotes
          noVotes
          tokensStaked
          options
        }
      }
    `

    const data = await querySubgraph<VoteCountsResponse>(query, { proposalId: id })

    if (!data.proposal) {
      return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 })
    }

    const votingMode = data.proposal.votingMode
    let results: Record<string, unknown> = {}

    // Format results based on voting mode
    switch (votingMode) {
      case VotingMode.YES_NO:
        results = {
          type: "yes_no",
          yes: Number.parseInt(data.proposal.yesVotes || "0"),
          no: Number.parseInt(data.proposal.noVotes || "0"),
          total: Number.parseInt(data.proposal.totalVotes),
          winner:
            Number.parseInt(data.proposal.yesVotes || "0") > Number.parseInt(data.proposal.noVotes || "0")
              ? "Yes"
              : Number.parseInt(data.proposal.noVotes || "0") > Number.parseInt(data.proposal.yesVotes || "0")
                ? "No"
                : "Tie",
        }
        break

      case VotingMode.RANKED_CHOICE:
        results = {
          type: "ranked_choice",
          options: data.voteCounts.map((vc) => ({
            index: Number.parseInt(vc.optionIndex),
            name: vc.optionName,
            firstChoiceVotes: Number.parseInt(vc.firstChoiceCount),
            rankDistribution: vc.rankCounts.map((r) => Number.parseInt(r)),
          })),
          total: Number.parseInt(data.proposal.totalVotes),
          winner: data.voteCounts.reduce(
            (prev, current) =>
              Number.parseInt(current.firstChoiceCount) > Number.parseInt(prev.firstChoiceCount) ? current : prev,
            data.voteCounts[0],
          )?.optionName,
        }
        break

      case VotingMode.QUADRATIC:
        results = {
          type: "quadratic",
          options: data.voteCounts.map((vc) => ({
            index: Number.parseInt(vc.optionIndex),
            name: vc.optionName,
            votes: Number.parseInt(vc.quadraticVotes),
          })),
          tokensStaked: data.proposal.tokensStaked,
          total: Number.parseInt(data.proposal.totalVotes),
          winner: data.voteCounts.reduce(
            (prev, current) =>
              Number.parseInt(current.quadraticVotes) > Number.parseInt(prev.quadraticVotes) ? current : prev,
            data.voteCounts[0],
          )?.optionName,
        }
        break

      case VotingMode.WEIGHTED:
        const totalWeight = data.voteCounts.reduce((sum, vc) => sum + Number.parseInt(vc.weight), 0)
        results = {
          type: "weighted",
          options: data.voteCounts.map((vc) => ({
            index: Number.parseInt(vc.optionIndex),
            name: vc.optionName,
            weight: Number.parseInt(vc.weight),
            percentage: totalWeight > 0 ? (Number.parseInt(vc.weight) / totalWeight) * 100 : 0,
          })),
          totalWeight,
          totalVoters: Number.parseInt(data.proposal.totalVotes),
          winner: data.voteCounts.reduce(
            (prev, current) => (Number.parseInt(current.weight) > Number.parseInt(prev.weight) ? current : prev),
            data.voteCounts[0],
          )?.optionName,
        }
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        proposalId: id,
        votingMode,
        results,
      },
    })
  } catch (error) {
    console.error("Error fetching proposal results:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch results" }, { status: 500 })
  }
}
