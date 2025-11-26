// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title VotingSystem
 * @dev A comprehensive on-chain voting system supporting multiple voting modes
 * @notice Supports Yes/No, Ranked-Choice, Quadratic, and Weighted voting
 */
contract VotingSystem is Ownable, ReentrancyGuard {
    // ============ Enums ============
    enum VotingMode {
        YES_NO,
        RANKED_CHOICE,
        QUADRATIC,
        WEIGHTED
    }

    enum ProposalStatus {
        ACTIVE,
        CLOSED,
        CANCELLED
    }

    // ============ Structs ============
    struct Proposal {
        uint256 id;
        address creator;
        string description;
        string[] options;
        uint256 deadline;
        VotingMode votingMode;
        ProposalStatus status;
        uint256 createdAt;
        uint256 totalVotes;
    }

    struct Vote {
        address voter;
        uint256 proposalId;
        VotingMode voteType;
        uint256 weight;
        uint256 timestamp;
        bytes voteData; // Flexible storage for different vote types
    }

    struct VoterRecord {
        address voter;
        uint256[] proposalIds;
        uint256 totalVotesCast;
    }

    // ============ State Variables ============
    uint256 public proposalCount;
    IERC20 public governanceToken;
    
    // Proposal storage
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => string[]) public proposalOptions;
    
    // Vote storage
    mapping(uint256 => Vote[]) public proposalVotes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => Vote)) public voterVotes;
    
    // Voter records
    mapping(address => VoterRecord) public voterRecords;
    
    // Yes/No vote tallies
    mapping(uint256 => uint256) public yesVotes;
    mapping(uint256 => uint256) public noVotes;
    
    // Ranked choice tallies: proposalId => optionIndex => rank => count
    mapping(uint256 => mapping(uint256 => mapping(uint256 => uint256))) public rankedChoiceVotes;
    
    // Quadratic vote tallies: proposalId => optionIndex => totalQuadraticVotes
    mapping(uint256 => mapping(uint256 => uint256)) public quadraticVotes;
    mapping(uint256 => uint256) public totalTokensStaked;
    
    // Weighted vote tallies: proposalId => optionIndex => totalWeight
    mapping(uint256 => mapping(uint256 => uint256)) public weightedVotes;

    // ============ Events ============
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        string description,
        VotingMode votingMode,
        uint256 deadline,
        uint256 timestamp
    );

    event VoteSubmitted(
        uint256 indexed proposalId,
        address indexed voter,
        VotingMode voteType,
        uint256 weight,
        uint256 timestamp
    );

    event VoteCounted(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 weight
    );

    event ProposalClosed(
        uint256 indexed proposalId,
        uint256 timestamp
    );

    event GovernanceTokenSet(
        address indexed tokenAddress
    );

    // ============ Constructor ============
    constructor(address _governanceToken) Ownable(msg.sender) {
        if (_governanceToken != address(0)) {
            governanceToken = IERC20(_governanceToken);
            emit GovernanceTokenSet(_governanceToken);
        }
    }

    // ============ Modifiers ============
    modifier proposalExists(uint256 _proposalId) {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Proposal does not exist");
        _;
    }

    modifier proposalActive(uint256 _proposalId) {
        require(proposals[_proposalId].status == ProposalStatus.ACTIVE, "Proposal is not active");
        require(block.timestamp < proposals[_proposalId].deadline, "Voting period has ended");
        _;
    }

    modifier hasNotVoted(uint256 _proposalId) {
        require(!hasVoted[_proposalId][msg.sender], "Already voted on this proposal");
        _;
    }

    // ============ Proposal Management ============
    
    /**
     * @dev Creates a new proposal
     * @param _description Description of the proposal
     * @param _options Array of voting options
     * @param _deadline Unix timestamp for voting deadline
     * @param _votingMode The voting mode for this proposal
     */
    function createProposal(
        string memory _description,
        string[] memory _options,
        uint256 _deadline,
        VotingMode _votingMode
    ) external returns (uint256) {
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        // Validate options based on voting mode
        if (_votingMode == VotingMode.YES_NO) {
            require(_options.length == 0 || _options.length == 2, "Yes/No requires 0 or 2 options");
        } else {
            require(_options.length >= 2, "Need at least 2 options");
        }

        proposalCount++;
        uint256 newProposalId = proposalCount;

        // Set default options for Yes/No if none provided
        string[] memory finalOptions;
        if (_votingMode == VotingMode.YES_NO && _options.length == 0) {
            finalOptions = new string[](2);
            finalOptions[0] = "Yes";
            finalOptions[1] = "No";
        } else {
            finalOptions = _options;
        }

        proposals[newProposalId] = Proposal({
            id: newProposalId,
            creator: msg.sender,
            description: _description,
            options: finalOptions,
            deadline: _deadline,
            votingMode: _votingMode,
            status: ProposalStatus.ACTIVE,
            createdAt: block.timestamp,
            totalVotes: 0
        });

        // Store options separately for easier access
        for (uint256 i = 0; i < finalOptions.length; i++) {
            proposalOptions[newProposalId].push(finalOptions[i]);
        }

        emit ProposalCreated(
            newProposalId,
            msg.sender,
            _description,
            _votingMode,
            _deadline,
            block.timestamp
        );

        return newProposalId;
    }

    /**
     * @dev Closes a proposal (only owner or creator)
     */
    function closeProposal(uint256 _proposalId) 
        external 
        proposalExists(_proposalId) 
    {
        require(
            msg.sender == owner() || msg.sender == proposals[_proposalId].creator,
            "Not authorized"
        );
        proposals[_proposalId].status = ProposalStatus.CLOSED;
        emit ProposalClosed(_proposalId, block.timestamp);
    }

    // ============ Voting Functions ============

    /**
     * @dev Cast a Yes/No vote
     * @param _proposalId The proposal to vote on
     * @param _voteYes True for Yes, False for No
     */
    function voteYesNo(uint256 _proposalId, bool _voteYes)
        external
        nonReentrant
        proposalExists(_proposalId)
        proposalActive(_proposalId)
        hasNotVoted(_proposalId)
    {
        require(proposals[_proposalId].votingMode == VotingMode.YES_NO, "Wrong voting mode");

        hasVoted[_proposalId][msg.sender] = true;
        
        uint256 weight = 1;
        
        if (_voteYes) {
            yesVotes[_proposalId]++;
        } else {
            noVotes[_proposalId]++;
        }

        bytes memory voteData = abi.encode(_voteYes);
        _recordVote(_proposalId, weight, voteData);

        emit VoteSubmitted(_proposalId, msg.sender, VotingMode.YES_NO, weight, block.timestamp);
        emit VoteCounted(_proposalId, msg.sender, weight);
    }

    /**
     * @dev Cast a ranked-choice vote
     * @param _proposalId The proposal to vote on
     * @param _rankings Array of option indices in order of preference (first = most preferred)
     */
    function voteRankedChoice(uint256 _proposalId, uint256[] calldata _rankings)
        external
        nonReentrant
        proposalExists(_proposalId)
        proposalActive(_proposalId)
        hasNotVoted(_proposalId)
    {
        require(proposals[_proposalId].votingMode == VotingMode.RANKED_CHOICE, "Wrong voting mode");
        
        uint256 optionCount = proposalOptions[_proposalId].length;
        require(_rankings.length == optionCount, "Must rank all options");
        
        // Validate rankings (each option must appear exactly once)
        bool[] memory seen = new bool[](optionCount);
        for (uint256 i = 0; i < _rankings.length; i++) {
            require(_rankings[i] < optionCount, "Invalid option index");
            require(!seen[_rankings[i]], "Duplicate ranking");
            seen[_rankings[i]] = true;
        }

        hasVoted[_proposalId][msg.sender] = true;

        // Record rankings: rank 0 = most preferred
        for (uint256 rank = 0; rank < _rankings.length; rank++) {
            uint256 optionIndex = _rankings[rank];
            rankedChoiceVotes[_proposalId][optionIndex][rank]++;
        }

        bytes memory voteData = abi.encode(_rankings);
        _recordVote(_proposalId, 1, voteData);

        emit VoteSubmitted(_proposalId, msg.sender, VotingMode.RANKED_CHOICE, 1, block.timestamp);
        emit VoteCounted(_proposalId, msg.sender, 1);
    }

    /**
     * @dev Cast a quadratic vote (cost = votes²)
     * @param _proposalId The proposal to vote on
     * @param _optionIndex The option to vote for
     * @param _voteAmount Number of votes to cast (cost = voteAmount²)
     */
    function voteQuadratic(uint256 _proposalId, uint256 _optionIndex, uint256 _voteAmount)
        external
        nonReentrant
        proposalExists(_proposalId)
        proposalActive(_proposalId)
        hasNotVoted(_proposalId)
    {
        require(proposals[_proposalId].votingMode == VotingMode.QUADRATIC, "Wrong voting mode");
        require(_optionIndex < proposalOptions[_proposalId].length, "Invalid option");
        require(_voteAmount > 0, "Vote amount must be positive");
        require(address(governanceToken) != address(0), "Governance token not set");

        // Calculate quadratic cost
        uint256 cost = _voteAmount * _voteAmount;
        
        // Transfer tokens from voter
        require(
            governanceToken.transferFrom(msg.sender, address(this), cost),
            "Token transfer failed"
        );

        hasVoted[_proposalId][msg.sender] = true;
        quadraticVotes[_proposalId][_optionIndex] += _voteAmount;
        totalTokensStaked[_proposalId] += cost;

        bytes memory voteData = abi.encode(_optionIndex, _voteAmount, cost);
        _recordVote(_proposalId, _voteAmount, voteData);

        emit VoteSubmitted(_proposalId, msg.sender, VotingMode.QUADRATIC, _voteAmount, block.timestamp);
        emit VoteCounted(_proposalId, msg.sender, _voteAmount);
    }

    /**
     * @dev Cast a weighted vote (weight = token balance)
     * @param _proposalId The proposal to vote on
     * @param _optionIndex The option to vote for
     */
    function voteWeighted(uint256 _proposalId, uint256 _optionIndex)
        external
        nonReentrant
        proposalExists(_proposalId)
        proposalActive(_proposalId)
        hasNotVoted(_proposalId)
    {
        require(proposals[_proposalId].votingMode == VotingMode.WEIGHTED, "Wrong voting mode");
        require(_optionIndex < proposalOptions[_proposalId].length, "Invalid option");
        require(address(governanceToken) != address(0), "Governance token not set");

        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting weight");

        hasVoted[_proposalId][msg.sender] = true;
        weightedVotes[_proposalId][_optionIndex] += weight;

        bytes memory voteData = abi.encode(_optionIndex, weight);
        _recordVote(_proposalId, weight, voteData);

        emit VoteSubmitted(_proposalId, msg.sender, VotingMode.WEIGHTED, weight, block.timestamp);
        emit VoteCounted(_proposalId, msg.sender, weight);
    }

    // ============ Internal Functions ============

    function _recordVote(uint256 _proposalId, uint256 _weight, bytes memory _voteData) internal {
        Vote memory newVote = Vote({
            voter: msg.sender,
            proposalId: _proposalId,
            voteType: proposals[_proposalId].votingMode,
            weight: _weight,
            timestamp: block.timestamp,
            voteData: _voteData
        });

        proposalVotes[_proposalId].push(newVote);
        voterVotes[_proposalId][msg.sender] = newVote;
        proposals[_proposalId].totalVotes++;

        // Update voter record
        voterRecords[msg.sender].voter = msg.sender;
        voterRecords[msg.sender].proposalIds.push(_proposalId);
        voterRecords[msg.sender].totalVotesCast++;
    }

    // ============ Result Calculation Functions ============

    /**
     * @dev Get Yes/No voting results
     */
    function getYesNoResults(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (uint256 yes, uint256 no, uint256 total)
    {
        require(proposals[_proposalId].votingMode == VotingMode.YES_NO, "Wrong voting mode");
        return (yesVotes[_proposalId], noVotes[_proposalId], yesVotes[_proposalId] + noVotes[_proposalId]);
    }

    /**
     * @dev Get ranked-choice voting results (first-choice counts)
     */
    function getRankedChoiceResults(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (uint256[] memory firstChoiceCounts)
    {
        require(proposals[_proposalId].votingMode == VotingMode.RANKED_CHOICE, "Wrong voting mode");
        
        uint256 optionCount = proposalOptions[_proposalId].length;
        firstChoiceCounts = new uint256[](optionCount);
        
        for (uint256 i = 0; i < optionCount; i++) {
            firstChoiceCounts[i] = rankedChoiceVotes[_proposalId][i][0]; // Rank 0 = first choice
        }
        
        return firstChoiceCounts;
    }

    /**
     * @dev Get full ranked-choice data for instant runoff calculation
     */
    function getRankedChoiceFullResults(uint256 _proposalId, uint256 _optionIndex)
        external
        view
        proposalExists(_proposalId)
        returns (uint256[] memory rankCounts)
    {
        require(proposals[_proposalId].votingMode == VotingMode.RANKED_CHOICE, "Wrong voting mode");
        
        uint256 optionCount = proposalOptions[_proposalId].length;
        require(_optionIndex < optionCount, "Invalid option");
        
        rankCounts = new uint256[](optionCount);
        for (uint256 rank = 0; rank < optionCount; rank++) {
            rankCounts[rank] = rankedChoiceVotes[_proposalId][_optionIndex][rank];
        }
        
        return rankCounts;
    }

    /**
     * @dev Get quadratic voting results
     */
    function getQuadraticResults(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (uint256[] memory voteCounts, uint256 tokensStaked)
    {
        require(proposals[_proposalId].votingMode == VotingMode.QUADRATIC, "Wrong voting mode");
        
        uint256 optionCount = proposalOptions[_proposalId].length;
        voteCounts = new uint256[](optionCount);
        
        for (uint256 i = 0; i < optionCount; i++) {
            voteCounts[i] = quadraticVotes[_proposalId][i];
        }
        
        return (voteCounts, totalTokensStaked[_proposalId]);
    }

    /**
     * @dev Get weighted voting results
     */
    function getWeightedResults(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (uint256[] memory weights, uint256 totalWeight)
    {
        require(proposals[_proposalId].votingMode == VotingMode.WEIGHTED, "Wrong voting mode");
        
        uint256 optionCount = proposalOptions[_proposalId].length;
        weights = new uint256[](optionCount);
        
        for (uint256 i = 0; i < optionCount; i++) {
            weights[i] = weightedVotes[_proposalId][i];
            totalWeight += weights[i];
        }
        
        return (weights, totalWeight);
    }

    // ============ View Functions ============

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (
            uint256 id,
            address creator,
            string memory description,
            string[] memory options,
            uint256 deadline,
            VotingMode votingMode,
            ProposalStatus status,
            uint256 createdAt,
            uint256 totalVotes
        )
    {
        Proposal storage p = proposals[_proposalId];
        return (
            p.id,
            p.creator,
            p.description,
            proposalOptions[_proposalId],
            p.deadline,
            p.votingMode,
            p.status,
            p.createdAt,
            p.totalVotes
        );
    }

    /**
     * @dev Get all votes for a proposal
     */
    function getProposalVotes(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (Vote[] memory)
    {
        return proposalVotes[_proposalId];
    }

    /**
     * @dev Get voter's vote on a specific proposal
     */
    function getVoterVote(uint256 _proposalId, address _voter)
        external
        view
        proposalExists(_proposalId)
        returns (Vote memory)
    {
        return voterVotes[_proposalId][_voter];
    }

    /**
     * @dev Get voter's record
     */
    function getVoterRecord(address _voter)
        external
        view
        returns (
            address voter,
            uint256[] memory proposalIds,
            uint256 totalVotesCast
        )
    {
        VoterRecord storage record = voterRecords[_voter];
        return (record.voter, record.proposalIds, record.totalVotesCast);
    }

    /**
     * @dev Get proposal options
     */
    function getProposalOptions(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (string[] memory)
    {
        return proposalOptions[_proposalId];
    }

    /**
     * @dev Check if address has voted on proposal
     */
    function checkHasVoted(uint256 _proposalId, address _voter)
        external
        view
        returns (bool)
    {
        return hasVoted[_proposalId][_voter];
    }

    // ============ Admin Functions ============

    /**
     * @dev Set governance token address
     */
    function setGovernanceToken(address _tokenAddress) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        governanceToken = IERC20(_tokenAddress);
        emit GovernanceTokenSet(_tokenAddress);
    }

    /**
     * @dev Withdraw staked tokens (for quadratic voting refunds or treasury)
     */
    function withdrawTokens(address _to, uint256 _amount) external onlyOwner {
        require(address(governanceToken) != address(0), "No governance token");
        require(governanceToken.transfer(_to, _amount), "Transfer failed");
    }
}
