"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { getCoinsNew, setApiKey } from "@zoralabs/coins-sdk";
import Link from "next/link";

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

export default function CreatorsPage() {
  const [coins, setCoins] = useState<CoinNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    async function fetchCoins() {
      setLoading(true);
      try {
        const res = await getCoinsNew({ count: 100 });
        const edges = res.data?.exploreList?.edges || [];
        setCoins(edges.map(({ node }) => node));
      } catch (err) {
        setCoins([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCoins();
  }, []);

  // Get unique creators from coins
  const creators = useMemo(() => {
    const map = new Map<string, CoinNode[]>();
    coins.forEach(coin => {
      if (!map.has(coin.creatorAddress)) map.set(coin.creatorAddress, []);
      map.get(coin.creatorAddress)!.push(coin);
    });
    return Array.from(map.entries());
  }, [coins]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="animate-pulse bg-base-200 rounded-lg aspect-[9/16] w-full min-w-[180px] min-h-[280px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8 text-center">Creators</h1>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {creators.map(([creator, coins]) => (
          <div key={creator} className="relative w-full aspect-[9/16] min-w-[180px] min-h-[280px] rounded-lg overflow-hidden bg-base-200 group shadow-md">
            <div className="absolute inset-x-0 top-0 p-3 flex flex-col items-center">
              <Image
                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${creator}`}
                alt="avatar"
                width={48}
                height={48}
                className="rounded-full border border-white/50 mb-2"
                loading="lazy"
              />
              <span className="text-xs font-mono opacity-70 truncate">
                {creator.slice(0, 6)}...{creator.slice(-4)}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3 text-white bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex flex-col gap-1">
                {coins.slice(0, 2).map(coin => (
                  <Link href={`/post/${coin.address}`} key={coin.id}>
                    <span className="text-xs font-semibold underline hover:text-primary">
                      {coin.name}
                    </span>
                  </Link>
                ))}
                {coins.length > 2 && (
                  <span className="text-xs opacity-60">+{coins.length - 2} more</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
