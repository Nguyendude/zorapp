"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCoin, getCoinsLastTraded, getCoinsMostValuable, getCoinsNew, setApiKey } from "@zoralabs/coins-sdk";
import { formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";

// import { notification } from "@/utils/scaffold-eth";

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
} // Closing brace added here

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

// Mock channels data (for demo)
const mockChannels = [
  {
    id: "1",
    name: "BunCoin",
    creator: {
      address: "0x1234...abcd",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x1234abcd"
    },
    subscribers: 164,
    symbol: "BUN COIN",
    marketCap: "$3.7M"
  },
  {
    id: "2",
    name: "Feed The People",
    creator: {
      address: "0x5678...efgh",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x5678efgh"
    },
    subscribers: 184,
    symbol: "FTP",
    marketCap: "$1.6M"
  },
  {
    id: "3",
    name: "Bagwork",
    creator: {
      address: "0x9abc...wxyz",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x9abcwxyz"
    },
    subscribers: 2088,
    symbol: "BAG",
    marketCap: "$23.0M"
  },
  {
    id: "4",
    name: "Lenny",
    creator: {
      address: "0xdef0...1234",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0xdef01234"
    },
    subscribers: 492,
    symbol: "LENNY",
    marketCap: "$10.6K"
  }
];

export default function ExplorePage() {
  const { address } = useAccount();
  const [coins, setCoins] = useState<CoinNode[]>([]);
  const [coinMetasLoading, setCoinMetasLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ExploreTab["id"]>("new");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Optional kill-switch for media fetching if networks are flaky
  const DISABLE_MEDIA_FETCH = typeof window !== "undefined" && process.env.NEXT_PUBLIC_DISABLE_MEDIA_FETCH === "true";

  async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined = undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("timeout")), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }

  const exploreTabs: ExploreTab[] = useMemo(
    () => [
      {
        id: "new",
        label: "🆕 New Coins",
        fetchFunction: () => getCoinsNew({ count: 100 }) as Promise<ExploreListResponse>,
      },
      {
        id: "valuable",
        label: "💎 High Marketcap",
        fetchFunction: () => getCoinsMostValuable({ count: 60 }) as Promise<ExploreListResponse>,
      },
      {
        id: "trending",
        label: "🔥 Recently Traded",
        fetchFunction: () => getCoinsLastTraded({ count: 60 }) as Promise<ExploreListResponse>,
      },
    ],
    []
  );

  const fetchCoins = useCallback(async () => {
    setLoading(true);
    const tab = exploreTabs.find(t => t.id === activeTab);
    if (!tab) return setLoading(false);

    try {
      const res = await tab.fetchFunction();
      const edges = res.data?.exploreList?.edges || [];
      const allCoins = edges.map(({ node }) => ({
        ...node,
        totalSupply: safeFormatEther(node.totalSupply),
        marketCap: safeFormatEther(node.marketCap),
        volume24h: safeFormatEther(node.volume24h),
      }));
      // Pagination: only show coins for current page
      setCoins(allCoins.slice((page - 1) * pageSize, page * pageSize));
    } catch (err) {
      console.error("Error fetching coins:", err);
      setCoins([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, exploreTabs, page]);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  // Lazy load media for visible coins only (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!coins.length) return;
    if (!process.env.NEXT_PUBLIC_ZORA_API_KEY || DISABLE_MEDIA_FETCH) return;
    let cancelled = false;
    async function fetchVisibleCoinsMedia() {
      setCoinMetasLoading(true);
      const settled = await Promise.allSettled(
        coins.map(async c => {
          if (c.mediaContent) return c;
          try {
            const response = await withTimeout(
              getCoin({ address: c.address, chain: baseSepolia.id }),
              8000
            );
            const fullCoin = response.data?.zora20Token;
            if (fullCoin && fullCoin.mediaContent) {
              return { ...c, mediaContent: fullCoin.mediaContent } as typeof c;
            }
            return c;
          } catch (err) {
            console.error(`Failed to fetch full coin data for ${c.address}:`, err);
            return c;
          }
        })
      );
      if (!cancelled) {
        setCoins(settled.map(r => (r.status === "fulfilled" ? r.value : coins[0])));
        setCoinMetasLoading(false);
      }
    }
    fetchVisibleCoinsMedia();
    return () => {
      cancelled = true;
    };
  }, [coins]);

  // Skeleton loader
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 w-full max-w-6xl">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="animate-pulse bg-base-200 rounded-lg aspect-[9/16] w-full h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
            <div key={channel.id} className="bg-base-200 rounded-xl p-3 hover:bg-base-300 transition-all duration-200 cursor-pointer flex gap-3 items-center group">
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
                  <span className="text-xs bg-base-300 px-1.5 py-0.5 rounded-md">LIVE</span>
                </div>
                <div className="text-xs opacity-70 truncate">{channel.symbol}</div>
                <div className="text-xs font-medium mt-0.5 text-success">Market cap: {channel.marketCap}</div>
              </div>
              <div className="text-xs opacity-60">
                <div>replies: {channel.subscribers}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">Featured</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {coins.slice(0, 3).map(c => {
            const mediaUrl = c.mediaContent?.previewImage?.medium || c.mediaContent?.previewImage?.small || null;
            return (
              <Link href={`/post/${c.address}`} key={c.id}>
                <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden cursor-pointer group border-2 border-primary">
                  {mediaUrl ? (
                    <Image
                      src={mediaUrl}
                      alt={c.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-base-200 opacity-50">
                      <span className="text-xs">No media</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center mb-1">
                      <h2 className="text-sm md:text-base font-semibold truncate leading-tight">{c.name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-xs opacity-80 mb-1">
                      <span className="bg-black/40 rounded px-2 py-0.5">{c.symbol}</span>
                      <span className="bg-black/40 rounded px-2 py-0.5">Marketcap: {c.marketCap}</span>
                      <span className="bg-black/40 rounded px-2 py-0.5">Holders: {c.uniqueHolders}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Categories Bar */}
  <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {[
          "Featured",
          "Trending",
          "Pop Culture",
          "Music",
          "Sports",
          "Events",
          "All",
        ].map(category => (
          <button
            key={category}
            className="btn btn-sm btn-outline rounded-full px-4 py-1 text-base font-medium"
            // onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="tabs tabs-boxed mb-8 bg-base-200">
        {coins.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl opacity-70">No coins found</p>
            <p className="text-sm opacity-50">Try a different category or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {coins.map(c => {
              const mediaUrl = c.mediaContent?.previewImage?.medium || c.mediaContent?.previewImage?.small || null;
              return (
                <Link href={`/post/${c.address}`} key={c.id}>
                  <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden cursor-pointer group">
                    {/* Media (Image) as the background */}
                    {coinMetasLoading && !mediaUrl ? (
                      <div className="w-full h-full animate-pulse bg-base-200" />
                    ) : mediaUrl ? (
                      <Image
                        src={mediaUrl}
                        alt={c.name}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-base-200 opacity-50">
                        <span className="text-xs">No media</span>
                      </div>
                    )}
                    {/* Overlay for text and creator info */}
                    <div className="absolute inset-x-0 bottom-0 p-3 text-white bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex items-center mb-1">
                        <h2 className="text-sm md:text-base font-semibold truncate leading-tight">{c.name}</h2>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center text-xs opacity-80 mb-1">
                        <span className="bg-black/40 rounded px-2 py-0.5">{c.symbol}</span>
                        <span className="bg-black/40 rounded px-2 py-0.5">Marketcap: {c.marketCap}</span>
                        <span className="bg-black/40 rounded px-2 py-0.5">Holders: {c.uniqueHolders}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Image
                          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${c.creatorAddress}`}
                          alt="avatar"
                          width={18}
                          height={18}
                          className="rounded-full border border-white/50"
                          loading="lazy"
                        />
                        <span className="text-xs font-mono opacity-70 truncate">
                          {c.creatorAddress.slice(0, 4)}...{c.creatorAddress.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        <div className="flex justify-center mt-8 gap-2">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="px-2 py-1">Page {page}</span>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setPage(p => p + 1)}
            disabled={coins.length < pageSize}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}