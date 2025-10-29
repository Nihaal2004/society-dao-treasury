"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseEther } from "viem";
import { addresses, abis } from "@/lib/contracts";
import Link from "next/link";

export default function DuesPage() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState("0.5");
  const [note, setNote] = useState("Monthly dues");

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

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      setTimeout(reset, 3000);
    }
  }, [isSuccess, reset]);

  const pay = () => {
    const ethAmount = parseFloat(amount);
    if (isNaN(ethAmount) || ethAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    writeContract({
      address: addresses.MembershipSBT,
      abi: abis.MembershipSBT,
      functionName: "payDues",
      args: [note],
      value: parseEther(amount),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pay Membership Dues</h2>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-300">← Home</Link>
      </div>

      <div className="rounded-2xl border border-gray-800 p-4">
        <div className="text-sm text-gray-400 mb-2">Your Account</div>
        <div className="break-all text-sm">{mounted ? (address ?? "Not connected") : "Loading..."}</div>
        {mounted && address && (
          <div className="mt-2 text-sm">
            Status: <span className={isMember ? "text-green-400" : "text-red-400"}>
              {isMember ? "✓ Member" : "✗ Not a member"}
            </span>
          </div>
        )}
      </div>

      {mounted && address && !isMember && (
        <div className="rounded-2xl border border-yellow-800/50 bg-yellow-900/10 p-4">
          <div className="text-sm text-yellow-400 mb-1">⚠️ Not a Member</div>
          <p className="text-xs text-gray-400">
            You must be a member to pay dues. Visit the <Link href="/members" className="underline">Members page</Link> to get minted.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-gray-800 p-4 space-y-4">
        <h3 className="font-semibold">Pay Dues</h3>
        <p className="text-xs text-gray-400">
          Members can contribute dues to support the society. Funds go to the membership contract.
        </p>

        <label className="block">
          <span className="text-sm text-gray-400">Amount (ETH)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-xl bg-white/5 border border-gray-700 px-4 py-2 outline-none focus:border-gray-500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.5"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-400">Note (optional)</span>
          <input
            type="text"
            className="mt-1 w-full rounded-xl bg-white/5 border border-gray-700 px-4 py-2 outline-none focus:border-gray-500"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Monthly dues - January 2025"
          />
        </label>

        <button
          className="w-full rounded-xl bg-green-600 px-4 py-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!address || isPending || !isMember}
          onClick={pay}
        >
          {isPending ? "Processing…" : "Pay Dues"}
        </button>

        {hash && <div className="text-xs text-gray-400 break-all">Transaction: {hash}</div>}
        {isSuccess && <div className="text-sm text-green-400">✓ Dues payment confirmed!</div>}
        {error && <div className="text-xs text-red-400 break-all">{String((error as any).shortMessage ?? error.message)}</div>}
      </div>

      <div className="rounded-2xl border border-blue-800/50 bg-blue-900/10 p-4">
        <div className="text-sm text-blue-400 mb-1">ℹ️ About Dues</div>
        <p className="text-xs text-gray-400">
          Dues payments are recorded on-chain with your custom note. Only active members can pay dues.
          Funds are sent to the MembershipSBT contract address.
        </p>
      </div>
    </div>
  );
}
