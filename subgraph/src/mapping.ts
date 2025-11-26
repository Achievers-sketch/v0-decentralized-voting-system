import {
  type ProposalCreated as ProposalCreatedEvent,
  type VoteSubmitted as VoteSubmittedEvent,
  type VoteCounted as VoteCountedEvent,
  type ProposalClosed as ProposalClosedEvent,
  VotingSystem,
} from "../generated/VotingSystem/VotingSystem"
import {
  Proposal,
  Vote,
  Voter,
  VoteCount,
  VotingStats,
  ProposalCreatedEvent as ProposalCreatedEventEntity,
  VoteSubmittedEvent as VoteSubmittedEventEntity,
  VoteCountedEvent as VoteCountedEventEntity,
  ProposalClosedEvent as ProposalClosedEventEntity,
} from "../generated/schema"
import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts"

// Voting mode constants
const YES_NO = 0
const RANKED_CHOICE = 1
const QUADRATIC = 2
const WEIGHTED = 3

// Helper to get or create global stats
function getOrCreateStats(): VotingStats {
  let stats = VotingStats.load("global")
  if (!stats) {
    stats = new VotingStats("global")
    stats.totalProposals = BigInt.zero()
    stats.totalVotes = BigInt.zero()
    stats.totalVoters = BigInt.zero()
    stats.yesNoProposals = BigInt.zero()
    stats.rankedChoiceProposals = BigInt.zero()
    stats.quadraticProposals = BigInt.zero()
    stats.weightedProposals = BigInt.zero()
    stats.totalTokensStaked = BigInt.zero()
  }
  return stats
}

// Helper to get or create voter
function getOrCreateVoter(address: Bytes): Voter {
  let voter = Voter.load(address.toHexString())
  if (!voter) {
    voter = new Voter(address.toHexString())
    voter.address = address
    voter.totalVotesCast = BigInt.zero()
    voter.proposals = []
    voter.firstVoteAt = null
    voter.lastVoteAt = null
  }
  return voter
}

// Handle ProposalCreated event
export function handleProposalCreated(event: ProposalCreatedEvent): void {
  const proposalId = event.params.proposalId.toString()

  // Create proposal entity
  const proposal = new Proposal(proposalId)
  proposal.proposalId = event.params.proposalId
  proposal.creator = event.params.creator
  proposal.description = event.params.description
  proposal.deadline = event.params.deadline
  proposal.votingMode = event.params.votingMode
  proposal.status = 0 // ACTIVE
  proposal.createdAt = event.params.timestamp
  proposal.totalVotes = BigInt.zero()
  proposal.blockNumber = event.block.number
  proposal.blockTimestamp = event.block.timestamp
  proposal.transactionHash = event.transaction.hash

  // Initialize vote counts based on mode
  if (event.params.votingMode == YES_NO) {
    proposal.yesVotes = BigInt.zero()
    proposal.noVotes = BigInt.zero()
  }
  if (event.params.votingMode == QUADRATIC) {
    proposal.tokensStaked = BigInt.zero()
  }

  // Fetch options from contract
  const contract = VotingSystem.bind(event.address)
  const optionsResult = contract.try_getProposalOptions(event.params.proposalId)
  if (!optionsResult.reverted) {
    proposal.options = optionsResult.value

    // Create VoteCount entities for each option
    for (let i = 0; i < optionsResult.value.length; i++) {
      const voteCountId = proposalId + "-" + i.toString()
      const voteCount = new VoteCount(voteCountId)
      voteCount.proposal = proposalId
      voteCount.optionIndex = BigInt.fromI32(i)
      voteCount.optionName = optionsResult.value[i]
      voteCount.count = BigInt.zero()
      voteCount.weight = BigInt.zero()
      voteCount.quadraticVotes = BigInt.zero()
      voteCount.firstChoiceCount = BigInt.zero()
      voteCount.rankCounts = []
      voteCount.save()
    }
  } else {
    proposal.options = []
  }

  proposal.save()

  // Update global stats
  const stats = getOrCreateStats()
  stats.totalProposals = stats.totalProposals.plus(BigInt.fromI32(1))

  if (event.params.votingMode == YES_NO) {
    stats.yesNoProposals = stats.yesNoProposals.plus(BigInt.fromI32(1))
  } else if (event.params.votingMode == RANKED_CHOICE) {
    stats.rankedChoiceProposals = stats.rankedChoiceProposals.plus(BigInt.fromI32(1))
  } else if (event.params.votingMode == QUADRATIC) {
    stats.quadraticProposals = stats.quadraticProposals.plus(BigInt.fromI32(1))
  } else if (event.params.votingMode == WEIGHTED) {
    stats.weightedProposals = stats.weightedProposals.plus(BigInt.fromI32(1))
  }

  stats.save()

  // Create event log entity
  const eventLog = new ProposalCreatedEventEntity(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString(),
  )
  eventLog.proposalId = event.params.proposalId
  eventLog.creator = event.params.creator
  eventLog.description = event.params.description
  eventLog.votingMode = event.params.votingMode
  eventLog.deadline = event.params.deadline
  eventLog.timestamp = event.params.timestamp
  eventLog.blockNumber = event.block.number
  eventLog.transactionHash = event.transaction.hash
  eventLog.save()
}

// Handle VoteSubmitted event
export function handleVoteSubmitted(event: VoteSubmittedEvent): void {
  const proposalId = event.params.proposalId.toString()
  const voteId = proposalId + "-" + event.params.voter.toHexString()

  // Get proposal
  const proposal = Proposal.load(proposalId)
  if (!proposal) return

  // Get or create voter
  const voter = getOrCreateVoter(event.params.voter)

  // Create vote entity
  const vote = new Vote(voteId)
  vote.proposal = proposalId
  vote.voter = voter.id
  vote.voteType = event.params.voteType
  vote.weight = event.params.weight
  vote.timestamp = event.params.timestamp
  vote.blockNumber = event.block.number
  vote.blockTimestamp = event.block.timestamp
  vote.transactionHash = event.transaction.hash

  // Fetch vote data from contract
  const contract = VotingSystem.bind(event.address)
  const voteResult = contract.try_getVoterVote(event.params.proposalId, event.params.voter)
  if (!voteResult.reverted) {
    vote.voteData = voteResult.value.voteData

    // Decode vote data based on voting mode
    if (event.params.voteType == YES_NO) {
      // Decode boolean
      const decoded = ethereum.decode("bool", voteResult.value.voteData)
      if (decoded) {
        vote.yesNoVote = decoded.toBoolean()

        // Update proposal counts
        if (decoded.toBoolean()) {
          proposal.yesVotes = proposal.yesVotes!.plus(BigInt.fromI32(1))
        } else {
          proposal.noVotes = proposal.noVotes!.plus(BigInt.fromI32(1))
        }
      }
    } else if (event.params.voteType == RANKED_CHOICE) {
      // Decode uint256[]
      const decoded = ethereum.decode("uint256[]", voteResult.value.voteData)
      if (decoded) {
        const rankings = decoded.toBigIntArray()
        vote.rankedChoiceRankings = rankings

        // Update first choice count
        if (rankings.length > 0) {
          const firstChoiceIndex = rankings[0]
          const voteCountId = proposalId + "-" + firstChoiceIndex.toString()
          const voteCount = VoteCount.load(voteCountId)
          if (voteCount) {
            voteCount.firstChoiceCount = voteCount.firstChoiceCount.plus(BigInt.fromI32(1))
            voteCount.save()
          }
        }
      }
    } else if (event.params.voteType == QUADRATIC) {
      // Decode (uint256, uint256, uint256)
      const decoded = ethereum.decode("(uint256,uint256,uint256)", voteResult.value.voteData)
      if (decoded) {
        const tuple = decoded.toTuple()
        vote.quadraticOptionIndex = tuple[0].toBigInt()
        vote.quadraticVoteAmount = tuple[1].toBigInt()
        vote.quadraticCost = tuple[2].toBigInt()

        // Update proposal tokens staked
        proposal.tokensStaked = proposal.tokensStaked!.plus(tuple[2].toBigInt())

        // Update vote count
        const voteCountId = proposalId + "-" + tuple[0].toBigInt().toString()
        const voteCount = VoteCount.load(voteCountId)
        if (voteCount) {
          voteCount.quadraticVotes = voteCount.quadraticVotes.plus(tuple[1].toBigInt())
          voteCount.save()
        }
      }
    } else if (event.params.voteType == WEIGHTED) {
      // Decode (uint256, uint256)
      const decoded = ethereum.decode("(uint256,uint256)", voteResult.value.voteData)
      if (decoded) {
        const tuple = decoded.toTuple()
        vote.weightedOptionIndex = tuple[0].toBigInt()

        // Update vote count
        const voteCountId = proposalId + "-" + tuple[0].toBigInt().toString()
        const voteCount = VoteCount.load(voteCountId)
        if (voteCount) {
          voteCount.weight = voteCount.weight.plus(tuple[1].toBigInt())
          voteCount.save()
        }
      }
    }
  } else {
    vote.voteData = new Bytes(0)
  }

  vote.save()

  // Update proposal
  proposal.totalVotes = proposal.totalVotes.plus(BigInt.fromI32(1))
  proposal.save()

  // Update voter
  const voterProposals = voter.proposals
  voterProposals.push(proposal.id)
  voter.proposals = voterProposals
  voter.totalVotesCast = voter.totalVotesCast.plus(BigInt.fromI32(1))
  if (!voter.firstVoteAt) {
    voter.firstVoteAt = event.block.timestamp
  }
  voter.lastVoteAt = event.block.timestamp
  voter.save()

  // Update global stats
  const stats = getOrCreateStats()
  stats.totalVotes = stats.totalVotes.plus(BigInt.fromI32(1))

  // Check if new voter
  if (voter.totalVotesCast.equals(BigInt.fromI32(1))) {
    stats.totalVoters = stats.totalVoters.plus(BigInt.fromI32(1))
  }

  if (event.params.voteType == QUADRATIC && vote.quadraticCost) {
    stats.totalTokensStaked = stats.totalTokensStaked.plus(vote.quadraticCost!)
  }

  stats.save()

  // Create event log
  const eventLog = new VoteSubmittedEventEntity(event.transaction.hash.toHexString() + "-" + event.logIndex.toString())
  eventLog.proposalId = event.params.proposalId
  eventLog.voter = event.params.voter
  eventLog.voteType = event.params.voteType
  eventLog.weight = event.params.weight
  eventLog.timestamp = event.params.timestamp
  eventLog.blockNumber = event.block.number
  eventLog.transactionHash = event.transaction.hash
  eventLog.save()
}

// Handle VoteCounted event
export function handleVoteCounted(event: VoteCountedEvent): void {
  const eventLog = new VoteCountedEventEntity(event.transaction.hash.toHexString() + "-" + event.logIndex.toString())
  eventLog.proposalId = event.params.proposalId
  eventLog.voter = event.params.voter
  eventLog.weight = event.params.weight
  eventLog.blockNumber = event.block.number
  eventLog.transactionHash = event.transaction.hash
  eventLog.save()
}

// Handle ProposalClosed event
export function handleProposalClosed(event: ProposalClosedEvent): void {
  const proposalId = event.params.proposalId.toString()
  const proposal = Proposal.load(proposalId)

  if (proposal) {
    proposal.status = 1 // CLOSED
    proposal.closedAt = event.params.timestamp
    proposal.save()
  }

  // Create event log
  const eventLog = new ProposalClosedEventEntity(event.transaction.hash.toHexString() + "-" + event.logIndex.toString())
  eventLog.proposalId = event.params.proposalId
  eventLog.timestamp = event.params.timestamp
  eventLog.blockNumber = event.block.number
  eventLog.transactionHash = event.transaction.hash
  eventLog.save()
}
