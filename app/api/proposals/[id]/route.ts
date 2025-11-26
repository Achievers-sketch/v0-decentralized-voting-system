import { type NextRequest, NextResponse } from "next/server"
import { querySubgraph, PROPOSAL_FRAGMENT, VOTE_FRAGMENT } from "@/lib/subgraph"

interface ProposalResponse {
  proposal: {
    id: string
    proposalId: string
    creator: string
    description: string
    options: string[]
    deadline: string
    votingMode: number
    status: number
    createdAt: string
    totalVotes: string
    yesVotes: string | null
    noVotes: string | null
    tokensStaked: string | null
    closedAt: string | null
    blockNumber: string
    blockTimestamp: string
    transactionHash: string
    votes: Array<{
      id: string
      voteType: number
      weight: string
      timestamp: string
      voteData: string
      yesNoVote: boolean | null
      rankedChoiceRankings: string[] | null
      quadraticOptionIndex: string | null
      quadraticVoteAmount: string | null
      quadraticCost: string | null
      weightedOptionIndex: string | null
      voter: {
        id: string
        address: string
      }
    }>
  } | null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const query = `
      ${PROPOSAL_FRAGMENT}
      ${VOTE_FRAGMENT}
      query GetProposal($id: ID!) {
        proposal(id: $id) {
          ...ProposalFields
          votes(orderBy: timestamp, orderDirection: desc) {
            ...VoteFields
          }
        }
      }
    `

    const data = await querySubgraph<ProposalResponse>(query, { id })

    if (!data.proposal) {
      return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: data.proposal,
    })
  } catch (error) {
    console.error("Error fetching proposal:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch proposal" }, { status: 500 })
  }
}
