import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const { viem } = await hre.network.connect();
  const pc = await viem.getPublicClient();
  const cfg = JSON.parse(fs.readFileSync(path.resolve("frontend/src/contracts.json"), "utf8"));
  const tre = await viem.getContractAt("Treasury", cfg.Treasury.address);
  const [caller] = await viem.getWalletClients();

  const before = await pc.getBalance({ address: cfg.Treasury.address as `0x${string}` });
  console.log("Caller:", caller.account.address);
  console.log("Treasury balance before:", before.toString());
  console.log("Op before:", await tre.read.op());

  await tre.write.executePayout({ account: caller.account });

  const after = await pc.getBalance({ address: cfg.Treasury.address as `0x${string}` });
  console.log("Treasury balance after:", after.toString());
  console.log("Op after:", await tre.read.op());
}
main();
