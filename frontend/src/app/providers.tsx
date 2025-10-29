'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider, createConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { injected, coinbaseWallet } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'wagmi';
import { custom } from 'viem';
// @ts-ignore – Next can import JSON in app router
import contracts from '../contracts.json';

const chain = {
  id: (contracts?.chainId as number) ?? 31337,
  name: 'Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
} as const;

const transport =
  typeof window !== 'undefined' && (window as any).ethereum
    ? custom((window as any).ethereum)
    : http(chain.rpcUrls.default.http[0]);

const config = createConfig({
  chains: [chain],
  connectors: [injected(), coinbaseWallet({ appName: 'Society DAO Demo' })],
  transports: { [chain.id]: transport },
});

const qc = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
