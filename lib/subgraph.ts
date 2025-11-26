// The Graph subgraph client

const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL || "https://api.studio.thegraph.com/query/YOUR_ID/voting-system/version/latest"

interface GraphQLResponse<T> {
  data: T
  errors?: Array<{ message: string }>
}

export async function querySubgraph<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  const result: GraphQLResponse<T> = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0].message)
  }

  return result.data
}

// Query fragments
export const PROPOSAL_FRAGMENT = `
  fragment ProposalFields on Proposal {
    id
    proposalId
    creator
    description
    options
    deadline
    votingMode
    status
    createdAt
    totalVotes
    yesVotes
    noVotes
    tokensStaked
    closedAt
    blockNumber
    blockTimestamp
    transactionHash
  }
`

export const VOTE_FRAGMENT = `
  fragment VoteFields on Vote {
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
    blockNumber
    blockTimestamp
    transactionHash
    voter {
      id
      address
    }
  }
`

export const VOTER_FRAGMENT = `
  fragment VoterFields on Voter {
    id
    address
    totalVotesCast
    firstVoteAt
    lastVoteAt
  }
`
