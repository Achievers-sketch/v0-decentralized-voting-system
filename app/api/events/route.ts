import { type NextRequest, NextResponse } from "next/server"
import { querySubgraph } from "@/lib/subgraph"

interface EventsResponse {
  proposalCreatedEvents: Array<{
    id: string
    proposalId: string
    creator: string
    description: string
    votingMode: number
    deadline: string
    timestamp: string
    blockNumber: string
    transactionHash: string
  }>
  voteSubmittedEvents: Array<{
    id: string
    proposalId: string
    voter: string
    voteType: number
    weight: string
    timestamp: string
    blockNumber: string
    transactionHash: string
  }>
  proposalClosedEvents: Array<{
    id: string
    proposalId: string
    timestamp: string
    blockNumber: string
    transactionHash: string
  }>
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const first = Number.parseInt(searchParams.get("first") || "50")
    const eventType = searchParams.get("type") // "proposal", "vote", "close", or all

    let query = ""

    if (!eventType || eventType === "all") {
      query = `
        query GetAllEvents($first: Int!) {
          proposalCreatedEvents(first: $first, orderBy: timestamp, orderDirection: desc) {
            id
            proposalId
            creator
            description
            votingMode
            deadline
            timestamp
            blockNumber
            transactionHash
          }
          voteSubmittedEvents(first: $first, orderBy: timestamp, orderDirection: desc) {
            id
            proposalId
            voter
            voteType
            weight
            timestamp
            blockNumber
            transactionHash
          }
          proposalClosedEvents(first: $first, orderBy: timestamp, orderDirection: desc) {
            id
            proposalId
            timestamp
            blockNumber
            transactionHash
          }
        }
      `
    } else {
      const eventTypeMap: Record<string, string> = {
        proposal: "proposalCreatedEvents",
        vote: "voteSubmittedEvents",
        close: "proposalClosedEvents",
      }

      const entityName = eventTypeMap[eventType]
      if (!entityName) {
        return NextResponse.json({ success: false, error: "Invalid event type" }, { status: 400 })
      }

      query = `
        query GetEvents($first: Int!) {
          ${entityName}(first: $first, orderBy: timestamp, orderDirection: desc) {
            id
            proposalId
            ${eventType === "proposal" ? "creator description votingMode deadline" : ""}
            ${eventType === "vote" ? "voter voteType weight" : ""}
            timestamp
            blockNumber
            transactionHash
          }
        }
      `
    }

    const data = await querySubgraph<EventsResponse>(query, { first })

    // Combine and sort all events if fetching all
    if (!eventType || eventType === "all") {
      const allEvents = [
        ...(data.proposalCreatedEvents || []).map((e) => ({
          ...e,
          eventType: "ProposalCreated",
        })),
        ...(data.voteSubmittedEvents || []).map((e) => ({
          ...e,
          eventType: "VoteSubmitted",
        })),
        ...(data.proposalClosedEvents || []).map((e) => ({
          ...e,
          eventType: "ProposalClosed",
        })),
      ].sort((a, b) => Number.parseInt(b.timestamp) - Number.parseInt(a.timestamp))

      return NextResponse.json({
        success: true,
        data: allEvents.slice(0, first),
      })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 })
  }
}
