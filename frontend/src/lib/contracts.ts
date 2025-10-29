// @ts-ignore - JSON import in app router
import contracts from "../contracts.json";

export const CHAIN_ID: number = (contracts?.chainId as number) ?? 31337;

export const addresses = {
  MembershipSBT: (contracts as any).MembershipSBT.address as `0x${string}`,
  SocietyGovernor: (contracts as any).SocietyGovernor.address as `0x${string}`,
  Treasury: (contracts as any).Treasury.address as `0x${string}`,
};

export const abis = {
  MembershipSBT: (contracts as any).MembershipSBT.abi,
  SocietyGovernor: (contracts as any).SocietyGovernor.abi,
  Treasury: (contracts as any).Treasury.abi,
};
