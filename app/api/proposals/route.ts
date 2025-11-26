import { type NextRequest, NextResponse } from "next/server"
import { querySubgraph, PROPOSAL_FRAGMENT } from "@/lib/subgraph"

interface ProposalsResponse {
  proposals: Array<{
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
  }>
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const first = Number.parseInt(searchParams.get("first") || "20")
    const skip = Number.parseInt(searchParams.get("skip") || "0")
    const status = searchParams.get("status")
    const votingMode = searchParams.get("votingMode")
    const creator = searchParams.get("creator")
    const orderBy = searchParams.get("orderBy") || "createdAt"
    const orderDirection = searchParams.get("orderDirection") || "desc"

    // Build where clause
    const whereConditions: string[] = []
    if (status !== null && status !== undefined && status !== "") {
      whereConditions.push(`status: ${status}`)
    }
    if (votingMode !== null && votingMode !== undefined && votingMode !== "") {
      whereConditions.push(`votingMode: ${votingMode}`)
    }
    if (creator) {
      whereConditions.push(`creator: "${creator.toLowerCase()}"`)
    }

    const whereClause = whereConditions.length > 0 ? `where: { ${whereConditions.join(", ")} }` : ""

    const query = `
      ${PROPOSAL_FRAGMENT}
      query GetProposals($first: Int!, $skip: Int!) {
        proposals(
          first: $first
          skip: $skip
          orderBy: ${orderBy}
          orderDirection: ${orderDirection}
          ${whereClause}
        ) {
          ...ProposalFields
        }
      }
    `

    const data = await querySubgraph<ProposalsResponse>(query, { first, skip })

    return NextResponse.json({
      success: true,
      data: data.proposals,
      pagination: {
        first,
        skip,
        hasMore: data.proposals.length === first,
      },
    })
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch proposals" }, { status: 500 })
  }
}
