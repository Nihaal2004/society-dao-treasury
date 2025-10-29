# Understanding Blockchain Mining in the DAO System

## What is Mining?

**Mining** is the process of creating new blocks in a blockchain. Each block contains:
- A batch of transactions
- A timestamp
- A reference to the previous block (creating the "chain")
- Other metadata (block number, hash, etc.)

Think of blocks like pages in a ledger book - you need to turn to a new page to record new entries.

---

## How Mining Works in Real Blockchains

### Production Networks (Ethereum Mainnet)

**Automatic & Continuous:**
- New blocks are mined automatically every ~12 seconds
- Miners/validators compete to create blocks
- Transactions are included automatically
- Time progresses naturally

**Example Timeline:**
```
Block 100 (Time: 10:00:00) → Your transaction sent
    ↓ (~12 seconds)
Block 101 (Time: 10:00:12) → Your transaction included ✓
    ↓ (~12 seconds)  
Block 102 (Time: 10:00:24) → More transactions
    ↓ (~12 seconds)
Block 103 (Time: 10:00:36) → Continues automatically...
```

---

## How Mining Works in Hardhat (Local Development)

### Manual Mining Mode (Default)

**Manual & On-Demand:**
- Blocks are NOT created automatically
- You must manually trigger block creation
- Transactions wait in "mempool" until you mine
- Time only advances when you mine a block

**Why Manual?**
- **Precise Testing:** You control exactly when blocks are created
- **Deterministic:** Same actions = same results every time
- **Debugging:** Pause and inspect state between blocks
- **Governance Testing:** Need exact block numbers for voting delays/periods

### The Mempool (Memory Pool)

When you send a transaction:
```
Your Wallet → Signs Transaction → Sends to Hardhat Node
                                        ↓
                                  [MEMPOOL]
                                  (Waiting Area)
                                        ↓
                                  Manual Mine Command
                                        ↓
                                  Transaction included in Block ✓
```

**Analogy:** Think of the mempool like a post office sorting room. Letters (transactions) arrive and wait there until the mail carrier (miner) takes them out for delivery (includes them in a block).

---

## Why Mining is Required in This DAO

### 1. Voting Delay (1 Block)

**Purpose:** Prevent flash-loan attacks and same-block manipulation

```solidity
GovernorSettings(1, 8, 0)
//               ↑ 
//          1 block voting delay
```

**What Happens:**
```
Block 100: Create Proposal
           State: Does not exist yet (transaction in mempool)
           
[MINE 1 BLOCK] ← YOU DO THIS

Block 101: Proposal created ✓
           State: Pending (voting delay active)
           
[MINE 1 BLOCK] ← YOU DO THIS

Block 102: Voting delay over
           State: Active (voting opens)
```

**Why?** This prevents someone from:
1. Creating a proposal
2. Voting on it 
3. Executing it

All in the same block/transaction, which could be exploited with flash loans or other attacks.

### 2. Voting Period (8 Blocks)

**Purpose:** Give all members time to review and vote

```solidity
GovernorSettings(1, 8, 0)
//                  ↑ 
//          8 blocks voting period
```

**Timeline:**
```
Block 102: Voting starts (Active state)
Block 103: Member 1 votes
Block 104: [mine - time passes]
Block 105: Member 2 votes  
Block 106: [mine - time passes]
Block 107: [mine - time passes]
Block 108: [mine - time passes]
Block 109: [mine - time passes]
Block 110: Voting ends (8 blocks passed)
           State: Succeeded (if quorum met)
```

**Why?** This ensures:
- Fair participation opportunity
- Time to discuss and review
- Can't rush through proposals
- Democratic process

### 3. Taking Snapshots (Checkpoints)

**Vote Power is Captured at Proposal Creation:**

```
Block 100: Alice has 1 membership token
           Alice creates proposal
           [SNAPSHOT TAKEN] ← Alice's voting power = 1

Block 101: Alice tries to mint herself 99 more tokens
           
Block 102-110: Voting period
           Alice's voting power STILL = 1 (uses snapshot from block 100)
```

**Without blocks/mining:**
- No way to take snapshots
- Vote manipulation possible
- Historical state tracking impossible

---

## Mining Commands Explained

### 1. Mine a Single Block

**PowerShell:**
```powershell
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"
```

**What it does:**
- Creates exactly 1 new block
- Includes all pending transactions in mempool
- Advances block number by 1
- Advances timestamp by ~12 seconds (Hardhat default)

**Use case:** Step through the governance process block by block

### 2. Mine Multiple Blocks

**Script:**
```javascript
// Mine 8 blocks
for (let i = 0; i < 8; i++) {
  await provider.request({ method: "evm_mine", params: [] });
}
```

**Use case:** Complete the voting period quickly

### 3. Increase Time

**PowerShell:**
```powershell
# Increase time by 400 seconds
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_increaseTime","params":[400],"id":1}' -ContentType "application/json"

# MUST mine a block to apply the change
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"
```

**What it does:**
- Step 1: Tells Hardhat "add 400 seconds to the next block's timestamp"
- Step 2: Actually creates that block with the increased timestamp

**Important:** The time change is NOT applied until you mine a block!

```
Current time: 10:00:00
evm_increaseTime(400) → Time still 10:00:00 (no block yet)
evm_mine() → NEW block with time 10:06:40 (400 seconds later)
```

**Use case:** Fast-forward past timelock periods for testing

---

## Practical Example: Your DAO Flow

### Step-by-Step with Mining

```
START: Block 20

1. CREATE PROPOSAL
   You: Click "Create Proposal"
   Wallet: Signs transaction
   Hardhat: Transaction sits in mempool ⏸️
   
2. MINE BLOCK (Voting Delay)
   You: Run evm_mine command
   Hardhat: Creates Block 21
   Block 21: Contains proposal creation transaction ✓
   State: Pending (need to wait 1 block)
   
3. MINE BLOCK (Activate Voting)
   You: Run evm_mine command
   Hardhat: Creates Block 22
   State: Active (voting open!)
   
4. VOTE
   Member 1: Clicks "Vote For"
   Wallet: Signs vote transaction
   Hardhat: Transaction sits in mempool ⏸️
   
5. MINE BLOCK (Include Vote)
   You: Run evm_mine command
   Hardhat: Creates Block 23
   Block 23: Contains vote transaction ✓
   
6. COMPLETE VOTING PERIOD
   You: Run evm_mine 7 more times
   Hardhat: Creates Blocks 24-30
   Block 30: Voting period complete (8 blocks passed)
   State: Succeeded ✓
   
7. EXECUTE PROPOSAL
   You: Click "Execute"
   Wallet: Signs execute transaction
   Hardhat: Transaction sits in mempool ⏸️
   
8. MINE BLOCK (Execute)
   You: Run evm_mine command
   Hardhat: Creates Block 31
   Block 31: Proposal executed → schedulePayout called ✓
   Treasury: Payout scheduled with ETA = now + 300 seconds
   
9. FAST-FORWARD TIME (Timelock)
   You: Run evm_increaseTime(400)
   Hardhat: Remembers to add 400 seconds to next block
   You: Run evm_mine command
   Hardhat: Creates Block 32 (timestamp + 400 seconds)
   
10. EXECUTE PAYOUT
    You: Click "Execute Payout"
    Wallet: Signs transaction
    You: Run evm_mine (optional, or wait for next tx)
    Hardhat: Creates Block 33
    Block 33: Payout executed, ETH transferred ✓
```

---

## Real World vs Development

### Production (Ethereum Mainnet/Testnets)

| Aspect | Behavior |
|--------|----------|
| Mining | Automatic every ~12 seconds |
| Your Action | Just send transaction and wait |
| Time | Progresses naturally |
| Cost | Gas fees in real ETH |
| Speed | ~12 second blocks |
| Testing | Expensive and slow |

### Development (Hardhat)

| Aspect | Behavior |
|--------|----------|
| Mining | Manual - you control when |
| Your Action | Send tx + manually mine block |
| Time | Only advances when you mine |
| Cost | Free (fake ETH) |
| Speed | Instant when you mine |
| Testing | Fast and precise |

---

## Why Hardhat Doesn't Auto-Mine by Default

### Benefits of Manual Mining:

1. **Exact Control:** Test specific block numbers
2. **State Inspection:** Pause and check values between blocks
3. **Reproducibility:** Same test = same blocks every time
4. **Debugging:** See exactly what happens in each block
5. **Complex Scenarios:** Test edge cases like timelock boundaries

### Example: Testing Edge Cases

```javascript
// Can you execute exactly at the timelock expiry?
const eta = currentTime + 100;
await schedulePayout(recipient, amount, eta);

// Fast forward to EXACTLY eta (not before, not after)
await network.provider.send("evm_setNextBlockTimestamp", [eta]);
await network.provider.send("evm_mine");

// Try to execute - should work!
await executePayout(); // Success ✓

// Without manual mining, you can't hit exact timestamps
```

---

## Optional: Hardhat Auto-Mining Mode

You CAN enable auto-mining in `hardhat.config.ts`:

```typescript
networks: {
  hardhat: {
    mining: {
      auto: true,
      interval: 12000 // Mine every 12 seconds
    }
  }
}
```

**But for governance testing, manual is better** because:
- Need exact block numbers for voting
- Need to control time precisely
- Want to inspect state between blocks
- Test different scenarios (fast voting, slow voting, etc.)

---

## Common Mining Scenarios

### Scenario 1: Transaction Not Showing Up

**Problem:** You clicked a button but nothing happened

**Cause:** Transaction is in mempool, waiting for a block

**Solution:**
```powershell
# Mine a block to include the transaction
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"
```

### Scenario 2: Can't Vote Yet (Pending State)

**Problem:** Proposal shows "Pending" instead of "Active"

**Cause:** Voting delay (1 block) hasn't passed

**Solution:**
```powershell
# Mine 1 more block to activate voting
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"
```

### Scenario 3: Voting Period Not Over

**Problem:** Proposal still shows "Active" after voting

**Cause:** Need 8 blocks total for voting period

**Solution:**
```powershell
# Mine remaining blocks (run this command multiple times)
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"
```

### Scenario 4: Timelock Not Expired

**Problem:** Can't execute payout, timelock still active

**Cause:** Current blockchain time < ETA

**Solution:**
```powershell
# Fast-forward 400 seconds
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_increaseTime","params":[400],"id":1}' -ContentType "application/json"

# Apply the time change by mining
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"
```

---

## Block vs Time

### Block Number
- **What it is:** Sequential counter (1, 2, 3, 4...)
- **Used for:** Voting delays, voting periods, snapshots
- **Example:** "Voting lasts 8 blocks"

### Block Timestamp
- **What it is:** Unix timestamp (seconds since 1970)
- **Used for:** Timelocks, deadlines, real-world times
- **Example:** "Payout available at 2025-10-29 10:30:00"

**Both advance when you mine a block:**
```
Mine Block → Block Number +1 AND Timestamp +12s (default)
```

---

## Summary

**Mining = Creating New Blocks**

In development with Hardhat:
- Blocks don't appear automatically
- You manually trigger block creation
- This gives you precise control for testing
- Necessary for governance with block-based timings

**Why you need to mine:**
1. Include transactions in blocks (make them execute)
2. Advance block numbers (satisfy voting delays/periods)
3. Advance time (satisfy timelocks)
4. Create checkpoints/snapshots (capture voting power)

**Think of it like a DVD player:**
- Transactions = scenes recorded on the DVD
- Mining = pressing PLAY to watch the next scene
- Auto-mining = DVD plays automatically
- Manual mining (Hardhat) = You press PLAY for each scene

This gives you frame-by-frame control for testing!

---

**Related Files in Your Project:**
- `scripts/advance-time.ts` - Helper script to mine blocks and advance time
- `scripts/check-time.ts` - Check current block number and timestamp
- Governance parameters: `contracts/SocietyGovernor.sol` line 21

---

**Quick Reference Commands:**

```powershell
# Mine 1 block
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"

# Fast-forward time
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_increaseTime","params":[300],"id":1}' -ContentType "application/json"
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"

# Or use the helper script
npx hardhat run scripts/advance-time.ts --network localhost
```
