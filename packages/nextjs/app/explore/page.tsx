import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCoin, getCoinsLastTraded, getCoinsMostValuable, getCoinsNew, setApiKey } from "@zoralabs/coins-sdk";
import { formatEther } from "viem";
import { baseSepolia } from "viem/chains";

setApiKey(process.env.NEXT_PUBLIC_ZORA_API_KEY || "");

interface CoinNode {
  id: string;
  name: string;
  symbol: string;
  address: string;
  creatorAddress: string;
  totalSupply: string;
  marketCap: string;
  volume24h: string;
  createdAt: string;
  uniqueHolders: string;
  description?: string;
  totalVolume?: string;
  uniswapV3PoolAddress?: string;
  mediaContent?: {
    previewImage?: {
      small?: string;
      medium?: string;
      large?: string;
    };
  };
}

interface ExploreListResponse {
  data?: {
    exploreList?: {
      edges: { node: CoinNode; cursor: string }[];
      pageInfo: {
        endCursor: string;
        hasNextPage: boolean;
      };
    };
  };
}

type FetchFn = () => Promise<ExploreListResponse>;

interface ExploreTab {
  id: string;
  label: string;
  fetchFunction: FetchFn;
}

function safeFormatEther(wei: string | undefined): string {
  if (!wei) return "0";
  try {
    return formatEther(BigInt(wei));
  } catch {
    return "0";
  }
}

const mockChannels = [
  {
    id: "1",
    name: "BunCoin",
    creator: {
      address: "0x1234...abcd",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x1234abcd",
    },
    subscribers: 164,
    symbol: "BUN COIN",
    marketCap: "$3.7M",
  },
  {
    id: "2",
    name: "Feed The People",
    creator: {
      address: "0x5678...efgh",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x5678efgh",
    },
    subscribers: 184,
    symbol: "FTP",
    marketCap: "$1.6M",
  },
  {
    id: "3",
    name: "Bagwork",
    creator: {
      address: "0x9abc...wxyz",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x9abcwxyz",
    },
    subscribers: 2088,
    symbol: "BAG",
    marketCap: "$23.0M",
  },
  {
    id: "4",
    name: "Lenny",
    creator: {
      address: "0xdef0...1234",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0xdef01234",
    },
    subscribers: 492,
    symbol: "LENNY",
    marketCap: "$10.6K",
  },
];

export default async function ExplorePage() {
  // Server-side data fetching for initial tab ("new")
  setApiKey(process.env.NEXT_PUBLIC_ZORA_API_KEY || "");
  const pageSize = 20;
  let coins: CoinNode[] = [];
  try {
  const res = (await getCoinsNew({ count: pageSize })) as ExploreListResponse;
    const edges = res.data?.exploreList?.edges || [];
    coins = edges.map(({ node }) => ({
      ...node,
      totalSupply: safeFormatEther(node.totalSupply),
      marketCap: safeFormatEther(node.marketCap),
      volume24h: safeFormatEther(node.volume24h),
    }));
  } catch (err) {
    console.error("Error fetching coins:", err);
    coins = [];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Channels Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Channels</h2>
          <Link
            href="/channels"
            className="text-sm bg-base-200 hover:bg-base-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            See all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mockChannels.map(channel => (
            <div key={channel.id} className="relative rounded-xl overflow-hidden group">
              <div className="absolute inset-0 z-0">
                <Image
                  src={`https://api.dicebear.com/7.x/shapes/svg?seed=${channel.id}`}
                  alt="background"
                  fill
                  className="object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-base-200/90 backdrop-blur-sm"></div>
              </div>

              <div className="relative z-10 p-3 flex gap-3 items-center hover:bg-base-300/50 transition-all duration-200 cursor-pointer">
                <div className="relative">
                  <Image
                    src={channel.creator.avatar}
                    alt="creator avatar"
                    width={50}
                    height={50}
                    className="rounded-lg border border-base-300"
                    loading="lazy"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success animate-pulse"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{channel.name}</h3>
                    <span className="text-xs bg-base-300/50 px-1.5 py-0.5 rounded-md">LIVE</span>
                  </div>
                  <div className="text-xs opacity-70 truncate">{channel.symbol}</div>
                  <div className="text-xs font-medium mt-0.5 text-success">Market cap: {channel.marketCap}</div>
                </div>
                <div className="text-xs opacity-60">
                  <div>Sub: {channel.subscribers}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {["Featured", "Trending", "Pop Culture", "Music", "Sports", "Events", "All"].map(category => (
          <button
            key={category}
            className="btn btn-sm btn-outline rounded-full px-4 py-1 text-base font-medium"
            // onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="tabs tabs-boxed mb-8 bg-transparent">
        {coins.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl opacity-70">No coins found</p>
            <p className="text-sm opacity-50">Try a different category or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-1">
            {coins.map(c => {
              const mediaUrl = c.mediaContent?.previewImage?.medium || c.mediaContent?.previewImage?.small || null;
              const volumeChange = parseFloat(c.volume24h || "0");
              const changeColorClass = volumeChange >= 0 ? "text-success" : "text-error";

              return (
                <Link href={`/post/${c.address}`} key={c.id} className="block">
                  <div
                    className="relative rounded-xl overflow-hidden cursor-pointer mx-auto"
                    style={{ width: 240, height: 400 }}
                  >
                    {mediaUrl ? (
                      <div className="flex items-center justify-center w-full h-full bg-base-200">
                        <Image src={mediaUrl} alt={c.name} fill className="object-contain" loading="lazy" />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center bg-base-200 opacity-50"
                        style={{ width: 240, height: 400 }}
                      >
                        <span className="text-xs">No media</span>
                      </div>
                    )}
                    <div className="absolute inset-0 p-2 text-white flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {c.mediaContent?.previewImage?.small && (
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-white">
                              <Image
                                src={c.mediaContent.previewImage.small}
                                alt="avatar"
                                width={20}
                                height={20}
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="text-xs font-semibold opacity-80">
                            @{c.creatorAddress.substring(2, 6)}...
                            {c.creatorAddress.substring(c.creatorAddress.length - 4)}
                          </span>
                        </div>
                        <div className="bg-black/50 rounded-full px-2 py-0.5 text-xs font-semibold">1d</div>
                      </div>
                      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 text-center w-full">
                        <h3 className="font-bold text-lg leading-tight truncate">{c.name}</h3>
                        <p className="text-sm opacity-80 whitespace-pre-line break-words max-h-24 overflow-y-auto">
                          {c.description || "The spice must flow"}
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-base-300 p-2 flex flex-col items-center gap-1 rounded-b-xl">
                      <div className="flex justify-around w-full text-xs font-small">
                        <div className="flex flex-col items-center">
                          <span>MCAP</span>
                          <span className="font-bold">{parseFloat(c.marketCap).toFixed(2)}k</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span>24h</span>
                          <span className="font-bold">{parseFloat(c.volume24h).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span>24h Δ</span>
                          <span className={`font-bold ${changeColorClass}`}>
                            {volumeChange > 0 ? "+" : ""}
                            {volumeChange.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <button className="w-full mt-2 py-1 bg-base-100 hover:bg-base-200 rounded-lg text-sm font-medium transition-colors">
                        Trade
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
