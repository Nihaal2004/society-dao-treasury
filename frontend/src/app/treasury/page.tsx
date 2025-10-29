"use client";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { addresses, abis } from "@/lib/contracts";
import Link from "next/link";

const safeJson = (v: unknown) =>
  JSON.stringify(v, (_k, val) => (typeof val === "bigint" ? val.toString() : val), 2);

export default function TreasuryPage() {
  const { address, chain } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [blockTime, setBlockTime] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState("10");
  const [depositNote, setDepositNote] = useState("Treasury funding");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: op, refetch: refetchOp } = useReadContract({
    address: addresses.Treasury,
    abi: abis.Treasury,
    functionName: "op",
    query: {
      refetchInterval: 2000, // Poll every 2 seconds
    },
  });

  const executed = Boolean(op && (op as any)[4]);
  const etaBn = (op && (op as any)[3]) as bigint | undefined;
  const readyTime = typeof etaBn === "bigint" ? Number(etaBn) : 0;
  const ready = readyTime > 0 && blockTime > 0 && blockTime >= readyTime;

  // Fetch balance and block time
  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      if (!(window as any).ethereum) return;
      try {
        const balHex: string = await (window as any).ethereum.request({
          method: "eth_getBalance",
          params: [addresses.Treasury, "latest"],
        });
        const block: any = await (window as any).ethereum.request({
          method: "eth_getBlockByNumber",
          params: ["latest", false],
        });
        if (!ignore) {
          setBalance(formatEther(BigInt(balHex)));
          setBlockTime(parseInt(block.timestamp, 16));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [chain?.id]);

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ 
    hash,
    onReplaced: (replacement) => {
      console.log('Transaction replaced:', replacement);
    },
  });

  useEffect(() => {
    if (isSuccess) {
      refetchOp();
      setTimeout(reset, 3000);
    }
  }, [isSuccess, reset, refetchOp]);

  const handleDeposit = () => {
    const ethAmount = parseFloat(depositAmount);
    if (isNaN(ethAmount) || ethAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    writeContract({
      address: addresses.Treasury,
      abi: abis.Treasury,
      functionName: "deposit",
      args: [depositNote],
      value: parseEther(depositAmount),
    });
  };

  const handleExecutePayout = () => {
    writeContract({
      address: addresses.Treasury,
      abi: abis.Treasury,
      functionName: "executePayout",
      args: [],
    });
  };

  // Calculate countdown
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!readyTime || readyTime === 0) {
      setCountdown("");
      return;
    }
    
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = readyTime - now;
      
      if (remaining <= 0) {
        setCountdown("Ready to execute!");
      } else {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        setCountdown(`${minutes}m ${seconds}s remaining`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [readyTime]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Treasury Management</h2>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-300">← Home</Link>
      </div>

      {/* Treasury Info */}
      <div className="rounded-2xl border border-gray-800 p-4 space-y-2">
        <h3 className="font-semibold">Treasury Status</h3>
        <div className="text-sm text-gray-400">Contract Address</div>
        <div className="break-all text-xs font-mono">{addresses.Treasury}</div>
        <div className="mt-3 text-2xl font-bold text-green-400">{balance} ETH</div>
        <div className="text-xs text-gray-400">Current Balance</div>
      </div>

      {/* Deposit Section */}
      <div className="rounded-2xl border border-gray-800 p-4 space-y-4">
        <h3 className="font-semibold">Deposit to Treasury</h3>
        <p className="text-xs text-gray-400">
          Anyone can contribute funds to the treasury. Deposits are public and traceable.
        </p>

        <label className="block">
          <span className="text-sm text-gray-400">Amount (ETH)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-xl bg-white/5 border border-gray-700 px-4 py-2 outline-none focus:border-gray-500"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="10"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-400">Note (optional)</span>
          <input
            type="text"
            className="mt-1 w-full rounded-xl bg-white/5 border border-gray-700 px-4 py-2 outline-none focus:border-gray-500"
            value={depositNote}
            onChange={(e) => setDepositNote(e.target.value)}
            placeholder="Treasury funding"
          />
        </label>

        <button
          className="w-full rounded-xl bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!mounted || !address || isPending}
          onClick={handleDeposit}
        >
          {isPending ? "Depositing…" : "Deposit to Treasury"}
        </button>
      </div>

      {/* Pending Payout Section */}
      <div className="rounded-2xl border border-gray-800 p-4 space-y-3">
        <h3 className="font-semibold">Scheduled Payout</h3>
        
        {mounted && op && (op as any)[0] !== "0x0000000000000000000000000000000000000000" ? (
          <div className="space-y-3">
            <div className="bg-gray-900/50 rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Recipient:</div>
                <div className="break-all font-mono text-xs">{(op as any)[0]}</div>
                
                <div className="text-gray-400">Amount:</div>
                <div className="text-green-400 font-semibold">
                  {typeof (op as any)[1] === "bigint" ? formatEther((op as any)[1]) : "0"} ETH
                </div>
                
                <div className="text-gray-400">Note:</div>
                <div>{(op as any)[2] || "No note"}</div>
                
                <div className="text-gray-400">ETA:</div>
                <div>
                  {readyTime > 0 ? new Date(readyTime * 1000).toLocaleString() : "Unknown"}
                </div>
                
                <div className="text-gray-400">Status:</div>
                <div className={executed ? "text-gray-500" : ready ? "text-green-400" : "text-yellow-400"}>
                  {executed ? "✓ Executed" : ready ? "Ready to execute" : countdown}
                </div>
              </div>
            </div>

            <button
              className="w-full rounded-xl bg-green-600 px-4 py-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!mounted || !ready || executed || isPending}
              onClick={handleExecutePayout}
            >
              {isPending ? "Executing…" : executed ? "Already Executed" : ready ? "Execute Payout" : "Timelock Active"}
            </button>

            {!ready && !executed && readyTime > 0 && (
              <div className="text-xs text-yellow-400 text-center">
                ⏳ Waiting for timelock to expire
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-4">
            No scheduled payout
          </div>
        )}
      </div>

      {/* Transaction Status */}
      {hash && (
        <div className="rounded-2xl border border-gray-800 p-3">
          <div className="text-xs text-gray-400 break-all">Transaction: {hash}</div>
        </div>
      )}
      {isSuccess && (
        <div className="rounded-2xl border border-green-800 bg-green-900/20 p-3">
          <div className="text-sm text-green-400">✓ Transaction confirmed!</div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-2xl border border-blue-800/50 bg-blue-900/10 p-4">
        <div className="text-sm text-blue-400 mb-1">ℹ️ About Treasury</div>
        <p className="text-xs text-gray-400">
          The Treasury is controlled by governance. Approved proposals schedule payouts with a timelock period.
          Anyone can execute a payout after the timelock expires, ensuring transparency and decentralization.
        </p>
      </div>
    </div>
  );
}
