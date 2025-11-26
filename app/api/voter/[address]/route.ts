import { type NextRequest, NextResponse } from "next/server"
import { querySubgraph, VOTER_FRAGMENT } from "@/lib/subgraph"
import { publicClient, governanceTokenConfig } from "@/lib/contracts"
import { formatEther } from "viem"

interface VoterResponse {
  voter: {
    id: string
    address: string
    totalVotesCast: string
    firstVoteAt: string | null
    lastVoteAt: string | null
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
      blockTimestamp: string
      transactionHash: string
      proposal: {
        id: string
        proposalId: string
        description: string
        votingMode: number
        status: number
      }
    }>
  } | null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params
    const normalizedAddress = address.toLowerCase()

    const query = `
      ${VOTER_FRAGMENT}
      query GetVoter($id: ID!) {
        voter(id: $id) {
          ...VoterFields
          votes(orderBy: timestamp, orderDirection: desc) {
            id
            voteType
            weight
            timestamp
            voteData
            yesNoVote
            rankedChoiceRankings
            quadraticOptionIndex
            quadraticVoteAmount
            quadraticCost
            weightedOptionIndex
            blockTimestamp
            transactionHash
            proposal {
              id
              proposalId
              description
              votingMode
              status
            }
          }
        }
      }
    `

    const data = await querySubgraph<VoterResponse>(query, { id: normalizedAddress })

    // Try to get token balance from contract
    let tokenBalance = "0"
    try {
      const balance = await publicClient.readContract({
        ...governanceTokenConfig,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      })
      tokenBalance = formatEther(balance as bigint)
    } catch {
      // Token contract might not be deployed yet
    }

    if (!data.voter) {
      // Return empty voter data if not found in subgraph
      return NextResponse.json({
        success: true,
        data: {
          address: normalizedAddress,
          totalVotesCast: 0,
          firstVoteAt: null,
          lastVoteAt: null,
          tokenBalance,
          votes: [],
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data.voter,
        tokenBalance,
      },
    })
  } catch (error) {
    console.error("Error fetching voter:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch voter data" }, { status: 500 })
  }
}
