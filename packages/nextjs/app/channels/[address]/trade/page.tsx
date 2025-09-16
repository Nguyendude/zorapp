"use client";

import { TradingInterface } from "~~/components/PostMint/TradingInterface";

interface TradePageProps {
  params: {
    address: string;
  };
}

export default function TradePage({ params: { address } }: TradePageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <TradingInterface tokenAddress={address} />
      </div>
    </div>
  );
}