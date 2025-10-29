# Quick Start Guide - Society DAO Treasury

## 🚀 Fast Setup (5 Minutes)

### 1. Start Blockchain
```bash
# Terminal 1
npx hardhat node
```
Copy private keys for accounts #0, #1, #2

### 2. Deploy Contracts
```bash
# Terminal 2
npx hardhat run scripts/deploy-local.ts --network localhost
```

### 3. Start Frontend
```bash
# Terminal 2 (or new terminal)
cd frontend
npm run dev
```
Open http://localhost:3000

### 4. Setup Brave Wallet

**Add Network:**
- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency: `ETH`

**Import Accounts:**
1. Account #0 → "Admin Account"
2. Account #1 → "Member 1"
3. Account #2 → "Member 2"

---

## 🎯 Quick Demo (10 Minutes)

### Step 1: Mint Memberships (Admin Account)
1. Connect Admin Account
2. Go to **Members** page
3. Enter Member 1 address → Mint
4. Enter Member 2 address → Mint

### Step 2: Pay Dues (Member Accounts)
1. Switch to Member 1
2. Go to **Dues** page
3. Enter amount (0.5 ETH) → Pay
4. Switch to Member 2
5. Pay dues (1 ETH)

### Step 3: Fund Treasury (Any Account)
1. Go to **Treasury** page
2. Enter amount (10 ETH) → Deposit

### Step 4: Create & Vote on Proposal (Members)
1. Switch to Member 1
2. Go to **Proposals** page
3. Fill in:
   - Recipient: Account #3 address
   - Amount: 2 ETH
   - Timelock: 60 seconds
   - Description: "Community grant"
4. Click **Create Proposal**
5. Wait for confirmation
6. Click **Vote For**
7. Switch to Member 2
8. Click **Vote For** on same proposal

### Step 5: Execute Proposal
1. Mine blocks to advance voting:
   ```bash
   # Terminal 2
   npx hardhat run scripts/advance-time.ts --network localhost
   # Enter: 10 blocks
   ```
2. Refresh Proposals page
3. Queue and Execute proposal (buttons will appear based on state)

### Step 6: Execute Payout
1. Go to **Treasury** page
2. See scheduled payout with countdown
3. Wait 60 seconds (or fast-forward time):
   ```bash
   npx hardhat run scripts/advance-time.ts --network localhost
   # Enter: 60 blocks
   ```
4. Click **Execute Payout**
5. Check recipient balance increased by 2 ETH

---

## 🔧 Useful Commands

### Advance Time (Mine Blocks)
```bash
npx hardhat run scripts/advance-time.ts --network localhost
```

### Check Current Time
```bash
npx hardhat run scripts/check-time.ts --network localhost
```

### Execute Pending Payout (CLI)
```bash
npx hardhat run scripts/exec-payout.ts --network localhost
```

---

## 📋 Account Cheat Sheet

**Account #0 - Admin**
- Deploy contracts
- Mint memberships
- Revoke memberships
- Can deposit & vote if minted

**Account #1 & #2 - Members**
- Must be minted first
- Can pay dues
- Can create proposals
- Can vote on proposals
- Can deposit to treasury

**Any Account**
- Can deposit to treasury
- Can execute payouts after timelock

---

## ⚠️ Common Issues

**Hydration Error:** Refresh the page

**Can't connect wallet:** Make sure Chain ID is 31337

**Transaction fails:** 
- Check you're on correct account
- Verify you have membership (for voting/dues)
- Reset account in Brave Wallet if needed

**Proposal won't execute:** 
- Mine blocks to pass voting period
- Check quorum is met
- Follow state progression: Pending → Active → Succeeded → Queued → Executed

**Payout stuck:** 
- Wait for timelock or mine blocks
- Check countdown timer
- Refresh page to see updated status

---

## 📚 Full Documentation

See `DEMO_GUIDE.md` for detailed step-by-step instructions and explanations.

---

**Built with:**
- Hardhat 3 + Viem
- OpenZeppelin Contracts (Governor, ERC721Votes)
- Next.js 15 + RainbowKit
- Brave Wallet Support
