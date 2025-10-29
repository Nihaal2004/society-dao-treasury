"use client";
import Link from "next/link";

export default function Page() {
  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-gray-800 p-6 space-y-3">
        <h2 className="text-2xl font-bold">Welcome to Society DAO</h2>
        <p className="text-gray-400">
          A decentralized autonomous organization for community governance and treasury management.
        </p>
        <div className="grid gap-2 text-sm text-gray-400 mt-4">
          <div>• Membership via non-transferable Soulbound Tokens (SBT)</div>
          <div>• Democratic voting on treasury proposals</div>
          <div>• Timelock-protected payouts for security</div>
        </div>
      </div>

      <nav className="grid gap-3 sm:grid-cols-2">
        <Link href="/members" className="rounded-2xl border border-gray-800 p-5 hover:bg-gray-900 transition-colors">
          <div className="text-lg font-medium mb-1">👥 Members</div>
          <div className="text-sm text-gray-400">Mint and manage memberships</div>
        </Link>
        <Link href="/dues" className="rounded-2xl border border-gray-800 p-5 hover:bg-gray-900 transition-colors">
          <div className="text-lg font-medium mb-1">💰 Dues</div>
          <div className="text-sm text-gray-400">Pay membership dues</div>
        </Link>
        <Link href="/proposals" className="rounded-2xl border border-gray-800 p-5 hover:bg-gray-900 transition-colors">
          <div className="text-lg font-medium mb-1">🗳️ Proposals</div>
          <div className="text-sm text-gray-400">Create and vote on proposals</div>
        </Link>
        <Link href="/treasury" className="rounded-2xl border border-gray-800 p-5 hover:bg-gray-900 transition-colors">
          <div className="text-lg font-medium mb-1">🏦 Treasury</div>
          <div className="text-sm text-gray-400">View balance and payouts</div>
        </Link>
      </nav>

      <div className="rounded-2xl border border-blue-800/50 bg-blue-900/10 p-4">
        <div className="text-sm text-blue-400 mb-2 font-semibold">ℹ️ Getting Started</div>
        <p className="text-sm text-gray-400">
          Connect with your Brave Wallet to the Hardhat Local network (Chain ID: 31337).
          Use Account #0 (admin) to mint memberships, then switch accounts to demonstrate voting.
        </p>
      </div>

      <div className="rounded-2xl border border-green-800/50 bg-green-900/10 p-4">
        <div className="text-sm text-green-400 mb-2 font-semibold">📋 Quick Demo Steps</div>
        <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
          <li>Connect Admin wallet and mint memberships for 2-3 accounts</li>
          <li>Switch to member accounts and pay dues</li>
          <li>Deposit funds to treasury</li>
          <li>Create a payout proposal as a member</li>
          <li>Vote on the proposal with different member accounts</li>
          <li>Execute the proposal and payout after timelock</li>
        </ol>
      </div>
    </main>
  );
}
