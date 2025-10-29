# Society DAO Treasury - Complete Demo Guide

Step-by-step instructions to run and demonstrate all features of the Society DAO Treasury system.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Wallet Configuration](#wallet-configuration)
- [Running the Demo](#running-the-demo)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What This System Does

Society DAO Treasury is a complete decentralized governance system for managing community funds through democratic voting.

**Smart Contracts:**
- **MembershipSBT**: Non-transferable membership tokens (soulbound NFTs)
- **SocietyGovernor**: OpenZeppelin Governor for proposal voting (1 member = 1 vote)
- **Treasury**: Timelock-protected fund management

**Key Features:**
- Admin mints membership tokens to participants
- Members pay dues and participate in governance
- Anyone can deposit funds to treasury
- Members create and vote on payout proposals
- Approved proposals schedule timelocked payouts
- Anyone can execute payouts after timelock expires

**Governance Parameters:**
- Voting Delay: 1 block
- Voting Period: 8 blocks
- Quorum: 1% of total voting power
- Proposal Threshold: 0 tokens (any member can propose)

---

## Prerequisites

**Required:**
- Node.js v18+ and npm
- Brave Browser with Brave Wallet (or any Web3 wallet)

**Check versions:**
```bash
node --version  # Should be v18 or higher
npm --version
```

---

## Setup

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Start Local Blockchain

**Terminal 1:**
```bash
npx hardhat node
```

This starts a local Ethereum blockchain on `http://127.0.0.1:8545` (Chain ID: 31337) with 20 accounts, each having 10,000 ETH.

**Important:** Copy private keys for Accounts #0, #1, and #2. Example output:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

**Keep Terminal 1 running.**

### 3. Deploy Contracts

**Terminal 2:**
```bash
npx hardhat run scripts/deploy-local.ts --network localhost
```

Output shows contract addresses and generates `frontend/src/contracts.json`:
```
SBT: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Governor: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Treasury: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
Wrote frontend/src/contracts.json
```

### 4. Start Frontend

**Terminal 2 (or new terminal):**
```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in Brave Browser.

---

## Wallet Configuration

### Add Hardhat Network to Brave Wallet

1. Open Brave Wallet → **Settings** → **Networks** → **Add**
2. Enter network details:
   - **Network Name**: `Hardhat Local`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Click **Save**

### Import Test Accounts

Import three accounts using their private keys from Terminal 1:

**Account #0 - Admin:**
- Import private key from Account #0
- Rename to "Admin Account"
- This account deploys contracts and mints memberships

**Account #1 - Member 1:**
- Import private key from Account #1
- Rename to "Member 1"

**Account #2 - Member 2:**
- Import private key from Account #2
- Rename to "Member 2"

### Switch to Hardhat Local Network

In Brave Wallet, select **Hardhat Local** from the network dropdown. Verify each account shows ~10,000 ETH.

---

## Running the Demo

### Phase 1: Connect Wallet

1. Navigate to `http://localhost:3000`
2. Click **Connect Wallet**
3. Select **Brave Wallet**
4. Approve connection
5. Verify you're connected as **Admin Account**

The home page shows:
- Welcome message
- Navigation cards (Members, Dues, Proposals, Treasury)
- Quick demo steps

---

### Phase 2: Mint Memberships

**Page:** `/members`

**Connected as:** Admin Account (Account #0)

**Steps:**
1. Click **Members** in navigation
2. Note "Next Token ID" shows `#1`
3. In "Mint Membership" section:
   - Enter Member 1 address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - Click **Mint Membership**
   - Approve transaction in wallet
4. Wait for success message (green checkmark)
5. Next Token ID updates to `#2`

6. Repeat for Member 2:
   - Enter Member 2 address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - Click **Mint Membership**
   - Approve transaction
7. Next Token ID now shows `#3`

**Verify:**
- Switch to Member 1 in wallet
- Refresh Members page
- "Your Account" section shows: **"Status: ✓ Member"**

**What happened:**
- Admin minted non-transferable membership tokens
- Members automatically delegated votes to themselves
- Each member now has 1 vote in governance

---

### Phase 3: Pay Dues

**Page:** `/dues`

**Connected as:** Member 1

**Steps:**
1. Click **Dues** in navigation
2. Enter amount: `0.5`
3. Enter note: `Monthly dues payment`
4. Click **Pay Dues**
5. Approve transaction

**Connected as:** Member 2

6. Switch wallet to Member 2
7. Refresh page
8. Enter amount: `1.0`
9. Enter note: `Annual membership`
10. Click **Pay Dues**
11. Approve transaction

**What happened:**
- Members paid dues to MembershipSBT contract
- Only members can pay dues (enforced by `isMember` check)
- Events emitted for tracking payments

---

### Phase 4: Fund Treasury

**Page:** `/treasury`

**Connected as:** Admin Account (or any account)

**Steps:**
1. Click **Treasury** in navigation
2. View current balance (should be 0 ETH initially)
3. In "Deposit to Treasury" section:
   - Enter amount: `10`
   - Enter note: `Initial funding`
   - Click **Deposit**
   - Approve transaction
4. Treasury balance updates to 10 ETH

**Optional:** Deposit more from Member 1
5. Switch to Member 1
6. Deposit `5` ETH with note: `Community contribution`
7. Treasury balance now shows 15 ETH

**What happened:**
- Funds deposited directly to Treasury contract
- Anyone can deposit (no membership required)
- Treasury is owned by Governor contract

---

### Phase 5: Create Proposal

**Page:** `/proposals`

**Connected as:** Member 1

**Steps:**
1. Click **Proposals** in navigation
2. In "Create Proposal" form:
   - **Recipient Address**: Enter Account #3 address  
     (Example: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`)
   - **Amount (ETH)**: `2`
   - **Timelock (seconds)**: `60`
   - **Description**: `Grant for community development`
3. Click **Create Proposal**
4. Approve transaction
5. Wait for confirmation

**Important - Copy Proposal ID:**
- After creation, a Proposal ID is displayed (e.g., `0x1234...`)
- **Copy this ID** - you'll need it for voting, especially from other accounts
- Other members won't see the proposal automatically and must paste this ID

**What happened:**
- Proposal created to schedule a 2 ETH payout
- Proposal enters "Pending" state (1 block voting delay)
- After delay, voting becomes active for 8 blocks
- If approved, payout will have 60-second timelock

---

### Phase 6: Vote on Proposal

**Advance Past Voting Delay:**

The governor has a 1-block voting delay. You must mine a block before voting becomes active.

**Option 1 - Mine block via script (Terminal 2):**
```bash
npx hardhat run scripts/advance-time.ts --network localhost
```

**Option 2 - Mine block via curl/HTTP request:**

*Linux/Mac/Git Bash:*
```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' http://127.0.0.1:8545
```

*Windows PowerShell:*
```powershell
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"
```

**Option 3 - Natural block mining:**
Make any transaction (like a small treasury deposit) to mine a block naturally.

**Vote FOR (Member 1):**

**Connected as:** Member 1

1. **Copy the Proposal ID** displayed after creation (starts with `0x...`)
2. Refresh Proposals page
3. Scroll to "Vote on Proposal" section
4. The Proposal ID should be pre-filled in the blue box
5. Click **Vote For** button
6. Approve transaction

**Vote FOR (Member 2):**

7. Switch wallet to Member 2
8. Refresh Proposals page
9. **Paste the Proposal ID** into the "Enter Proposal ID to Vote" field
   - The Proposal ID is not automatically visible to other accounts
   - You must copy it from Member 1's screen and paste it here
10. Click **Vote For** button
11. Approve transaction

**End Voting Period:**

**Terminal 2:**
```bash
npx hardhat run scripts/advance-time.ts --network localhost
```

This advances time enough to end the 8-block voting period.

**What happened:**
- Both members voted in favor
- Quorum requirement met (1% of 2 members = 1 vote minimum)
- Majority voted FOR
- Proposal state changes to "Succeeded"

---

### Phase 7: Queue and Execute Proposal

**Page:** `/proposals`

**Connected as:** Any member

**Queue the Proposal:**
1. Refresh Proposals page
2. Proposal state shows "Succeeded"
3. Click **Queue Proposal** button
4. Approve transaction
5. Status changes to "Queued"

**Execute the Proposal:**
6. Click **Execute Proposal** button
7. Approve transaction
8. Governor calls `Treasury.schedulePayout()`

**What happened:**
- Proposal queued through Governor workflow
- Executing calls `schedulePayout` on Treasury contract
- Payout scheduled with 60-second timelock
- Recipient, amount, and ETA stored in Treasury

---

### Phase 8: Execute Treasury Payout

**Page:** `/treasury`

**Connected as:** Any account (even non-members)

**View Pending Payout:**
1. Navigate to Treasury page
2. Scroll to "Pending Payout" section
3. See:
   - Recipient address
   - Amount: 2 ETH
   - ETA timestamp
   - Countdown timer

**Wait for Timelock:**

**Option 1 - Real-time (60 seconds):**
Wait 1 minute watching the countdown.

**Option 2 - Fast-forward (recommended):**

**Terminal 2:**
```bash
npx hardhat run scripts/advance-time.ts --network localhost
```

This automatically advances past the payout ETA.

**Execute Payout:**
1. Refresh Treasury page
2. **Execute Payout** button becomes enabled
3. Click **Execute Payout**
4. Approve transaction

**Verify:**
- 2 ETH transferred from Treasury to recipient
- Treasury balance decreased by 2 ETH
- Check recipient's balance in wallet (should show +2 ETH)
- Payout marked as executed

**What happened:**
- Timelock protection ensured payout wasn't rushed
- Anyone could execute (permissionless after timelock)
- Treasury balance and payout state updated
- Complete governance workflow executed

---

## Advanced Features

### Soulbound Token Verification

**Test non-transferability:**
1. Try transferring membership token to another address (using contract interaction)
2. Transaction reverts with "SBT: non-transferable"
3. Tokens can only be minted and burned, never transferred

### Voting Power Mechanics

- Each membership token = exactly 1 vote
- Uses ERC721Votes for snapshot-based voting
- Votes auto-delegated to token holder on mint
- Voting power determined at proposal creation block

### Quorum Dynamics

- Governor requires 1% quorum
- With 2 members: minimum 1 vote needed (1% of 2 ≈ 0.02, rounds up)
- With 100 members: minimum 1 vote needed
- With 200 members: minimum 2 votes needed

### Proposal State Machine

Proposals progress through states:
1. **Pending** → Voting delay period (1 block)
2. **Active** → Voting in progress (8 blocks)
3. **Succeeded** → Passed, ready to queue
4. **Queued** → Scheduled for execution
5. **Executed** → Payout scheduled in Treasury
6. **Defeated** → Failed (quorum not met or majority voted against)

### Revoke Membership

**Connected as:** Admin Account

**Steps:**
1. Go to Members page
2. In "Revoke Membership" section:
   - Enter Token ID (e.g., `1`)
   - Click **Revoke Membership**
   - Approve transaction

**Result:**
- Token burned
- Member loses `isMember` status
- Cannot vote or pay dues anymore
- Demonstrates admin control

### Permissionless Execution

After timelock expires, **any address** (member or non-member) can execute `executePayout()`:
1. Switch to a non-member account
2. Navigate to Treasury page
3. Click **Execute Payout**
4. Transaction succeeds

This demonstrates decentralized execution - no special privileges needed once timelock passes.

---

## Troubleshooting

### Wallet Connection Issues

**Symptom:** Wallet won't connect or shows wrong network

**Solution:**
- Ensure Brave Wallet is on "Hardhat Local" network (Chain ID 31337)
- Refresh page after switching networks
- Check RPC URL is `http://127.0.0.1:8545`
- Verify Hardhat node is running in Terminal 1

### Transaction Failures

**Symptom:** Transactions revert or fail

**Solution:**
- Check you have sufficient ETH (~10,000 ETH on test accounts)
- Verify correct account:
  - Minting: Admin Account
  - Voting: Member accounts
  - Dues: Member accounts
- Ensure contracts deployed (check `frontend/src/contracts.json` exists)
- Try resetting account in Brave Wallet: Settings → Advanced → Reset Account

### Proposal Not Votable

**Symptom:** Can't vote on proposal or gas estimation fails

**Solution:**
- **Mine a block first**: The governor has a 1-block voting delay
  - PowerShell: `Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"`
  - Linux/Mac: `curl -X POST --data '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' http://127.0.0.1:8545`
- Verify you're a member (check Members page)
- Confirm you have the correct Proposal ID
- If voting from a different account, paste the Proposal ID into the input field
- Ensure you haven't already voted on this proposal

### Payout Won't Execute

**Symptom:** Execute button disabled or transaction fails

**Solution:**
- Verify timelock has elapsed (check countdown timer)
- Ensure payout not already executed
- Confirm Treasury has sufficient balance
- Mine blocks to advance time: `npx hardhat run scripts/advance-time.ts --network localhost`

### Hydration Errors

**Symptom:** React hydration mismatch errors

**Solution:**
- Fixed in current version with `useEffect` and `mounted` state
- If you see it, refresh the page
- Error occurs when wallet address renders before client mount

### Nonce Too High Error

**Symptom:** "Nonce too high" error when sending transactions

**Solution:**
- Happens when blockchain resets but wallet keeps old nonce
- Fix: Brave Wallet → Settings → Advanced → **Reset Account**
- Or restart Hardhat node and redeploy from scratch

### Frontend Not Updating

**Symptom:** UI doesn't reflect blockchain changes

**Solution:**
- Refresh page (browser cache)
- Check browser console (F12) for errors
- Verify Hardhat node still running
- Check correct network selected in wallet
- Wait a few seconds for transaction confirmation

---

## Utility Scripts

**Check blockchain time:**
```bash
npx hardhat run scripts/check-time.ts --network localhost
```

**Advance time/mine blocks:**
```bash
npx hardhat run scripts/advance-time.ts --network localhost
```
Auto-calculates time needed based on payout ETA.

**Execute payout via CLI:**
```bash
npx hardhat run scripts/exec-payout.ts --network localhost
```

**Seed test proposal:**
```bash
npx hardhat run scripts/seed-propose-local.ts --network localhost
```

---

## Complete Demo Checklist

**Setup (5 min):**
- [ ] Start Hardhat node
- [ ] Deploy contracts
- [ ] Import 3 accounts to Brave Wallet
- [ ] Start frontend
- [ ] Connect wallet

**Membership (3 min):**
- [ ] Mint Member 1
- [ ] Mint Member 2
- [ ] Verify membership status

**Dues (2 min):**
- [ ] Member 1 pays 0.5 ETH
- [ ] Member 2 pays 1.0 ETH

**Treasury (2 min):**
- [ ] Admin deposits 10 ETH
- [ ] Member 1 deposits 5 ETH

**Governance (8 min):**
- [ ] Member 1 creates proposal (2 ETH payout)
- [ ] Mine blocks (voting delay)
- [ ] Member 1 votes FOR
- [ ] Member 2 votes FOR
- [ ] Mine blocks (end voting)
- [ ] Queue proposal
- [ ] Execute proposal

**Payout (3 min):**
- [ ] View pending payout
- [ ] Fast-forward time (60 sec)
- [ ] Execute payout
- [ ] Verify recipient balance

**Total time: ~25 minutes**

---

## Security Warnings

⚠️ **This is a development/demo environment**

**NOT production-ready:**
- Private keys displayed in terminal
- Local blockchain (ephemeral data)
- Simplified governance (1 block delay, 8 block voting)
- Very low quorum (1%)
- No multi-sig or access control beyond owner

**For production:**
- Use hardware wallets or secure key management
- Increase voting delays (e.g., 1 day) and periods (e.g., 1 week)
- Set realistic quorum thresholds (e.g., 4-10%)
- Implement multi-sig for admin functions
- Professional security audit required
- Deploy to testnet/mainnet with proper configuration
- Add emergency pause mechanisms
- Implement proposal threshold (e.g., 1% of supply)

---

## Learning Resources

- **OpenZeppelin Governor**: https://docs.openzeppelin.com/contracts/governance
- **Hardhat 3 Docs**: https://hardhat.org/docs
- **Viem**: https://viem.sh
- **RainbowKit**: https://www.rainbowkit.com/docs
- **Next.js 15**: https://nextjs.org/docs

---

## Support

**If you encounter issues:**
1. Check troubleshooting section above
2. Review browser console (F12) for errors
3. Check Hardhat node terminal for contract events
4. Verify wallet on correct network (Chain ID 31337)
5. Ensure all three terminals are running (node, scripts, frontend)

**Common fixes:**
- Refresh browser page
- Reset wallet account
- Restart Hardhat node and redeploy
- Clear `frontend/src/contracts.json` and redeploy

---

**Built with Hardhat 3, OpenZeppelin Contracts 5.4, Next.js 15, and Viem**
