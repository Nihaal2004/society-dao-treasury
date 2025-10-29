"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { encodeFunctionData, parseAbi, keccak256, stringToHex, parseEther, encodeAbiParameters, isAddress } from "viem";
import { addresses, abis } from "@/lib/contracts";
import Link from "next/link";

export default function ProposalsPage() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [to, setTo] = useState<string>("");
  const [amount, setAmount] = useState<string>("2");
  const [timelockSeconds, setTimelockSeconds] = useState<string>("60");
  const [desc, setDesc] = useState<string>("Payout for community development work");
  const [proposalId, setProposalId] = useState<`0x${string}` | null>(null);
  const [manualProposalId, setManualProposalId] = useState<string>("");
  const [savedTargets, setSavedTargets] = useState<`0x${string}`[]>([]);
  const [savedValues, setSavedValues] = useState<bigint[]>([]);
  const [savedCalldatas, setSavedCalldatas] = useState<`0x${string}`[]>([]);
  const [savedDescHash, setSavedDescHash] = useState<`0x${string}` | null>(null);

  // Check proposal state
  const activeProposalId = (manualProposalId && manualProposalId.startsWith("0x")) ? manualProposalId as `0x${string}` : proposalId;
  
  const { data: proposalState } = useReadContract({
    address: addresses.SocietyGovernor,
    abi: abis.SocietyGovernor,
    functionName: "state",
    args: activeProposalId ? [activeProposalId] : undefined,
    query: {
      enabled: !!activeProposalId,
      refetchInterval: 3000,
    },
  });

  const stateNames = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];
  const stateName = typeof proposalState === "number" ? stateNames[proposalState] : "Unknown";

  useEffect(() => {
    setMounted(true);
    // Load saved proposal data from localStorage
    const saved = localStorage.getItem('lastProposal');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSavedTargets(data.targets);
        setSavedValues(data.values.map((v: string) => BigInt(v)));
        setSavedCalldatas(data.calldatas);
        setSavedDescHash(data.descHash);
        setProposalId(data.proposalId);
        // Optionally restore form fields
        if (data.to) setTo(data.to);
        if (data.amount) setAmount(data.amount);
        if (data.timelock) setTimelockSeconds(data.timelock);
        if (data.desc) setDesc(data.desc);
      } catch (e) {
        console.error('Failed to load saved proposal:', e);
      }
    }
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
      setTimeout(reset, 5000);
    }
  }, [isSuccess, reset]);

  const propose = async () => {
    if (!to || !isAddress(to)) {
      alert("Please enter a valid recipient address");
      return;
    }
    const ethAmount = parseFloat(amount);
    if (isNaN(ethAmount) || ethAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    const timelock = parseInt(timelockSeconds);
    if (isNaN(timelock) || timelock < 1) {
      alert("Please enter a valid timelock period");
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const eta = BigInt(now + timelock);
    const calldata = encodeFunctionData({
      abi: parseAbi(["function schedulePayout(address to,uint256 amount,uint64 eta,string note)"]),
      functionName: "schedulePayout",
      args: [to as `0x${string}`, parseEther(amount), eta, desc],
    });
    const targets = [addresses.Treasury] as `0x${string}`[];
    const values = [0n] as bigint[];
    const calldatas = [calldata] as `0x${string}`[];
    const descHash = keccak256(stringToHex(desc));
    
    const encoded = encodeAbiParameters(
      [
        { type: "address[]" },
        { type: "uint256[]" },
        { type: "bytes[]" },
        { type: "bytes32" },
      ],
      [targets, values, calldatas, descHash]
    );
    const proposalIdCalc = keccak256(encoded);
    
    // Save these for queue/execute
    setSavedTargets(targets);
    setSavedValues(values);
    setSavedCalldatas(calldatas);
    setSavedDescHash(descHash);
    
    // Save to localStorage for persistence
    localStorage.setItem('lastProposal', JSON.stringify({
      targets,
      values: values.map(v => v.toString()),
      calldatas,
      descHash,
      proposalId: proposalIdCalc,
      to,
      amount,
      timelock: timelockSeconds,
      desc,
    }));
    
    await writeContract({
      address: addresses.SocietyGovernor,
      abi: abis.SocietyGovernor,
      functionName: "propose",
      args: [targets, values, calldatas, desc],
    });
    
    setProposalId(proposalIdCalc);
  };

  const vote = (support: 0 | 1 | 2) => {
    const idToUse = (manualProposalId && manualProposalId.startsWith("0x")) ? manualProposalId as `0x${string}` : proposalId;
    if (!idToUse) return;
    writeContract({
      address: addresses.SocietyGovernor,
      abi: abis.SocietyGovernor,
      functionName: "castVote",
      args: [idToUse as `0x${string}`, support],
    });
  };

  const queueProposal = async () => {
    if (savedTargets.length === 0 || !savedDescHash) {
      alert("Please create a proposal first on this page, or the proposal data is not available");
      return;
    }

    writeContract({
      address: addresses.SocietyGovernor,
      abi: abis.SocietyGovernor,
      functionName: "queue",
      args: [savedTargets, savedValues, savedCalldatas, savedDescHash],
      gas: 500000n,
    });
  };

  const executeProposal = async () => {
    if (savedTargets.length === 0 || !savedDescHash) {
      alert("Please create a proposal first on this page, or the proposal data is not available");
      return;
    }

    writeContract({
      address: addresses.SocietyGovernor,
      abi: abis.SocietyGovernor,
      functionName: "execute",
      args: [savedTargets, savedValues, savedCalldatas, savedDescHash],
      gas: 500000n,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Governance Proposals</h2>
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

      {/* Create Proposal */}
      <div className="rounded-2xl border border-gray-800 p-4 space-y-4">
        <h3 className="font-semibold">Create Proposal</h3>
        <p className="text-xs text-gray-400">
          Propose a treasury payout. Only members can create proposals.
        </p>

        <label className="block">
          <span className="text-sm text-gray-400">Recipient Address</span>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-gray-700 bg-white/5 px-4 py-2 outline-none focus:border-gray-500"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x..."
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-400">Amount (ETH)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-xl border border-gray-700 bg-white/5 px-4 py-2 outline-none focus:border-gray-500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="2"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-400">Timelock (seconds after approval)</span>
          <input
            type="number"
            min="1"
            className="mt-1 w-full rounded-xl border border-gray-700 bg-white/5 px-4 py-2 outline-none focus:border-gray-500"
            value={timelockSeconds}
            onChange={(e) => setTimelockSeconds(e.target.value)}
            placeholder="60"
          />
          <p className="text-xs text-gray-500 mt-1">Time delay before payout can be executed</p>
        </label>

        <label className="block">
          <span className="text-sm text-gray-400">Description</span>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-gray-700 bg-white/5 px-4 py-2 outline-none focus:border-gray-500"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Payout for community development work"
          />
        </label>

        <button
          className="w-full rounded-xl bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isPending || !isMember || !to || !amount}
          onClick={propose}
        >
          {isPending ? "Creating…" : "Create Proposal"}
        </button>
      </div>

      {/* Voting Section */}
      <div className="rounded-2xl border border-gray-800 p-4 space-y-3">
        <h3 className="font-semibold">Vote on Proposal</h3>
        
        {proposalId && (
          <div className="rounded-xl bg-blue-900/20 border border-blue-800/50 p-3">
            <div className="text-xs text-blue-400 mb-1">Latest Proposal ID:</div>
            <div className="text-xs font-mono break-all">{proposalId}</div>
          </div>
        )}
        
        {activeProposalId && (
          <div className="rounded-xl bg-green-900/20 border border-green-800/50 p-3">
            <div className="text-xs text-green-400 mb-1">Proposal State:</div>
            <div className="text-sm font-semibold">{stateName}</div>
            {stateName === "Active" && <div className="text-xs text-yellow-400 mt-1">⏳ Voting in progress (need 8 blocks total)</div>}
            {stateName === "Succeeded" && <div className="text-xs text-green-400 mt-1">✓ Ready to queue!</div>}
            {stateName === "Pending" && <div className="text-xs text-yellow-400 mt-1">⏳ Mine 1 block to activate voting</div>}
          </div>
        )}
        
        <label className="block">
          <span className="text-sm text-gray-400">Enter Proposal ID to Vote</span>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-gray-700 bg-white/5 px-4 py-2 font-mono text-xs outline-none focus:border-gray-500"
            value={manualProposalId}
            onChange={(e) => setManualProposalId(e.target.value)}
            placeholder="0x..."
          />
          <p className="text-xs text-gray-500 mt-1">Paste proposal ID from creator or use the one above</p>
        </label>

        <div className="flex gap-2">
          <button
            className="flex-1 rounded-xl bg-green-600 px-4 py-2 hover:bg-green-700 disabled:opacity-50"
            disabled={isPending || (!proposalId && !manualProposalId)}
            onClick={() => vote(1)}
          >
            Vote For
          </button>
          <button
            className="flex-1 rounded-xl bg-red-600 px-4 py-2 hover:bg-red-700 disabled:opacity-50"
            disabled={isPending || (!proposalId && !manualProposalId)}
            onClick={() => vote(0)}
          >
            Vote Against
          </button>
          <button
            className="flex-1 rounded-xl bg-gray-600 px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
            disabled={isPending || (!proposalId && !manualProposalId)}
            onClick={() => vote(2)}
          >
            Abstain
          </button>
        </div>
      </div>

      {/* Execute Proposal Section */}
      <div className="rounded-2xl border border-gray-800 p-4 space-y-3">
        <h3 className="font-semibold">Execute Proposal</h3>
        <p className="text-xs text-gray-400">
          After voting ends and proposal succeeds, execute it directly (no queue needed).
        </p>
        
        <div className="rounded-xl bg-yellow-900/20 border border-yellow-800/50 p-3 mb-3">
          <div className="text-xs text-yellow-400 font-semibold mb-2">⚠️ Important:</div>
          <div className="text-xs text-gray-300">
            Execute will only work if you created the proposal on this page in this session.
            The proposal parameters are automatically saved when you create a proposal.
            {savedTargets.length > 0 && <div className="text-green-400 mt-1">✓ Proposal data saved and ready!</div>}
            {savedTargets.length === 0 && <div className="text-red-400 mt-1">✗ No proposal data - create a proposal first on this page</div>}
          </div>
        </div>
        
        <button
          className="w-full rounded-xl bg-orange-600 px-4 py-2 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!mounted || isPending || (!proposalId && !manualProposalId) || savedTargets.length === 0}
          onClick={executeProposal}
        >
          {isPending ? "Executing…" : "Execute Proposal"}
        </button>
        
        <p className="text-xs text-gray-400">
          This will call schedulePayout() on the Treasury contract with the approved parameters.
        </p>
      </div>

      {/* Status Messages */}
      {hash && <div className="text-xs text-gray-400 break-all rounded-2xl border border-gray-800 p-3">Transaction: {hash}</div>}
      {isSuccess && <div className="text-sm text-green-400 rounded-2xl border border-green-800 bg-green-900/20 p-3">✓ Transaction confirmed!</div>}
      {error && <div className="text-xs text-red-400 break-all rounded-2xl border border-red-800 bg-red-900/20 p-3">{String((error as any).shortMessage ?? error.message)}</div>}

      {/* Instructions */}
      <div className="rounded-2xl border border-blue-800/50 bg-blue-900/10 p-4 space-y-2">
        <div className="text-sm text-blue-400">ℹ️ Governance Process</div>
        <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
          <li>Create a proposal (members only)</li>
          <li><strong className="text-yellow-400">Wait 1 block for voting delay - mine a block before voting!</strong></li>
          <li>Members vote (voting period: 8 blocks)</li>
          <li>If approved, queue and execute the proposal</li>
          <li>Visit Treasury page to execute payout after timelock expires</li>
        </ol>
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-yellow-400 font-semibold">To mine a block in Hardhat:</div>
          <div className="text-xs text-gray-400 mt-1">PowerShell:</div>
          <code className="block text-xs bg-black/30 p-2 rounded break-all">
            Invoke-WebRequest -Uri http://127.0.0.1:8545 -Method POST -Body '&#123;"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1&#125;' -ContentType "application/json"
          </code>
          <div className="text-xs text-gray-400 mt-2">Linux/Mac:</div>
          <code className="block text-xs bg-black/30 p-2 rounded">
            curl -X POST --data '&#123;"jsonrpc":"2.0","method":"evm_mine","params":[],"id":1&#125;' http://127.0.0.1:8545
          </code>
        </div>
      </div>
    </div>
  );
}
