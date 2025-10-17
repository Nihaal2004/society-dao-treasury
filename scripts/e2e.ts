import hre from "hardhat";
import { encodeFunctionData, parseAbi, stringToHex, keccak256 } from "viem";

async function main() {
  const conn = await hre.network.connect();
  const { viem, provider } = conn;

  const [admin, m1, m2, m3, recipient] = await viem.getWalletClients();

  const sbt = await viem.deployContract("MembershipSBT", [admin.account.address]);
  const gov = await viem.deployContract("SocietyGovernor", [sbt.address]);
  const tre = await viem.deployContract("Treasury", [gov.address]);

  console.log("SBT:", sbt.address);
  console.log("Governor:", gov.address);
  console.log("Treasury:", tre.address);

  const sbtC = await viem.getContractAt("MembershipSBT", sbt.address);
  const govC = await viem.getContractAt("SocietyGovernor", gov.address);
  const treC = await viem.getContractAt("Treasury", tre.address);

  // Mint 3 SBTs
  await sbtC.write.mint([m1.account.address], { account: admin.account });
  await sbtC.write.mint([m2.account.address], { account: admin.account });
  await sbtC.write.mint([m3.account.address], { account: admin.account });
  console.log("Minted SBTs to 3 members");

  // Dues and seed treasury
  await sbtC.write.payDues(["Oct"], { account: m1.account, value: 100000000000000000n });
  await treC.write.deposit(["seed"], { account: admin.account, value: 1000000000000000000n });
  console.log("Dues paid by m1; treasury seeded with 1 ETH");

  // Build proposal to schedule treas. payout
  const latest = (await provider.request({ method: "eth_getBlockByNumber", params: ["latest", false] })) as any;
  const now = BigInt(latest.timestamp); // hex->BigInt works
  const eta = now + 100n;

  const calldata = encodeFunctionData({
    abi: parseAbi(["function schedulePayout(address to,uint256 amount,uint64 eta,string note)"]),
    functionName: "schedulePayout",
    args: [recipient.account.address, 50000000000000000n, eta, "Grant"], // 0.05 ETH
  });

  const targets = [tre.address];
  const values = [0n];
  const calldatas = [calldata];
  const desc = "Pay 0.05 ETH to recipient";

  await govC.write.propose([targets, values, calldatas, desc], { account: m1.account });
  const proposalId = await govC.read.hashProposal([targets, values, calldatas, keccak256(stringToHex(desc))]);
  console.log("Proposed:", proposalId);

  // Pass voting delay, vote, end period
  await provider.request({ method: "evm_mine", params: [] });
    await govC.write.castVote([proposalId, 1], { account: m1.account });
    await govC.write.castVote([proposalId, 1], { account: m2.account });

  for (let i = 0; i < 9; i++) await provider.request({ method: "evm_mine", params: [] });

  // Execute proposal -> schedules payout
  await govC.write.execute([targets, values, calldatas, keccak256(stringToHex(desc))], { account: m1.account });
  console.log("Proposal executed. Payout scheduled for eta:", eta.toString());

  // Fast-forward and execute payout
  await provider.request({ method: "evm_increaseTime", params: [120] });
  await provider.request({ method: "evm_mine", params: [] });
  await treC.write.executePayout({ account: m1.account });

  console.log("Payout executed");

  // Show final treasury balance
  const balHex = (await provider.request({ method: "eth_getBalance", params: [tre.address, "latest"] })) as string;
  console.log("Treasury balance (wei):", BigInt(balHex).toString());
}

main();
