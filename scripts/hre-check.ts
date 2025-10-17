import hre from "hardhat";

const main = async () => {
  const conn = await hre.network.connect();
  console.log("has connection.viem:", !!(conn as any).viem);
  if ((conn as any).viem) {
    const wallets = await (conn as any).viem.getWalletClients();
    console.log("wallet clients:", wallets.length);
  }
};
main();
