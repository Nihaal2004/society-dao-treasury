import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";
import { encodeFunctionData, parseAbi, keccak256, stringToHex, parseEther } from "viem";

async function main() {
  const { viem, provider } = await hre.network.connect();
  const [admin, m1, m2, m3, recipient] = await viem.getWalletClients();

  const cfg = JSON.parse(fs.readFileSync(path.resolve("frontend/src/contracts.json"), "utf8"));
  const sbt = await viem.getContractAt("MembershipSBT", cfg.MembershipSBT.address);
  const gov = await viem.getContractAt("SocietyGovernor", cfg.SocietyGovernor.address);
  const tre = await viem.getContractAt("Treasury", cfg.Treasury.address);

  // Mint SBTs
  await sbt.write.mint([m1.account.address], { account: admin.account });
  await sbt.write.mint([m2.account.address], { account: admin.account });
  await sbt.write.mint([m3.account.address], { account: admin.account });

  // Dues + seed treasury
  await sbt.write.payDues(["Oct"], { account: m1.account, value: parseEther("0.1") });
  await tre.write.deposit(["seed"], { account: admin.account, value: parseEther("1") });

  // Propose -> vote -> execute (schedules payout)
  const eta = BigInt(Math.floor(Date.now() / 1000) + 120);
  const calldata = encodeFunctionData({
    abi: parseAbi(["function schedulePayout(address to,uint256 amount,uint64 eta,string note)"]),
    functionName: "schedulePayout",
    args: [recipient.account.address, parseEther("0.05"), eta, "Grant"],
  });
  const targets = [cfg.Treasury.address] as `0x${string}`[];
  const values = [0n] as bigint[];
  const calldatas = [calldata] as `0x${string}`[];
  const desc = "Pay 0.05 ETH to recipient";

  await gov.write.propose([targets, values, calldatas, desc], { account: m1.account });
  const descHash = keccak256(stringToHex(desc));
  const proposalId = await gov.read.hashProposal([targets, values, calldatas, descHash]);

  await provider.request({ method: "evm_mine", params: [] });
  await gov.write.castVote([proposalId, 1], { account: m1.account });
  await gov.write.castVote([proposalId, 1], { account: m2.account });
  for (let i = 0; i < 9; i++) await provider.request({ method: "evm_mine", params: [] });

  await gov.write.execute([targets, values, calldatas, descHash], { account: m1.account });
  console.log("Scheduled payout eta:", eta.toString());
}
main();
