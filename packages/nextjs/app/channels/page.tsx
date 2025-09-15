"use client";

import Image from "next/image";

// Mock data for channels
const mockChannels = [
  {
    id: "1",
    name: "Crypto Insights",
    creator: {
      address: "0x1234...abcd",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x1234abcd",
    },
    subscribers: 1200,
    symbol: "CINS",
    marketCap: "$1.2M",
  },
  {
    id: "2",
    name: "NFT News",
    creator: {
      address: "0x5678...efgh",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x5678efgh",
    },
    subscribers: 850,
    symbol: "NFTN",
    marketCap: "$800K",
  },
  {
    id: "3",
    name: "DeFi Alpha",
    creator: {
      address: "0x9abc...wxyz",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x9abcwxyz",
    },
    subscribers: 430,
    symbol: "DEFA",
    marketCap: "$350K",
  },
  // Add more mocks as needed
];

export default function ChannelsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8 text-center">Channels</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mockChannels.map(channel => (
          <div
            key={channel.id}
            className="relative w-full aspect-[9/16] min-w-[180px] min-h-[280px] rounded-lg overflow-hidden bg-base-200 group shadow-md flex flex-col justify-between"
          >
            <div className="p-4 flex flex-col items-center">
              <Image
                src={channel.creator.avatar}
                alt="creator avatar"
                width={48}
                height={48}
                className="rounded-full border border-white/50 mb-2"
                loading="lazy"
              />
              <span className="text-xs font-mono opacity-70 truncate mb-2">
                {channel.creator.address.slice(0, 6)}...{channel.creator.address.slice(-4)}
              </span>
              <span className="text-lg font-semibold text-center mb-1">{channel.name}</span>
              <span className="text-xs opacity-60 mb-1">{channel.symbol}</span>
            </div>
            <div className="p-4 bg-gradient-to-t from-black/80 to-transparent text-white flex flex-col gap-1">
              <span className="text-xs">
                Subscribers: <span className="font-bold">{channel.subscribers}</span>
              </span>
              <span className="text-xs">
                Market Cap: <span className="font-bold">{channel.marketCap}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
