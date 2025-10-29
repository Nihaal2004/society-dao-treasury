import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const { viem } = await hre.network.connect();
  const cfg = JSON.parse(fs.readFileSync(path.resolve("frontend/src/contracts.json"), "utf8"));
  const tre = await viem.getContractAt("Treasury", cfg.Treasury.address);
  const op = await tre.read.op();
  const now = Math.floor(Date.now() / 1000);
  console.log({ now, op });
}
main();
