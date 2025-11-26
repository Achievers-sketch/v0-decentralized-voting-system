import { NextResponse } from "next/server"
import { querySubgraph } from "@/lib/subgraph"

interface StatsResponse {
  votingStats: {
    id: string
    totalProposals: string
    totalVotes: string
    totalVoters: string
    yesNoProposals: string
    rankedChoiceProposals: string
    quadraticProposals: string
    weightedProposals: string
    totalTokensStaked: string
  } | null
}

export async function GET() {
  try {
    const query = `
      query GetStats {
        votingStats(id: "global") {
          id
          totalProposals
          totalVotes
          totalVoters
          yesNoProposals
          rankedChoiceProposals
          quadraticProposals
          weightedProposals
          totalTokensStaked
        }
      }
    `

    const data = await querySubgraph<StatsResponse>(query)

    if (!data.votingStats) {
      return NextResponse.json({
        success: true,
        data: {
          totalProposals: 0,
          totalVotes: 0,
          totalVoters: 0,
          yesNoProposals: 0,
          rankedChoiceProposals: 0,
          quadraticProposals: 0,
          weightedProposals: 0,
          totalTokensStaked: "0",
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalProposals: Number.parseInt(data.votingStats.totalProposals),
        totalVotes: Number.parseInt(data.votingStats.totalVotes),
        totalVoters: Number.parseInt(data.votingStats.totalVoters),
        yesNoProposals: Number.parseInt(data.votingStats.yesNoProposals),
        rankedChoiceProposals: Number.parseInt(data.votingStats.rankedChoiceProposals),
        quadraticProposals: Number.parseInt(data.votingStats.quadraticProposals),
        weightedProposals: Number.parseInt(data.votingStats.weightedProposals),
        totalTokensStaked: data.votingStats.totalTokensStaked,
      },
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 })
  }
}
