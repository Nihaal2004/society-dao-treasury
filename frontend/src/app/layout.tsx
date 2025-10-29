import Providers from './providers';
import './globals.css';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const metadata = { title: 'Society DAO Treasury Demo' };

function Navigation() {
  return (
    <nav className="mb-6 rounded-2xl border border-gray-800 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <Link href="/" className="text-xl font-semibold hover:text-gray-300">
          Society DAO
        </Link>
        <div className="ml-auto">
          <ConnectButton />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/members" className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
          Members
        </Link>
        <Link href="/dues" className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
          Dues
        </Link>
        <Link href="/proposals" className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
          Proposals
        </Link>
        <Link href="/treasury" className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
          Treasury
        </Link>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="min-h-screen bg-gray-950 text-gray-100">
        <Providers>
          <div className="mx-auto max-w-4xl p-6">
            <Navigation />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
