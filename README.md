# On-Chain Voting System

A comprehensive decentralized voting system supporting multiple voting modes: Yes/No, Ranked-Choice, Quadratic, and Weighted voting.

## Architecture

### Smart Contracts (Solidity)
- **VotingSystem.sol** - Main voting contract with 4 voting modes
- **GovernanceToken.sol** - ERC20 governance token for weighted/quadratic voting

### Subgraph (The Graph)
- Indexes all proposals, votes, and voter records
- Provides efficient querying for the frontend

### Backend (Next.js API Routes)
- Queries The Graph subgraph
- Interacts with smart contracts via Viem

### Frontend (Next.js + Wagmi + ConnectKit)
- Proposal list and detail pages
- Mode-specific voting interfaces
- Results dashboards
- On-chain audit log

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm/npm/yarn

### Installation

1. **Clone and install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Set up environment variables:**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Fill in:
   - \`NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS\`
   - \`NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS\`
   - \`NEXT_PUBLIC_RPC_URL\`
   - \`NEXT_PUBLIC_SUBGRAPH_URL\`
   - \`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID\`

3. **Run the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

### Smart Contract Deployment

1. **Navigate to hardhat directory:**
   \`\`\`bash
   cd hardhat
   npm install
   \`\`\`

2. **Set up hardhat environment:**
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. **Run tests:**
   \`\`\`bash
   npm run test
   npm run test:gas  # With gas reporting
   \`\`\`

4. **Deploy to Base Sepolia:**
   \`\`\`bash
   npm run deploy:sepolia
   \`\`\`

### Subgraph Deployment

1. **Navigate to subgraph directory:**
   \`\`\`bash
   cd subgraph
   npm install
   \`\`\`

2. **Update contract address in subgraph.yaml**

3. **Deploy to The Graph:**
   \`\`\`bash
   npm run codegen
   npm run build
   npm run deploy
   \`\`\`

## Voting Modes

### Yes/No
Simple binary voting. Each voter gets 1 vote.

### Ranked-Choice
Voters rank all options in order of preference. Results show first-choice distribution.

### Quadratic
Cost = votes². Voters stake tokens to cast votes, with diminishing returns for concentrated voting power.

### Weighted
Vote weight equals governance token balance. No token staking required.

## Security Features

- ReentrancyGuard on all voting functions
- Double-vote prevention per proposal
- Deadline enforcement
- Owner-only admin functions
- Input validation on all parameters

## License

MIT
