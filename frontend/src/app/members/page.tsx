"use client";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { addresses, abis } from "@/lib/contracts";
import { useState, useEffect } from "react";
import { isAddress } from "viem";

export default function MembersPage() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [mintToAddress, setMintToAddress] = useState("");
  const [revokeTokenId, setRevokeTokenId] = useState("");
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: isMember } = useReadContract({
    address: addresses.MembershipSBT,
    abi: abis.MembershipSBT,
    functionName: "isMember",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  const { data: nextId } = useReadContract({
    address: addresses.MembershipSBT,
    abi: abis.MembershipSBT,
    functionName: "nextId",
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      setMintToAddress("");
      setRevokeTokenId("");
      setTimeout(reset, 3000);
    }
  }, [isSuccess, reset]);

  const handleMint = () => {
    if (!mintToAddress || !isAddress(mintToAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }
    writeContract({
      address: addresses.MembershipSBT,
      abi: abis.MembershipSBT,
      functionName: "mint",
      args: [mintToAddress as `0x${string}`],
    });
  };

  const handleRevoke = () => {
    const tokenId = parseInt(revokeTokenId);
    if (isNaN(tokenId) || tokenId < 1) {
      alert("Please enter a valid token ID");
      return;
    }
    writeContract({
      address: addresses.MembershipSBT,
      abi: abis.MembershipSBT,
      functionName: "revoke",
      args: [BigInt(tokenId)],
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Membership Management</h2>

      <div className="rounded-2xl border border-gray-800 p-4">
        <div className="text-sm text-gray-400 mb-2">Your Account</div>
        <div className="break-all text-sm">{mounted ? (address ?? "Not connected") : "Loading..."}</div>
        {mounted && address && (
          <div className="mt-2">
            Status: <span className="font-medium">{isMember ? "✓ Member" : "✗ Not a member"}</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-800 p-4 space-y-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">Next Token ID</div>
          <div className="font-mono">#{nextId?.toString() ?? "..."}</div>
        </div>
      </div>

      {/* Mint Membership */}
      <div className="rounded-2xl border border-gray-800 p-4 space-y-3">
        <h3 className="font-semibold">Mint Membership</h3>
        <p className="text-xs text-gray-500">Admin only: Mint a soulbound membership token to an address</p>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Recipient Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={mintToAddress}
            onChange={(e) => setMintToAddress(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-gray-700 px-4 py-2 text-sm focus:outline-none focus:border-gray-500"
          />
        </div>

        <button
          className="w-full rounded-xl bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!address || isPending || !mintToAddress}
          onClick={handleMint}
        >
          {isPending ? "Minting…" : "Mint Membership"}
        </button>

        {hash && <div className="text-xs text-gray-400 break-all">Transaction: {hash}</div>}
        {isSuccess && <div className="text-sm text-green-400">✓ Membership minted successfully!</div>}
      </div>

      {/* Revoke Membership */}
      <div className="rounded-2xl border border-gray-800 p-4 space-y-3">
        <h3 className="font-semibold">Revoke Membership</h3>
        <p className="text-xs text-gray-500">Admin only: Burn a membership token by ID</p>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Token ID</label>
          <input
            type="number"
            placeholder="1"
            min="1"
            value={revokeTokenId}
            onChange={(e) => setRevokeTokenId(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-gray-700 px-4 py-2 text-sm focus:outline-none focus:border-gray-500"
          />
        </div>

        <button
          className="w-full rounded-xl bg-red-600 px-4 py-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!address || isPending || !revokeTokenId}
          onClick={handleRevoke}
        >
          {isPending ? "Revoking…" : "Revoke Membership"}
        </button>
      </div>

      <div className="rounded-2xl border border-yellow-800/50 bg-yellow-900/10 p-4">
        <div className="text-sm text-yellow-400">⚠️ Important</div>
        <p className="text-xs text-gray-400 mt-1">
          Only the admin account (the account that deployed the contracts) can mint and revoke memberships.
          Membership tokens are soulbound and cannot be transferred.
        </p>
      </div>
    </div>
  );
}
