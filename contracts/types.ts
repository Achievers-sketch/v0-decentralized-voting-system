// TypeScript types for contract interactions

export enum VotingMode {
  YES_NO = 0,
  RANKED_CHOICE = 1,
  QUADRATIC = 2,
  WEIGHTED = 3,
}

export enum ProposalStatus {
  ACTIVE = 0,
  CLOSED = 1,
  CANCELLED = 2,
}

export interface Proposal {
  id: bigint
  creator: string
  description: string
  options: string[]
  deadline: bigint
  votingMode: VotingMode
  status: ProposalStatus
  createdAt: bigint
  totalVotes: bigint
}

export interface Vote {
  voter: string
  proposalId: bigint
  voteType: VotingMode
  weight: bigint
  timestamp: bigint
  voteData: string
}

export interface VoterRecord {
  voter: string
  proposalIds: bigint[]
  totalVotesCast: bigint
}

export interface YesNoResult {
  yes: bigint
  no: bigint
  total: bigint
}

export interface QuadraticResult {
  voteCounts: bigint[]
  tokensStaked: bigint
}

export interface WeightedResult {
  weights: bigint[]
  totalWeight: bigint
}
