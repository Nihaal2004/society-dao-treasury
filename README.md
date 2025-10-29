# Society DAO Treasury

A decentralized autonomous organization (DAO) treasury management system built with Hardhat 3, OpenZeppelin governance contracts, and a Next.js frontend.

## 🎯 Overview

This project demonstrates a complete DAO governance system featuring:

- **Soulbound Membership Tokens (SBT)**: Non-transferable NFTs for membership management
- **On-Chain Governance**: Proposal creation, voting, and execution using OpenZeppelin Governor
- **Timelock Treasury**: Secure fund management with timelock protection
- **Member Dues System**: Payments tracked on-chain
- **Decentralized Decision Making**: Democratic voting for treasury payouts

## 🏗️ Architecture

### Smart Contracts

1. **MembershipSBT.sol**
   - ERC721-based soulbound token (non-transferable)
   - Implements ERC721Votes for governance participation
   - Admin-controlled minting and revocation
   - Dues payment tracking

2. **SocietyGovernor.sol**
   - OpenZeppelin Governor implementation
   - 1 member = 1 vote
   - Configurable voting delay and period
   - Quorum-based proposal approval

3. **Treasury.sol**
   - Accepts deposits from any address
   - Timelock-protected payout scheduling
   - Only executable after timelock expires
   - Governance-controlled fund distribution

### Frontend

- **Framework**: Next.js 15 with React 19
- **Wallet Connection**: RainbowKit with Brave Wallet support
- **Blockchain Interaction**: Viem + Wagmi
- **Styling**: Tailwind CSS 4
- **Features**: Real-time status updates, transaction feedback, wallet integration

## 🚀 Quick Start

### Prerequisites

- Node.js v18 or higher
- npm
- Brave Browser (recommended) or any Web3 wallet

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd society-dao-treasury

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Running Locally

1. **Start Local Blockchain**
```bash
npx hardhat node
```
Keep this terminal running. Copy the private keys for accounts #0, #1, and #2.

2. **Deploy Contracts** (in a new terminal)
```bash
npx hardhat run scripts/deploy-local.ts --network localhost
```

3. **Configure Wallet**
   - Add Hardhat Local network to your wallet:
     - Network Name: `Hardhat Local`
     - RPC URL: `http://127.0.0.1:8545`
     - Chain ID: `31337`
     - Currency: `ETH`
   - Import the three accounts using their private keys

4. **Start Frontend**
```bash
cd frontend
npm run dev
```
Open http://localhost:3000

## 📖 Documentation

- **[QUICK_START.md](QUICK_START.md)**: Fast setup and basic usage (5-10 minutes)
- **[DEMO_GUIDE.md](DEMO_GUIDE.md)**: Comprehensive step-by-step walkthrough with all features

## 🎮 Basic Usage Flow

1. **Mint Memberships** (Admin): Grant membership tokens to participants
2. **Pay Dues** (Members): Members can pay dues to the membership contract
3. **Fund Treasury** (Anyone): Deposit ETH to the treasury
4. **Create Proposal** (Members): Propose a payout from treasury
5. **Mine a Block**: Required after proposal creation before voting (1-block delay)
   ```powershell
   # PowerShell:
   Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"
   # Or use the script:
   npx hardhat run scripts/advance-time.ts --network localhost
   ```
6. **Vote** (Members): Vote for or against proposals (share proposal ID with other voters)
7. **Execute** (Anyone): Queue and execute approved proposals after timelock

## 🔧 Available Scripts

### Blockchain Management
```bash
# Mine a single block (needed after proposal creation)
# PowerShell:
Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' -ContentType "application/json"
# Linux/Mac:
curl -X POST --data '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1}' http://127.0.0.1:8545

# Advance blockchain time/blocks
npx hardhat run scripts/advance-time.ts --network localhost

# Check current blockchain time
npx hardhat run scripts/check-time.ts --network localhost

# Execute pending payout (CLI)
npx hardhat run scripts/exec-payout.ts --network localhost

# Seed a test proposal
npx hardhat run scripts/seed-propose-local.ts --network localhost
```

### Testing
```bash
# Run tests (when implemented)
npx hardhat test
```

## 🛠️ Technology Stack

**Smart Contracts:**
- Hardhat 3.0.7
- OpenZeppelin Contracts 5.4.0
- Solidity (via Hardhat)
- Viem 2.38.2
- Ethers.js 6.15.0

**Frontend:**
- Next.js 15.5.5
- React 19.1.0
- RainbowKit 2.2.9
- Wagmi 2.18.2
- Viem 2.38.4
- Tailwind CSS 4

## 📁 Project Structure

```
society-dao-treasury/
├── contracts/              # Smart contracts
│   ├── MembershipSBT.sol
│   ├── SocietyGovernor.sol
│   └── Treasury.sol
├── scripts/               # Deployment and utility scripts
│   ├── deploy-local.ts
│   ├── advance-time.ts
│   └── ...
├── frontend/             # Next.js application
│   ├── src/
│   │   ├── app/         # Next.js app router pages
│   │   └── contracts.json  # Generated contract ABIs
│   └── package.json
├── hardhat.config.ts    # Hardhat configuration
├── package.json
├── README.md           # This file
├── QUICK_START.md     # Quick setup guide
└── DEMO_GUIDE.md      # Detailed walkthrough
```

## 🔐 Security Notes

⚠️ **This is a development/demo project**

- Private keys are displayed in the terminal (never use in production)
- Local blockchain data is ephemeral
- Simplified governance parameters for testing
- No production security audits

**For production deployment:**
- Use hardware wallets or secure key management
- Increase voting delays and periods
- Set appropriate quorum thresholds
- Add multi-signature for admin functions
- Conduct professional security audits
- Deploy to secure testnet/mainnet with proper configuration

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your own use cases.

## 📄 License

ISC

## 🆘 Support

For issues and questions:
1. Check the [DEMO_GUIDE.md](DEMO_GUIDE.md) troubleshooting section
2. Review console logs (browser and terminal)
3. Verify Hardhat node is running
4. Ensure correct network connection in wallet

## 🎓 Learning Resources

- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/governance)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Viem Documentation](https://viem.sh)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Built with Hardhat 3 + OpenZeppelin + Next.js 15**
