import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const conn = await hre.network.connect();
  const { viem, provider } = conn;

  const [admin] = await viem.getWalletClients();

  const sbt = await viem.deployContract("MembershipSBT", [admin.account.address]);
  const gov = await viem.deployContract("SocietyGovernor", [sbt.address]);
  const tre = await viem.deployContract("Treasury", [gov.address]);

  console.log("SBT:", sbt.address);
  console.log("Governor:", gov.address);
  console.log("Treasury:", tre.address);

  const chainIdHex = (await provider.request({ method: "eth_chainId", params: [] })) as string;
  const chainId = Number(chainIdHex);

  const sbtArtifact = await hre.artifacts.readArtifact("MembershipSBT");
  const govArtifact = await hre.artifacts.readArtifact("SocietyGovernor");
  const treArtifact = await hre.artifacts.readArtifact("Treasury");

  const out = {
    chainId,
    MembershipSBT: { address: sbt.address, abi: sbtArtifact.abi },
    SocietyGovernor: { address: gov.address, abi: govArtifact.abi },
    Treasury: { address: tre.address, abi: treArtifact.abi },
  };

  const outPath = path.resolve(process.cwd(), "frontend", "src", "contracts.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote", outPath);
}

main();
