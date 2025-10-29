# Society DAO Treasury: Blockchain Concepts Implementation

## Executive Summary

The Society DAO Treasury project is a comprehensive demonstration of blockchain technology applied to decentralized governance and treasury management. This document explores how fundamental blockchain concepts are implemented through smart contracts, cryptographic primitives, and decentralized protocols to create a secure, transparent, and democratic financial management system.

---

## Table of Contents

1. [Blockchain Fundamentals Applied](#1-blockchain-fundamentals-applied)
2. [Smart Contract Architecture](#2-smart-contract-architecture)
3. [Cryptographic Primitives](#3-cryptographic-primitives)
4. [Decentralization & Consensus](#4-decentralization--consensus)
5. [Token Standards & NFTs](#5-token-standards--nfts)
6. [Governance Mechanisms](#6-governance-mechanisms)
7. [Security & Access Control](#7-security--access-control)
8. [Transparency & Immutability](#8-transparency--immutability)
9. [Gas Optimization](#9-gas-optimization)
10. [Integration with Web3 Ecosystem](#10-integration-with-web3-ecosystem)

---

## 1. Blockchain Fundamentals Applied

### 1.1 Distributed Ledger Technology

**Concept:** All state changes are recorded on the blockchain, creating an immutable, transparent ledger accessible to all participants.

**Implementation:**
- All membership records stored on-chain in the `MembershipSBT` contract
- Treasury balance and transactions recorded in the `Treasury` contract
- Voting records permanently stored in `SocietyGovernor` contract
- Event logs provide complete audit trail of all activities

**Code Example:**
```solidity
// Every action emits events for transparency
event MemberMinted(address indexed to, uint256 tokenId);
event DuesPaid(address indexed member, uint256 amount, string note);
event Deposited(address indexed from, uint256 amount, string note);
```

### 1.2 Blockchain State Management

**Concept:** Smart contracts maintain persistent state that changes through transactions.

**Implementation:**
- Member registry: `mapping(address => bool) public isMember`
- Token ownership: Inherited from ERC721 standard
- Treasury operations: `Op public op` struct stores scheduled payouts
- Voting snapshots: ERC721Votes checkpoints for historical voting power

**State Transitions:**
```solidity
// State transition from non-member to member
function mint(address to) external onlyOwner returns (uint256) {
    require(!isMember[to], "Already member");
    uint256 id = nextId++;
    _mint(to, id);
    isMember[to] = true;
    _delegate(to, to); // self-delegate votes
    emit MemberMinted(to, id);
    return id;
}
```

### 1.3 Transaction Processing

**Concept:** All state changes occur through cryptographically signed transactions that are validated and recorded on the blockchain.

**Implementation:**
- Member minting requires admin signature
- Voting requires member's private key signature
- Proposal execution requires proof of timelock expiration
- Each transaction permanently recorded with sender address, timestamp, and gas cost

---

## 2. Smart Contract Architecture

### 2.1 Three-Contract System Design

**Architecture Pattern:** Separation of concerns through modular contract design.

**MembershipSBT Contract:**
- **Purpose:** Identity and voting power management
- **Responsibilities:** 
  - Mint/revoke soulbound membership tokens
  - Track member status and dues payments
  - Provide voting power through ERC721Votes
  - Prevent token transfers (soulbound property)

**SocietyGovernor Contract:**
- **Purpose:** Democratic decision-making engine
- **Responsibilities:**
  - Accept and manage proposals
  - Conduct votes with configurable parameters
  - Enforce quorum requirements
  - Execute approved proposals

**Treasury Contract:**
- **Purpose:** Secure fund management
- **Responsibilities:**
  - Accept deposits from any address
  - Store community funds
  - Schedule governance-approved payouts
  - Enforce timelock protection

### 2.2 Contract Interaction Flow

```
Member → MembershipSBT (gets token) → SocietyGovernor (creates proposal)
    ↓                                           ↓
Other Members → SocietyGovernor (vote)          ↓
    ↓                                           ↓
Quorum Reached → SocietyGovernor (execute) → Treasury (schedule payout)
    ↓
Timelock Expires → Treasury (execute payout) → Recipient
```

### 2.3 OpenZeppelin Framework Integration

**Concept:** Building on battle-tested, audited contract libraries for security.

**Inherited Contracts:**
- `ERC721`: NFT standard functionality
- `ERC721Votes`: Governance voting with checkpoints
- `Governor`: Core governance logic
- `GovernorSettings`: Configurable voting parameters
- `GovernorCountingSimple`: For/Against/Abstain voting
- `GovernorVotes`: Integration with vote-tracking tokens
- `GovernorVotesQuorumFraction`: Percentage-based quorum
- `Ownable`: Access control for privileged functions

---

## 3. Cryptographic Primitives

### 3.1 Digital Signatures (ECDSA)

**Concept:** All transactions are cryptographically signed using Elliptic Curve Digital Signature Algorithm.

**Implementation:**
- Every vote is signed by the voter's private key
- Member minting signed by admin's private key
- Prevents unauthorized actions and impersonation
- Signature verification happens automatically at protocol level

**Security Properties:**
- **Authentication:** Proves transaction came from specific address
- **Non-repudiation:** Signer cannot deny having signed
- **Integrity:** Any tampering invalidates signature

### 3.2 EIP-712 Typed Data Hashing

**Concept:** Structured data hashing for secure off-chain signatures.

**Implementation in MembershipSBT:**
```solidity
contract MembershipSBT is ERC721, ERC721Votes, Ownable {
    constructor(address admin)
        ERC721("Society Membership", "SBT")
        EIP712("Society Membership", "1")  // Domain separator
        Ownable(admin)
    {}
}
```

**Purpose:**
- Vote delegation signing
- Off-chain governance participation
- Secure meta-transaction support
- Human-readable signature data

### 3.3 Keccak-256 Hashing

**Concept:** Cryptographic hashing for data integrity and proposal identification.

**Implementation:**
- Proposal IDs generated by hashing proposal details
- State root calculations
- Storage slot calculation for mappings
- Event topic generation

**Properties:**
- Deterministic: Same input always produces same hash
- One-way: Cannot reverse hash to get original data
- Collision-resistant: Extremely unlikely two inputs produce same hash

### 3.4 Merkle Proofs (Via Block Structure)

**Concept:** While not directly implemented in contracts, the underlying blockchain uses Merkle trees for efficient verification.

**Application:**
- Transaction receipts stored in Merkle tree
- Allows light clients to verify transactions
- Event logs organized in Merkle structure
- Efficient state root calculation

---

## 4. Decentralization & Consensus

### 4.1 Democratic Voting Mechanism

**Concept:** No single authority controls the treasury; decisions made collectively.

**Implementation:**
```solidity
// One member = one vote (linear voting power)
contract SocietyGovernor is Governor, GovernorVotes {
    // Each membership SBT grants exactly 1 vote
    constructor(IVotes token) GovernorVotes(token) { }
}
```

**Decentralization Features:**
- No admin can unilaterally approve payouts
- Proposal threshold is 0 (any member can propose)
- Quorum enforces minimum participation
- Transparent voting records

### 4.2 Quorum Requirements

**Concept:** Minimum participation threshold to prevent decision-making by small minorities.

**Implementation:**
```solidity
constructor(IVotes token)
    Governor("SocietyGovernor")
    GovernorVotesQuorumFraction(1)  // 1% quorum for demo
{}
```

**Calculation:**
- Quorum = 1% of total voting power at proposal snapshot
- Based on historical checkpoints, not current state
- Prevents manipulation through last-minute membership changes

### 4.3 Voting Delay & Period

**Concept:** Time-based parameters ensure fair participation and prevent flash-loan attacks.

**Implementation:**
```solidity
GovernorSettings(1, 8, 0)
// votingDelay: 1 block
// votingPeriod: 8 blocks  
// proposalThreshold: 0 tokens
```

**Security Benefits:**
- Voting delay prevents same-block proposal and vote
- Voting period allows all members time to participate
- Snapshot-based voting prevents double-counting
- Protection against governance attacks

### 4.4 Timelock Mechanism

**Concept:** Enforced delay between approval and execution prevents immediate fund drainage.

**Implementation:**
```solidity
function schedulePayout(address payable to, uint256 amount, uint64 eta, string calldata note)
    external onlyOwner
{
    require(eta > block.timestamp, "eta in past");
    // Payout scheduled but not executable until eta
}

function executePayout() external {
    require(block.timestamp >= op.eta, "timelocked");
    // Execute after timelock expires
}
```

**Protection:**
- Emergency response window
- Community can detect malicious proposals
- Time to coordinate response to attacks
- Cannot be bypassed, even by governance

---

## 5. Token Standards & NFTs

### 5.1 ERC-721 Non-Fungible Tokens

**Concept:** Each membership is a unique, non-fungible token with a distinct token ID.

**Implementation:**
```solidity
contract MembershipSBT is ERC721, ERC721Votes, Ownable {
    constructor(address admin)
        ERC721("Society Membership", "SBT")
        EIP712("Society Membership", "1")
        Ownable(admin)
    {}
}
```

**Standard Compliance:**
- `balanceOf(address)`: Returns 1 if member, 0 if not
- `ownerOf(tokenId)`: Returns address holding specific token
- `tokenURI(tokenId)`: Can be extended for metadata
- Full ERC-721 interface compatibility

### 5.2 Soulbound Tokens (SBT)

**Concept:** Non-transferable tokens representing identity/membership rather than assets.

**Implementation:**
```solidity
// Override _update to prevent transfers
function _update(address to, uint256 tokenId, address auth)
    internal override(ERC721, ERC721Votes)
    returns (address)
{
    address from = _ownerOf(tokenId);
    if (from != address(0) && to != address(0)) {
        revert("SBT: non-transferable");  // Block transfers
    }
    return super._update(to, tokenId, auth);
}
```

**Properties:**
- Can be minted (created)
- Can be burned (revoked)
- Cannot be transferred or sold
- Represents reputation/membership, not tradeable asset
- Prevents vote buying and gaming

### 5.3 ERC-721 Votes Extension

**Concept:** Voting power delegation and checkpoint system for governance.

**Implementation:**
```solidity
contract MembershipSBT is ERC721, ERC721Votes, Ownable {
    function mint(address to) external onlyOwner returns (uint256) {
        // ...
        _mint(to, id);
        _delegate(to, to); // Automatic self-delegation
    }
}
```

**Features:**
- **Checkpoints:** Historical voting power snapshots
- **Delegation:** Can delegate voting power to others
- **getPastVotes():** Query voting power at specific block
- **getPastTotalSupply():** Historical total supply for quorum

**Why Checkpoints Matter:**
```
Block 100: Alice has 1 vote, creates proposal
Block 101: Alice transfers token (if transferable)
Block 105: Voting happens

Without checkpoints: Alice has 0 votes (exploit)
With checkpoints: Alice has 1 vote at block 100 (secure)
```

---

## 6. Governance Mechanisms

### 6.1 Proposal Lifecycle

**Concept:** Structured process from proposal creation to execution.

**States:**
1. **Pending:** Proposal created, waiting for voting delay
2. **Active:** Voting period is open
3. **Defeated:** Did not reach quorum or majority voted against
4. **Succeeded:** Quorum reached and majority voted for
5. **Queued:** Approved, waiting for timelock (if applicable)
6. **Executed:** Successfully executed

**State Transitions:**
```
Create Proposal → Pending (voting delay)
    ↓
Active (voting period)
    ↓                ↓
Defeated        Succeeded
                    ↓
                Queued (in Treasury)
                    ↓
                Executed
```

### 6.2 Proposal Creation

**Concept:** Any member can propose treasury actions with complete transparency.

**Parameters:**
```solidity
propose(
    address[] targets,      // [treasuryAddress]
    uint256[] values,       // [0]
    bytes[] calldatas,      // [encodedFunctionCall]
    string description      // Human-readable description
)
```

**Example Proposal:**
```javascript
targets: [treasuryAddress]
values: [0]
calldatas: [
  encodeFunctionData('schedulePayout', [
    recipientAddress,
    amountInWei,
    futureTimestamp,
    "Purpose: Team expenses"
  ])
]
description: "Pay 1 ETH to team for Q4 expenses"
```

### 6.3 Voting Mechanism

**Concept:** Members cast weighted votes (one member = one vote in this implementation).

**Vote Types:**
- **For (1):** Support the proposal
- **Against (0):** Oppose the proposal  
- **Abstain (2):** Counted for quorum but not for/against

**Implementation:**
```solidity
// Inherited from GovernorCountingSimple
function castVote(uint256 proposalId, uint8 support) public returns (uint256)
function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason)
function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s)
```

**Voting Power Calculation:**
```solidity
// From ERC721Votes - each token = 1 vote
function getVotes(address account) public view returns (uint256) {
    return _checkpoints[account].latest();
}
```

### 6.4 Proposal Execution

**Concept:** Automatic execution of approved proposals through on-chain transaction.

**Execution Flow:**
```solidity
// Governor calls Treasury.schedulePayout()
function execute(
    address[] targets,
    uint256[] values,
    bytes[] calldatas,
    bytes32 descriptionHash
) public payable returns (uint256)
```

**Security Checks:**
- Proposal must be in "Succeeded" state
- Caller can be anyone (permissionless execution)
- All calls must succeed or entire transaction reverts
- Execution can only happen once

### 6.5 Governance Parameters

**Configuration:**
```solidity
constructor(IVotes token)
    Governor("SocietyGovernor")
    GovernorSettings(
        1,    // votingDelay: blocks before voting starts
        8,    // votingPeriod: blocks voting is open
        0     // proposalThreshold: minimum votes to propose
    )
    GovernorVotes(token)
    GovernorVotesQuorumFraction(1)  // 1% quorum
{}
```

**Parameter Implications:**

| Parameter | Value | Purpose | Security Benefit |
|-----------|-------|---------|------------------|
| Voting Delay | 1 block | Time to review proposal | Prevents flash-loan attacks |
| Voting Period | 8 blocks | Time window to vote | Ensures fair participation |
| Proposal Threshold | 0 | Min tokens to propose | Open participation (any member) |
| Quorum | 1% | Min participation to pass | Prevents minority decisions |

---

## 7. Security & Access Control

### 7.1 Role-Based Access Control (RBAC)

**Concept:** Different addresses have different permissions.

**Implementation:**

**Admin Role (Ownable):**
```solidity
// MembershipSBT admin can:
function mint(address to) external onlyOwner
function revoke(uint256 tokenId) external onlyOwner

// Treasury owner (Governor contract) can:
function schedulePayout(...) external onlyOwner
```

**Member Role (isMember check):**
```solidity
function payDues(string calldata note) external payable {
    require(isMember[msg.sender], "Not member");
}
```

**Public Functions (Anyone):**
```solidity
function deposit(string calldata note) external payable  // Anyone can fund
function executePayout() external  // Anyone can execute after timelock
```

### 7.2 Reentrancy Protection

**Concept:** Prevent recursive calls that could drain funds.

**Implementation:**
```solidity
function executePayout() external {
    require(!op.executed, "done");
    require(block.timestamp >= op.eta, "timelocked");
    
    // Checks-Effects-Interactions Pattern
    // 1. Checks (above)
    
    // 2. Effects (mark executed BEFORE external call)
    address payable recipient = op.to;
    uint256 payout = op.amount;
    string memory note = op.note;
    op.executed = true;  // STATE CHANGE BEFORE CALL
    
    // 3. Interactions (external call last)
    (bool ok, ) = recipient.call{value: payout}("");
    require(ok, "transfer failed");
}
```

**Why This Matters:**
Without this pattern, a malicious recipient could:
1. Receive funds in `executePayout()`
2. Call `executePayout()` again before `executed` is set to true
3. Drain the contract (classic reentrancy attack)

### 7.3 Input Validation

**Concept:** All user inputs validated before processing.

**Examples:**
```solidity
// Prevent zero-value transactions
require(msg.value > 0, "Zero");

// Prevent duplicate memberships
require(!isMember[to], "Already member");

// Prevent past timelock
require(eta > block.timestamp, "eta in past");

// Ensure sufficient balance
require(amount <= address(this).balance, "insufficient");

// Prevent double execution
require(!op.executed, "done");
```

### 7.4 Ownership Transfer Protection

**Concept:** Admin can transfer ownership, but with care.

**Implementation:**
```solidity
// From OpenZeppelin Ownable
function transferOwnership(address newOwner) public virtual onlyOwner {
    require(newOwner != address(0), "Ownable: new owner is the zero address");
    _transferOwnership(newOwner);
}
```

**Usage Pattern:**
- MembershipSBT owner: Initially deployer, can be transferred to multisig
- Treasury owner: Set to Governor contract (governance-controlled)
- Governor has no owner (immutable governance)

### 7.5 Soulbound Security

**Concept:** Non-transferability prevents vote buying and attacks.

**Security Benefits:**
- **No Vote Buying:** Cannot purchase memberships from others
- **No Flash Loans:** Cannot borrow memberships for voting
- **Reputation Integrity:** Membership represents actual participation
- **Sybil Resistance:** Admin controls who gets memberships

**Attack Prevention:**
```
Without SBT:
Alice → buys 10 memberships → votes → sells → no commitment

With SBT:
Alice → gets 1 membership → votes → cannot sell → long-term alignment
```

---

## 8. Transparency & Immutability

### 8.1 Event-Driven Architecture

**Concept:** All important actions emit events for off-chain tracking and transparency.

**Event Categories:**

**Membership Events:**
```solidity
event MemberMinted(address indexed to, uint256 tokenId);
event DuesPaid(address indexed member, uint256 amount, string note);
```

**Treasury Events:**
```solidity
event Deposited(address indexed from, uint256 amount, string note);
event PayoutScheduled(address indexed to, uint256 amount, uint64 eta, string note);
event PayoutExecuted(address indexed to, uint256 amount, string note);
```

**Governance Events (from OpenZeppelin):**
```solidity
event ProposalCreated(uint256 proposalId, ...);
event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason);
event ProposalExecuted(uint256 proposalId);
```

### 8.2 Indexed Parameters

**Concept:** Efficient event filtering using indexed parameters.

**Implementation:**
```solidity
event MemberMinted(address indexed to, uint256 tokenId);
//                          ↑ indexed: can filter by address
```

**Query Examples:**
```javascript
// Get all memberships for specific address
filter: { to: "0x123..." }

// Get all deposits from specific address  
filter: { from: "0x456..." }

// Get all votes by specific voter
filter: { voter: "0x789..." }
```

### 8.3 Complete Audit Trail

**Concept:** Every state change is permanently recorded and queryable.

**What Gets Recorded:**
- **Who:** Transaction sender (msg.sender)
- **What:** Action taken (function called)
- **When:** Block number and timestamp
- **Why:** Description/note in events
- **How Much:** ETH amounts in wei
- **Result:** Success/failure with reason

**Example Audit Query:**
```javascript
// Get all dues payments
const duesEvents = await membershipSBT.queryFilter(
  membershipSBT.filters.DuesPaid()
);

// Result: Complete history of who paid when and how much
```

### 8.4 Immutability Guarantees

**Concept:** Once deployed, contract logic cannot be changed.

**Immutable Elements:**
- Contract bytecode
- Governance parameters (voting delay, period, quorum)
- Token name and symbol
- Contract addresses

**Mutable Elements (by design):**
- Membership roster (mint/revoke)
- Treasury balance (deposits/payouts)
- Scheduled payout (one at a time)
- Ownership (transferable)

**Trade-offs:**
- **Security:** Cannot introduce bugs via upgrades
- **Rigidity:** Cannot fix bugs or add features
- **Trust:** Users know exactly what code will execute

---

## 9. Gas Optimization

### 9.1 Storage Optimization

**Concept:** Minimize expensive storage operations.

**Strategies:**

**Struct Packing:**
```solidity
struct Op {
    address payable to;      // 20 bytes
    uint256 amount;          // 32 bytes
    string note;             // dynamic
    uint64 eta;              // 8 bytes (fits with address in same slot)
    bool executed;           // 1 byte (fits in same slot)
}
```

**Single Storage Slot for Treasury:**
```solidity
Op public op;  // Single struct instead of multiple mappings
```

**Minimal State Variables:**
```solidity
uint256 public nextId = 1;           // Only essential state
mapping(address => bool) public isMember;  // Simple boolean instead of struct
```

### 9.2 Function Modifiers

**Concept:** Reusable validation logic reduces code duplication.

**Implementation:**
```solidity
// From OpenZeppelin Ownable
modifier onlyOwner() {
    require(owner() == _msgSender(), "Ownable: caller is not the owner");
    _;
}

// Usage
function mint(address to) external onlyOwner { }
```

**Benefits:**
- Reduces bytecode size
- Centralizes validation logic
- Makes code more readable
- Saves gas on deployment

### 9.3 Short-Circuit Validation

**Concept:** Fail fast to save gas on invalid transactions.

**Implementation:**
```solidity
function payDues(string calldata note) external payable {
    require(isMember[msg.sender], "Not member");  // Cheap check first
    require(msg.value > 0, "Zero");               // Then validate amount
    emit DuesPaid(msg.sender, msg.value, note);   // Only if valid
}
```

**Ordering Logic:**
1. Cheapest checks first (storage reads)
2. Medium cost checks (balance checks)
3. Expensive operations last (storage writes, external calls)

### 9.4 Calldata vs Memory

**Concept:** `calldata` is cheaper than `memory` for external function parameters.

**Implementation:**
```solidity
function payDues(string calldata note) external payable
//                       ↑ calldata: read-only, cheaper

function executePayout() external {
    string memory note = op.note;
    //     ↑ memory: needed for storage → local variable
}
```

**Gas Savings:**
- `calldata`: Direct reference to transaction data
- `memory`: Copies data to temporary memory

### 9.5 Event vs Storage

**Concept:** Events are much cheaper than storage for historical data.

**Cost Comparison:**
- `SSTORE` (storage write): ~20,000 gas
- `LOG` (event emission): ~375 gas + ~375 gas per indexed topic

**Implementation:**
```solidity
// Store only what's needed for logic
Op public op;

// Emit events for historical record
emit PayoutScheduled(to, amount, eta, note);
```

**Access Pattern:**
- Contract logic: Read from storage
- Frontend/indexers: Query events for history
- Permanent record: Both are permanent, events are cheaper

---

## 10. Integration with Web3 Ecosystem

### 10.1 Web3 Frontend Stack

**Technologies:**

**Wallet Connection:**
- **RainbowKit:** Wallet connection UI components
- **Wagmi:** React hooks for Ethereum
- **Viem:** TypeScript interface to Ethereum

**State Management:**
```javascript
// Wagmi hooks provide reactive blockchain state
const { address } = useAccount();
const { data: balance } = useBalance({ address });
const { data: isMember } = useContractRead({
  address: MEMBERSHIP_ADDRESS,
  abi: MembershipABI,
  functionName: 'isMember',
  args: [address]
});
```

### 10.2 Contract ABI (Application Binary Interface)

**Concept:** JSON interface describing contract functions for off-chain interaction.

**Generation:**
```bash
# Hardhat compiles Solidity → generates ABI
npx hardhat compile

# Output: artifacts/contracts/MembershipSBT.sol/MembershipSBT.json
{
  "abi": [
    {
      "inputs": [{"name": "to", "type": "address"}],
      "name": "mint",
      "outputs": [{"type": "uint256"}],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
}
```

**Frontend Usage:**
```javascript
import contractABIs from './contracts.json';

const { write: mintMember } = useContractWrite({
  address: MEMBERSHIP_ADDRESS,
  abi: contractABIs.MembershipSBT,
  functionName: 'mint'
});

// Call contract function
await mintMember({ args: [recipientAddress] });
```

### 10.3 Transaction Signing & Broadcasting

**Concept:** Frontend prepares transactions, wallet signs, node broadcasts.

**Flow:**
```
1. User clicks "Mint Member"
2. Frontend creates transaction object
3. RainbowKit/Wagmi requests signature from wallet
4. User approves in wallet
5. Wallet signs with private key (ECDSA)
6. Signed transaction sent to RPC node
7. Node validates and broadcasts to network
8. Transaction mined in block
9. Frontend receives confirmation
```

**Implementation:**
```javascript
const { writeAsync: mintMember } = useContractWrite({
  address: MEMBERSHIP_ADDRESS,
  abi: contractABIs.MembershipSBT,
  functionName: 'mint'
});

const handleMint = async () => {
  try {
    const tx = await mintMember({ args: [recipientAddress] });
    await tx.wait(); // Wait for confirmation
    console.log('Minted!');
  } catch (error) {
    console.error('Failed:', error);
  }
};
```

### 10.4 Event Listening & Real-Time Updates

**Concept:** Frontend subscribes to contract events for live updates.

**Implementation:**
```javascript
// Watch for new memberships
useContractEvent({
  address: MEMBERSHIP_ADDRESS,
  abi: contractABIs.MembershipSBT,
  eventName: 'MemberMinted',
  listener(logs) {
    console.log('New member:', logs[0].args.to);
    // Update UI
  }
});

// Watch for votes
useContractEvent({
  address: GOVERNOR_ADDRESS,
  abi: contractABIs.SocietyGovernor,
  eventName: 'VoteCast',
  listener(logs) {
    const { voter, proposalId, support } = logs[0].args;
    // Update vote counts in real-time
  }
});
```

### 10.5 Hardhat Development Environment

**Concept:** Local blockchain for rapid development and testing.

**Features:**

**Local Network:**
```bash
npx hardhat node
# Starts local Ethereum node at http://127.0.0.1:8545
# Chain ID: 31337
# 20 accounts with 10,000 ETH each
```

**Deployment Scripts:**
```javascript
// scripts/deploy-local.ts
const membershipSBT = await MembershipSBT.deploy(admin);
await membershipSBT.waitForDeployment();

const governor = await SocietyGovernor.deploy(membershipSBT.target);
const treasury = await Treasury.deploy(governor.target);

// Save addresses for frontend
fs.writeFileSync('frontend/src/contracts.json', JSON.stringify({
  MembershipSBT: { address: membershipSBT.target, abi: MembershipABI },
  // ...
}));
```

**Time Manipulation:**
```javascript
// Advance blockchain for testing
await network.provider.send("evm_increaseTime", [3600]); // +1 hour
await network.provider.send("evm_mine"); // Mine block
```

### 10.6 RPC (Remote Procedure Call) Communication

**Concept:** JSON-RPC protocol for blockchain interaction.

**Common Methods:**
```javascript
// Get block number
eth_blockNumber

// Get account balance
eth_getBalance(address)

// Send transaction
eth_sendTransaction(txObject)

// Get transaction receipt
eth_getTransactionReceipt(txHash)

// Call contract (read-only)
eth_call(txObject)

// Get logs/events
eth_getLogs(filterObject)
```

**Frontend Usage (via Viem):**
```javascript
const client = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545')
});

const blockNumber = await client.getBlockNumber();
const balance = await client.getBalance({ address: '0x...' });
```

### 10.7 Multi-Wallet Support

**Concept:** Users can connect various wallets to interact with dApp.

**Supported Wallets (via RainbowKit):**
- MetaMask
- Brave Wallet
- WalletConnect
- Coinbase Wallet
- Rainbow Wallet

**Configuration:**
```javascript
import { getDefaultWallets } from '@rainbow-me/rainbowkit';

const { connectors } = getDefaultWallets({
  appName: 'Society DAO Treasury',
  projectId: 'YOUR_PROJECT_ID',
  chains: [hardhat]
});
```

### 10.8 Network Configuration

**Concept:** Support for multiple blockchain networks.

**Hardhat Config:**
```typescript
networks: {
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337
  },
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  },
  mainnet: {
    url: process.env.MAINNET_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

**Frontend Network Switching:**
```javascript
import { useSwitchNetwork } from 'wagmi';

const { switchNetwork } = useSwitchNetwork();

// User can switch between networks
switchNetwork?.(31337); // Switch to local Hardhat
```

---

## Conclusion

The Society DAO Treasury project demonstrates a comprehensive implementation of blockchain technology for decentralized governance. It leverages core blockchain concepts including:

**Cryptographic Security:**
- ECDSA signatures for transaction authentication
- EIP-712 for typed data signing
- Keccak-256 hashing for data integrity

**Decentralized Consensus:**
- Democratic voting with quorum requirements
- Timelock mechanisms for security
- No single point of control

**Token Standards:**
- ERC-721 for membership NFTs
- Soulbound tokens to prevent gaming
- ERC-721Votes for snapshot-based governance

**Smart Contract Architecture:**
- Modular design with separation of concerns
- OpenZeppelin battle-tested components
- Role-based access control

**Transparency & Immutability:**
- All actions recorded on-chain
- Event-driven audit trail
- Permanent, tamper-proof records

**Web3 Integration:**
- Modern frontend stack (Next.js + Wagmi + Viem)
- Wallet connectivity via RainbowKit
- Real-time blockchain state synchronization

This system showcases how blockchain technology enables trustless, transparent, and democratic management of shared resources without central authority, making it an excellent example of decentralized autonomous organization (DAO) principles in practice.

---

## Technical Specifications

**Smart Contracts:**
- Solidity: ^0.8.20
- OpenZeppelin Contracts: 5.4.0
- Hardhat: 3.0.7

**Frontend:**
- Next.js: 15.5.5
- React: 19.1.0
- Wagmi: 2.18.2
- Viem: 2.38.4
- RainbowKit: 2.2.9

**Blockchain:**
- EVM-compatible networks
- Gas optimization techniques
- Deterministic deployment

**Security Features:**
- Reentrancy protection
- Input validation
- Access control
- Timelock mechanisms
- Soulbound tokens
- Checkpoint-based voting

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Project:** Society DAO Treasury  
**License:** ISC
