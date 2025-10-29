import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const { viem } = await hre.network.connect();
  const pc = await viem.getPublicClient();
  
  const cfg = JSON.parse(fs.readFileSync(path.resolve("frontend/src/contracts.json"), "utf8"));
  const tre = await viem.getContractAt("Treasury", cfg.Treasury.address);
  const op = await tre.read.op();
  
  const latestBlock = await pc.getBlock();
  const blockTime = Number(latestBlock.timestamp);
  const eta = Number(op.eta);
  
  console.log("Blockchain current time:", blockTime, new Date(blockTime * 1000).toISOString());
  console.log("Payout ETA:", eta, new Date(eta * 1000).toISOString());
  console.log("Real-world time:", Math.floor(Date.now() / 1000), new Date().toISOString());
  console.log("");
  console.log("Ready to execute?", blockTime >= eta);
  console.log("Executed?", op.executed);
}

main();
