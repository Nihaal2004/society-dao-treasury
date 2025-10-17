import { describe, it } from "node:test";
import assert from "node:assert/strict";
import hre from "hardhat";
import { encodeFunctionData, parseAbi, stringToHex, keccak256 } from "viem";

describe("M1-M2 demo", () => {
  it("SBT non-transfer, dues, timelocked payout", async () => {
    const [admin, m1, m2, m3, recipient] = await hre.viem.getWalletClients();

    const sbt = await hre.viem.deployContract("MembershipSBT", [admin.account.address]);
    const gov = await hre.viem.deployContract("SocietyGovernor", [sbt.address]);
    const treasury = await hre.viem.deployContract("Treasury", [gov.address]);

    const sbtC = await hre.viem.getContractAt("MembershipSBT", sbt.address);
    const govC = await hre.viem.getContractAt("SocietyGovernor", gov.address);
    const treC = await hre.viem.getContractAt("Treasury", treasury.address);

    // Mint 3 SBTs
    await sbtC.write.mint([m1.account.address], { account: admin.account });
    await sbtC.write.mint([m2.account.address], { account: admin.account });
    await sbtC.write.mint([m3.account.address], { account: admin.account });

    // Soulbound check: transfer should revert
    let reverted = false;
    try {
      await sbtC.write.transferFrom([m1.account.address, m2.account.address, 1n], { account: m1.account });
    } catch { reverted = true; }
    assert.equal(reverted, true);

    // Dues event path
    await sbtC.write.payDues(["Oct"], { account: m1.account, value: 100000000000000000n }); // 0.1 ETH

    // Fund treasury
    await treC.write.deposit(["seed"], { account: admin.account, value: 1000000000000000000n }); // 1 ETH

    // Propose schedulePayout
    const eta = BigInt(Math.floor(Date.now() / 1000) + 5);
    const calldata = encodeFunctionData({
      abi: parseAbi(["function schedulePayout(address to,uint256 amount,uint64 eta,string note)"]),
      functionName: "schedulePayout",
      args: [recipient.account.address, 50000000000000000n, eta, "Grant"] // 0.05 ETH
    });
    const targets = [treasury.address];
    const values = [0n];
    const calldatas = [calldata];
    const desc = "Pay 0.05 ETH to recipient";

    await govC.write.propose([targets, values, calldatas, desc], { account: m1.account });

    const proposalId = await govC.read.hashProposal([targets, values, calldatas, keccak256(stringToHex(desc))]);

    // Advance past voting delay
    await hre.network.provider.send("evm_mine");

    // Vote yes with two members
    await govC.write.castVote([proposalId, 1n], { account: m1.account });
    await govC.write.castVote([proposalId, 1n], { account: m2.account });

    // Mine blocks to end voting period
    for (let i = 0; i < 9; i++) await hre.network.provider.send("evm_mine");

    // Execute proposal (schedules payout)
    await govC.write.execute([targets, values, calldatas, keccak256(stringToHex(desc))], { account: m1.account });

    // Too early executePayout should revert
    let early = false;
    try { await treC.write.executePayout([], { account: m1.account }); } catch { early = true; }
    assert.equal(early, true);

    // After eta it should succeed
    await hre.network.provider.send("evm_increaseTime", [6]);
    await hre.network.provider.send("evm_mine");
    await treC.write.executePayout([], { account: m1.account });
  });
});
