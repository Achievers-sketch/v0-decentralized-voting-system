import { createPublicClient, http, type Address } from "viem"
import { baseSepolia } from "viem/chains"
import VotingSystemABI from "@/contracts/abis/VotingSystem.json"
import GovernanceTokenABI from "@/contracts/abis/GovernanceToken.json"

// After deploying contracts, replace these addresses with your deployed contract addresses
export const VOTING_SYSTEM_ADDRESS = "0x0000000000000000000000000000000000000000" as Address
export const GOVERNANCE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000" as Address

// Create public client for read operations
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org"),
})

// Contract configs
export const votingSystemConfig = {
  address: VOTING_SYSTEM_ADDRESS,
  abi: VotingSystemABI,
} as const

export const governanceTokenConfig = {
  address: GOVERNANCE_TOKEN_ADDRESS,
  abi: GovernanceTokenABI,
} as const

// Voting modes enum
export enum VotingMode {
  YES_NO = 0,
  RANKED_CHOICE = 1,
  QUADRATIC = 2,
  WEIGHTED = 3,
}

export const VOTING_MODE_LABELS: Record<VotingMode, string> = {
  [VotingMode.YES_NO]: "Yes/No",
  [VotingMode.RANKED_CHOICE]: "Ranked Choice",
  [VotingMode.QUADRATIC]: "Quadratic",
  [VotingMode.WEIGHTED]: "Weighted",
}

// Proposal status enum
export enum ProposalStatus {
  ACTIVE = 0,
  CLOSED = 1,
  CANCELLED = 2,
}

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  [ProposalStatus.ACTIVE]: "Active",
  [ProposalStatus.CLOSED]: "Closed",
  [ProposalStatus.CANCELLED]: "Cancelled",
}
