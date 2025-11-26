import { ethers, run } from "hardhat"

async function main() {
  console.log("Starting deployment...\n")

  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n")

  // Deploy GovernanceToken
  console.log("Deploying GovernanceToken...")
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken")
  const governanceToken = await GovernanceToken.deploy()
  await governanceToken.waitForDeployment()
  const governanceTokenAddress = await governanceToken.getAddress()
  console.log("GovernanceToken deployed to:", governanceTokenAddress)

  // Deploy VotingSystem
  console.log("\nDeploying VotingSystem...")
  const VotingSystem = await ethers.getContractFactory("VotingSystem")
  const votingSystem = await VotingSystem.deploy(governanceTokenAddress)
  await votingSystem.waitForDeployment()
  const votingSystemAddress = await votingSystem.getAddress()
  console.log("VotingSystem deployed to:", votingSystemAddress)

  // Wait for block confirmations
  console.log("\nWaiting for block confirmations...")
  await governanceToken.deploymentTransaction()?.wait(5)
  await votingSystem.deploymentTransaction()?.wait(5)

  // Verify contracts on Basescan
  console.log("\nVerifying contracts on Basescan...")

  try {
    await run("verify:verify", {
      address: governanceTokenAddress,
      constructorArguments: [],
    })
    console.log("GovernanceToken verified!")
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("GovernanceToken already verified")
    } else {
      console.error("Error verifying GovernanceToken:", error.message)
    }
  }

  try {
    await run("verify:verify", {
      address: votingSystemAddress,
      constructorArguments: [governanceTokenAddress],
    })
    console.log("VotingSystem verified!")
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("VotingSystem already verified")
    } else {
      console.error("Error verifying VotingSystem:", error.message)
    }
  }

  // Output deployment summary
  console.log("\n========================================")
  console.log("DEPLOYMENT SUMMARY")
  console.log("========================================")
  console.log("Network:", (await ethers.provider.getNetwork()).name)
  console.log("GovernanceToken:", governanceTokenAddress)
  console.log("VotingSystem:", votingSystemAddress)
  console.log("========================================")
  console.log("\nAdd these to your .env file:")
  console.log(`NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS=${votingSystemAddress}`)
  console.log(`NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=${governanceTokenAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
