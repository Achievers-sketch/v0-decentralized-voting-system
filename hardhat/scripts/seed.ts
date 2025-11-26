import { ethers } from "hardhat"

async function main() {
  console.log("Seeding test data...\n")

  const [deployer, voter1, voter2] = await ethers.getSigners()

  // Get contract addresses from environment
  const votingSystemAddress = process.env.VOTING_SYSTEM_ADDRESS
  const governanceTokenAddress = process.env.GOVERNANCE_TOKEN_ADDRESS

  if (!votingSystemAddress || !governanceTokenAddress) {
    throw new Error("Contract addresses not set in environment")
  }

  const VotingSystem = await ethers.getContractFactory("VotingSystem")
  const votingSystem = VotingSystem.attach(votingSystemAddress)

  const GovernanceToken = await ethers.getContractFactory("GovernanceToken")
  const governanceToken = GovernanceToken.attach(governanceTokenAddress)

  // Distribute tokens
  console.log("Distributing tokens...")
  await governanceToken.transfer(voter1.address, ethers.parseEther("10000"))
  await governanceToken.transfer(voter2.address, ethers.parseEther("5000"))
  console.log("Tokens distributed")

  // Create sample proposals
  const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 1 week

  console.log("\nCreating Yes/No proposal...")
  await votingSystem.createProposal(
    "Should we implement automatic reward distribution for stakers?",
    [],
    deadline,
    0, // YES_NO
  )

  console.log("Creating Ranked Choice proposal...")
  await votingSystem.createProposal(
    "Which new feature should we prioritize?",
    ["Multi-sig wallet support", "Cross-chain voting", "Delegation system", "Analytics dashboard"],
    deadline,
    1, // RANKED_CHOICE
  )

  console.log("Creating Quadratic proposal...")
  await votingSystem.createProposal(
    "How should we allocate the community treasury?",
    ["Development grants", "Marketing expansion", "Liquidity incentives"],
    deadline,
    2, // QUADRATIC
  )

  console.log("Creating Weighted proposal...")
  await votingSystem.createProposal(
    "Select the next partnership priority",
    ["DeFi Protocol Integration", "NFT Marketplace Partnership", "CEX Listing"],
    deadline,
    3, // WEIGHTED
  )

  console.log("\n========================================")
  console.log("SEEDING COMPLETE")
  console.log("========================================")
  console.log("Created 4 sample proposals")
  console.log("Distributed tokens to 2 test voters")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
