import { expect } from "chai"
import { ethers } from "hardhat"
import type { VotingSystem, GovernanceToken } from "../typechain-types"
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { time } from "@nomicfoundation/hardhat-network-helpers"

describe("VotingSystem", () => {
  let votingSystem: VotingSystem
  let governanceToken: GovernanceToken
  let owner: SignerWithAddress
  let voter1: SignerWithAddress
  let voter2: SignerWithAddress
  let voter3: SignerWithAddress

  const VotingMode = {
    YES_NO: 0,
    RANKED_CHOICE: 1,
    QUADRATIC: 2,
    WEIGHTED: 3,
  }

  beforeEach(async () => {
    ;[owner, voter1, voter2, voter3] = await ethers.getSigners()

    // Deploy GovernanceToken
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken")
    governanceToken = await GovernanceToken.deploy()
    await governanceToken.waitForDeployment()

    // Deploy VotingSystem
    const VotingSystem = await ethers.getContractFactory("VotingSystem")
    votingSystem = await VotingSystem.deploy(await governanceToken.getAddress())
    await votingSystem.waitForDeployment()

    // Distribute tokens to voters
    const tokenAmount = ethers.parseEther("1000")
    await governanceToken.transfer(voter1.address, tokenAmount)
    await governanceToken.transfer(voter2.address, tokenAmount)
    await governanceToken.transfer(voter3.address, ethers.parseEther("500"))
  })

  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      expect(await votingSystem.owner()).to.equal(owner.address)
    })

    it("Should set the governance token", async () => {
      expect(await votingSystem.governanceToken()).to.equal(await governanceToken.getAddress())
    })

    it("Should start with zero proposals", async () => {
      expect(await votingSystem.proposalCount()).to.equal(0)
    })
  })

  describe("Proposal Creation", () => {
    it("Should create a Yes/No proposal", async () => {
      const deadline = (await time.latest()) + 86400 // 1 day

      await expect(votingSystem.createProposal("Should we upgrade the protocol?", [], deadline, VotingMode.YES_NO))
        .to.emit(votingSystem, "ProposalCreated")
        .withArgs(1, owner.address, "Should we upgrade the protocol?", VotingMode.YES_NO, deadline, await time.latest())

      expect(await votingSystem.proposalCount()).to.equal(1)
    })

    it("Should create a Ranked Choice proposal with options", async () => {
      const deadline = (await time.latest()) + 86400
      const options = ["Option A", "Option B", "Option C"]

      await votingSystem.createProposal("Choose the best option", options, deadline, VotingMode.RANKED_CHOICE)

      const proposalOptions = await votingSystem.getProposalOptions(1)
      expect(proposalOptions).to.deep.equal(options)
    })

    it("Should fail with past deadline", async () => {
      const pastDeadline = (await time.latest()) - 100

      await expect(
        votingSystem.createProposal("Test proposal", [], pastDeadline, VotingMode.YES_NO),
      ).to.be.revertedWith("Deadline must be in the future")
    })

    it("Should fail with empty description", async () => {
      const deadline = (await time.latest()) + 86400

      await expect(votingSystem.createProposal("", [], deadline, VotingMode.YES_NO)).to.be.revertedWith(
        "Description cannot be empty",
      )
    })
  })

  describe("Yes/No Voting", () => {
    let proposalId: number
    let deadline: number

    beforeEach(async () => {
      deadline = (await time.latest()) + 86400
      await votingSystem.createProposal("Yes/No test proposal", [], deadline, VotingMode.YES_NO)
      proposalId = 1
    })

    it("Should allow voting Yes", async () => {
      await expect(votingSystem.connect(voter1).voteYesNo(proposalId, true))
        .to.emit(votingSystem, "VoteSubmitted")
        .withArgs(proposalId, voter1.address, VotingMode.YES_NO, 1, await time.latest())

      const [yes, no, total] = await votingSystem.getYesNoResults(proposalId)
      expect(yes).to.equal(1)
      expect(no).to.equal(0)
      expect(total).to.equal(1)
    })

    it("Should allow voting No", async () => {
      await votingSystem.connect(voter1).voteYesNo(proposalId, false)

      const [yes, no, total] = await votingSystem.getYesNoResults(proposalId)
      expect(yes).to.equal(0)
      expect(no).to.equal(1)
      expect(total).to.equal(1)
    })

    it("Should prevent double voting", async () => {
      await votingSystem.connect(voter1).voteYesNo(proposalId, true)

      await expect(votingSystem.connect(voter1).voteYesNo(proposalId, false)).to.be.revertedWith(
        "Already voted on this proposal",
      )
    })

    it("Should prevent voting after deadline", async () => {
      await time.increaseTo(deadline + 1)

      await expect(votingSystem.connect(voter1).voteYesNo(proposalId, true)).to.be.revertedWith(
        "Voting period has ended",
      )
    })

    it("Should fail with wrong voting mode", async () => {
      // Create a ranked choice proposal
      await votingSystem.createProposal("Ranked choice", ["A", "B"], deadline, VotingMode.RANKED_CHOICE)

      await expect(votingSystem.connect(voter1).voteYesNo(2, true)).to.be.revertedWith("Wrong voting mode")
    })
  })

  describe("Ranked Choice Voting", () => {
    let proposalId: number
    let deadline: number
    const options = ["Alpha", "Beta", "Gamma"]

    beforeEach(async () => {
      deadline = (await time.latest()) + 86400
      await votingSystem.createProposal("Ranked choice test", options, deadline, VotingMode.RANKED_CHOICE)
      proposalId = 1
    })

    it("Should accept valid rankings", async () => {
      const rankings = [0, 1, 2] // Alpha first, Beta second, Gamma third

      await expect(votingSystem.connect(voter1).voteRankedChoice(proposalId, rankings)).to.emit(
        votingSystem,
        "VoteSubmitted",
      )

      const firstChoiceCounts = await votingSystem.getRankedChoiceResults(proposalId)
      expect(firstChoiceCounts[0]).to.equal(1) // Alpha has 1 first-choice vote
    })

    it("Should reject incomplete rankings", async () => {
      const incompleteRankings = [0, 1] // Missing one option

      await expect(votingSystem.connect(voter1).voteRankedChoice(proposalId, incompleteRankings)).to.be.revertedWith(
        "Must rank all options",
      )
    })

    it("Should reject duplicate rankings", async () => {
      const duplicateRankings = [0, 0, 1] // Option 0 ranked twice

      await expect(votingSystem.connect(voter1).voteRankedChoice(proposalId, duplicateRankings)).to.be.revertedWith(
        "Duplicate ranking",
      )
    })

    it("Should reject invalid option index", async () => {
      const invalidRankings = [0, 1, 5] // Option 5 doesn't exist

      await expect(votingSystem.connect(voter1).voteRankedChoice(proposalId, invalidRankings)).to.be.revertedWith(
        "Invalid option index",
      )
    })

    it("Should correctly tally first-choice votes from multiple voters", async () => {
      await votingSystem.connect(voter1).voteRankedChoice(proposalId, [0, 1, 2]) // Alpha first
      await votingSystem.connect(voter2).voteRankedChoice(proposalId, [1, 0, 2]) // Beta first
      await votingSystem.connect(voter3).voteRankedChoice(proposalId, [0, 2, 1]) // Alpha first

      const results = await votingSystem.getRankedChoiceResults(proposalId)
      expect(results[0]).to.equal(2) // Alpha: 2 first-choice
      expect(results[1]).to.equal(1) // Beta: 1 first-choice
      expect(results[2]).to.equal(0) // Gamma: 0 first-choice
    })
  })

  describe("Quadratic Voting", () => {
    let proposalId: number
    let deadline: number
    const options = ["Project A", "Project B"]

    beforeEach(async () => {
      deadline = (await time.latest()) + 86400
      await votingSystem.createProposal("Quadratic vote test", options, deadline, VotingMode.QUADRATIC)
      proposalId = 1

      // Approve tokens for voting
      const votingSystemAddress = await votingSystem.getAddress()
      await governanceToken.connect(voter1).approve(votingSystemAddress, ethers.parseEther("1000"))
      await governanceToken.connect(voter2).approve(votingSystemAddress, ethers.parseEther("1000"))
    })

    it("Should charge quadratic cost", async () => {
      const voteAmount = 3n // 3 votes = 9 tokens cost
      const expectedCost = voteAmount * voteAmount

      const balanceBefore = await governanceToken.balanceOf(voter1.address)

      await votingSystem.connect(voter1).voteQuadratic(proposalId, 0, voteAmount)

      const balanceAfter = await governanceToken.balanceOf(voter1.address)
      expect(balanceBefore - balanceAfter).to.equal(ethers.parseEther(expectedCost.toString()))
    })

    it("Should record quadratic votes correctly", async () => {
      await votingSystem.connect(voter1).voteQuadratic(proposalId, 0, 3) // 3 votes for option 0
      await votingSystem.connect(voter2).voteQuadratic(proposalId, 1, 2) // 2 votes for option 1

      const [voteCounts, tokensStaked] = await votingSystem.getQuadraticResults(proposalId)
      expect(voteCounts[0]).to.equal(3)
      expect(voteCounts[1]).to.equal(2)
      expect(tokensStaked).to.equal(ethers.parseEther("13")) // 9 + 4
    })

    it("Should fail with insufficient balance", async () => {
      const hugeVoteAmount = 1000n // Would cost 1,000,000 tokens

      await expect(votingSystem.connect(voter3).voteQuadratic(proposalId, 0, hugeVoteAmount)).to.be.reverted
    })

    it("Should fail with zero vote amount", async () => {
      await expect(votingSystem.connect(voter1).voteQuadratic(proposalId, 0, 0)).to.be.revertedWith(
        "Vote amount must be positive",
      )
    })
  })

  describe("Weighted Voting", () => {
    let proposalId: number
    let deadline: number
    const options = ["Strategy A", "Strategy B"]

    beforeEach(async () => {
      deadline = (await time.latest()) + 86400
      await votingSystem.createProposal("Weighted vote test", options, deadline, VotingMode.WEIGHTED)
      proposalId = 1
    })

    it("Should use token balance as weight", async () => {
      await votingSystem.connect(voter1).voteWeighted(proposalId, 0)

      const [weights, totalWeight] = await votingSystem.getWeightedResults(proposalId)
      expect(weights[0]).to.equal(ethers.parseEther("1000")) // voter1's balance
      expect(totalWeight).to.equal(ethers.parseEther("1000"))
    })

    it("Should correctly sum weights from multiple voters", async () => {
      await votingSystem.connect(voter1).voteWeighted(proposalId, 0) // 1000 tokens
      await votingSystem.connect(voter2).voteWeighted(proposalId, 0) // 1000 tokens
      await votingSystem.connect(voter3).voteWeighted(proposalId, 1) // 500 tokens

      const [weights, totalWeight] = await votingSystem.getWeightedResults(proposalId)
      expect(weights[0]).to.equal(ethers.parseEther("2000")) // voter1 + voter2
      expect(weights[1]).to.equal(ethers.parseEther("500")) // voter3
      expect(totalWeight).to.equal(ethers.parseEther("2500"))
    })

    it("Should fail with zero token balance", async () => {
      const [, , , zeroBalanceVoter] = await ethers.getSigners()

      await expect(votingSystem.connect(zeroBalanceVoter).voteWeighted(proposalId, 0)).to.be.revertedWith(
        "No voting weight",
      )
    })
  })

  describe("Vote Records", () => {
    let proposalId: number

    beforeEach(async () => {
      const deadline = (await time.latest()) + 86400
      await votingSystem.createProposal("Test proposal", [], deadline, VotingMode.YES_NO)
      proposalId = 1
    })

    it("Should store voter records", async () => {
      await votingSystem.connect(voter1).voteYesNo(proposalId, true)

      const [voter, proposalIds, totalVotes] = await votingSystem.getVoterRecord(voter1.address)
      expect(voter).to.equal(voter1.address)
      expect(proposalIds).to.deep.equal([1n])
      expect(totalVotes).to.equal(1)
    })

    it("Should track multiple votes per voter", async () => {
      const deadline = (await time.latest()) + 86400

      // Create second proposal
      await votingSystem.createProposal("Second proposal", [], deadline, VotingMode.YES_NO)

      await votingSystem.connect(voter1).voteYesNo(1, true)
      await votingSystem.connect(voter1).voteYesNo(2, false)

      const [, proposalIds, totalVotes] = await votingSystem.getVoterRecord(voter1.address)
      expect(proposalIds).to.deep.equal([1n, 2n])
      expect(totalVotes).to.equal(2)
    })

    it("Should correctly check hasVoted", async () => {
      expect(await votingSystem.checkHasVoted(proposalId, voter1.address)).to.be.false

      await votingSystem.connect(voter1).voteYesNo(proposalId, true)

      expect(await votingSystem.checkHasVoted(proposalId, voter1.address)).to.be.true
    })
  })

  describe("Proposal Management", () => {
    let proposalId: number
    let deadline: number

    beforeEach(async () => {
      deadline = (await time.latest()) + 86400
      await votingSystem.connect(voter1).createProposal("Test proposal", [], deadline, VotingMode.YES_NO)
      proposalId = 1
    })

    it("Should allow owner to close proposal", async () => {
      await expect(votingSystem.closeProposal(proposalId))
        .to.emit(votingSystem, "ProposalClosed")
        .withArgs(proposalId, await time.latest())
    })

    it("Should allow creator to close proposal", async () => {
      await expect(votingSystem.connect(voter1).closeProposal(proposalId)).to.emit(votingSystem, "ProposalClosed")
    })

    it("Should prevent non-authorized from closing", async () => {
      await expect(votingSystem.connect(voter2).closeProposal(proposalId)).to.be.revertedWith("Not authorized")
    })

    it("Should prevent voting on closed proposal", async () => {
      await votingSystem.closeProposal(proposalId)

      await expect(votingSystem.connect(voter1).voteYesNo(proposalId, true)).to.be.revertedWith(
        "Proposal is not active",
      )
    })
  })

  describe("Admin Functions", () => {
    it("Should allow owner to set governance token", async () => {
      const NewToken = await ethers.getContractFactory("GovernanceToken")
      const newToken = await NewToken.deploy()

      await expect(votingSystem.setGovernanceToken(await newToken.getAddress())).to.emit(
        votingSystem,
        "GovernanceTokenSet",
      )
    })

    it("Should prevent non-owner from setting token", async () => {
      const NewToken = await ethers.getContractFactory("GovernanceToken")
      const newToken = await NewToken.deploy()

      await expect(votingSystem.connect(voter1).setGovernanceToken(await newToken.getAddress())).to.be.reverted
    })

    it("Should allow owner to withdraw tokens", async () => {
      // First, stake some tokens via quadratic voting
      const deadline = (await time.latest()) + 86400
      await votingSystem.createProposal("Test", ["A", "B"], deadline, VotingMode.QUADRATIC)

      const votingSystemAddress = await votingSystem.getAddress()
      await governanceToken.connect(voter1).approve(votingSystemAddress, ethers.parseEther("100"))
      await votingSystem.connect(voter1).voteQuadratic(1, 0, 3) // 9 tokens staked

      const ownerBalanceBefore = await governanceToken.balanceOf(owner.address)
      await votingSystem.withdrawTokens(owner.address, ethers.parseEther("9"))
      const ownerBalanceAfter = await governanceToken.balanceOf(owner.address)

      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(ethers.parseEther("9"))
    })
  })

  describe("Gas Analysis", () => {
    it("Should measure gas for proposal creation", async () => {
      const deadline = (await time.latest()) + 86400

      const tx = await votingSystem.createProposal(
        "Gas test proposal",
        ["Option 1", "Option 2", "Option 3"],
        deadline,
        VotingMode.RANKED_CHOICE,
      )
      const receipt = await tx.wait()

      console.log(`Gas used for proposal creation: ${receipt?.gasUsed}`)
    })

    it("Should measure gas for Yes/No voting", async () => {
      const deadline = (await time.latest()) + 86400
      await votingSystem.createProposal("Test", [], deadline, VotingMode.YES_NO)

      const tx = await votingSystem.connect(voter1).voteYesNo(1, true)
      const receipt = await tx.wait()

      console.log(`Gas used for Yes/No vote: ${receipt?.gasUsed}`)
    })

    it("Should measure gas for Ranked Choice voting", async () => {
      const deadline = (await time.latest()) + 86400
      await votingSystem.createProposal("Test", ["A", "B", "C", "D", "E"], deadline, VotingMode.RANKED_CHOICE)

      const tx = await votingSystem.connect(voter1).voteRankedChoice(1, [0, 1, 2, 3, 4])
      const receipt = await tx.wait()

      console.log(`Gas used for Ranked Choice vote (5 options): ${receipt?.gasUsed}`)
    })

    it("Should measure gas for Quadratic voting", async () => {
      const deadline = (await time.latest()) + 86400
      await votingSystem.createProposal("Test", ["A", "B"], deadline, VotingMode.QUADRATIC)

      const votingSystemAddress = await votingSystem.getAddress()
      await governanceToken.connect(voter1).approve(votingSystemAddress, ethers.parseEther("100"))

      const tx = await votingSystem.connect(voter1).voteQuadratic(1, 0, 5)
      const receipt = await tx.wait()

      console.log(`Gas used for Quadratic vote: ${receipt?.gasUsed}`)
    })

    it("Should measure gas for Weighted voting", async () => {
      const deadline = (await time.latest()) + 86400
      await votingSystem.createProposal("Test", ["A", "B"], deadline, VotingMode.WEIGHTED)

      const tx = await votingSystem.connect(voter1).voteWeighted(1, 0)
      const receipt = await tx.wait()

      console.log(`Gas used for Weighted vote: ${receipt?.gasUsed}`)
    })
  })
})
