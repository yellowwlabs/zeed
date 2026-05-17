import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";
import { WalletProvider } from "@/lib/wallet-context";

export const metadata: Metadata = {
  title: "Zeed",
  description: "Zeed — startup fundraising contracts: SAFEs, convertible notes, e-signature",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <TRPCProvider>
          <WalletProvider>{children}</WalletProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
