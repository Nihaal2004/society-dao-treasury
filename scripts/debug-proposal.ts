import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const { viem } = await hre.network.connect();
  const pc = await viem.getPublicClient();
  
  const cfg = JSON.parse(fs.readFileSync(path.resolve("frontend/src/contracts.json"), "utf8"));
  const gov = await viem.getContractAt("SocietyGovernor", cfg.SocietyGovernor.address);
  const tre = await viem.getContractAt("Treasury", cfg.Treasury.address);
  
  // Get current block and time
  const currentBlock = await pc.getBlockNumber();
  const currentBlockData = await pc.getBlock({ blockNumber: currentBlock });
  const currentTime = currentBlockData.timestamp;
  
  console.log("\n=== CURRENT STATE ===");
  console.log("Current Block:", currentBlock.toString());
  console.log("Current Timestamp:", currentTime.toString());
  console.log("Current Time (readable):", new Date(Number(currentTime) * 1000).toISOString());
  
  // Get Treasury state
  const treasuryBalance = await pc.getBalance({ address: cfg.Treasury.address as `0x${string}` });
  const op = await tre.read.op();
  
  console.log("\n=== TREASURY STATE ===");
  console.log("Balance:", treasuryBalance.toString(), "wei");
  console.log("Scheduled Payout:");
  console.log("  - To:", op[0]);
  console.log("  - Amount:", op[1].toString(), "wei");
  console.log("  - Note:", op[2]);
  console.log("  - ETA:", op[3].toString());
  console.log("  - ETA (readable):", new Date(Number(op[3]) * 1000).toISOString());
  console.log("  - Executed:", op[4]);
  
  const etaDiff = Number(op[3]) - Number(currentTime);
  console.log("\n=== ETA ANALYSIS ===");
  if (etaDiff > 0) {
    console.log("✓ ETA is", etaDiff, "seconds in the FUTURE");
    console.log("  Payout can be executed after", new Date(Number(op[3]) * 1000).toISOString());
  } else {
    console.log("✗ ETA is", Math.abs(etaDiff), "seconds in the PAST");
    console.log("  This would cause 'eta in past' error!");
  }
  
  // Check if amount is sufficient
  console.log("\n=== BALANCE CHECK ===");
  if (op[1] <= treasuryBalance) {
    console.log("✓ Treasury has sufficient balance");
    console.log("  Required:", op[1].toString(), "wei");
    console.log("  Available:", treasuryBalance.toString(), "wei");
  } else {
    console.log("✗ Treasury has INSUFFICIENT balance");
    console.log("  Required:", op[1].toString(), "wei");
    console.log("  Available:", treasuryBalance.toString(), "wei");
    console.log("  Shortage:", (op[1] - treasuryBalance).toString(), "wei");
  }
  
  // Try to get proposal ID from localStorage file
  console.log("\n=== CHECKING SAVED PROPOSAL ===");
  const localStoragePath = path.resolve("frontend", "localStorage_backup.json");
  if (fs.existsSync(localStoragePath)) {
    const saved = JSON.parse(fs.readFileSync(localStoragePath, "utf8"));
    console.log("Saved proposal data:", saved);
  } else {
    console.log("No localStorage backup found (this is normal - data is in browser)");
  }
}

main().catch(console.error);
