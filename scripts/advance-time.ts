import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const { provider, viem } = await hre.network.connect();
  
  // Get the scheduled payout ETA from the Treasury contract
  const cfg = JSON.parse(fs.readFileSync(path.resolve("frontend/src/contracts.json"), "utf8"));
  const tre = await viem.getContractAt("Treasury", cfg.Treasury.address);
  const op = await tre.read.op();
  
  console.log("Current scheduled payout:", op);
  
  const eta = Number(op.eta);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeToAdvance = eta - currentTime + 10; // Add 10 seconds buffer
  
  console.log(`Current time: ${currentTime}`);
  console.log(`ETA: ${eta}`);
  console.log(`Need to advance: ${timeToAdvance} seconds (${Math.floor(timeToAdvance / 60)} minutes)`);
  
  if (timeToAdvance > 0) {
    await provider.request({ method: "evm_increaseTime", params: [timeToAdvance] });
    await provider.request({ method: "evm_mine", params: [] });
    console.log(`✅ Time advanced by ${timeToAdvance} seconds and block mined`);
  } else {
    console.log("⚠️ ETA already passed, no need to advance time");
  }
}

main();
