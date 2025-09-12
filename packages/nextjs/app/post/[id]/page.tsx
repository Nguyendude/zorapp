"use client";

import { useEffect, useState } from "react";
// import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCoin, setApiKey } from "@zoralabs/coins-sdk";
import { formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

// Set API key
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ZORA_API_KEY) {
  setApiKey(process.env.NEXT_PUBLIC_ZORA_API_KEY);
}

// Safe BigInt conversion helper function
function safeBigIntString(value: string | undefined | null): string {
  if (!value || value === "") return "0";

  // Handle zero values (including "0.0")
  const floatVal = parseFloat(value);
  if (isNaN(floatVal) || floatVal <= 0) return "0";

  // Convert to integer string (removes decimal part)
  return Math.floor(floatVal).toString();
}

// Safe formatter function for displaying ETH values
function safeFormatEther(value: string | undefined | null): string {
  try {
    const safeValue = safeBigIntString(value);
    if (safeValue === "0") return "0";
    return formatEther(BigInt(safeValue));
  } catch (error) {
    console.warn("Error formatting ether value:", value, error);
    return "0";
  }
}

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  description: string;
  address: string;
  totalSupply: string;
  totalVolume: string;
  volume24h: string;
  marketCap: string;
  createdAt: string;
  creatorAddress: string;
  uniqueHolders: number;
  chainId: number;
  mediaContent?: {
    previewImage?: {
      small?: string;
      medium?: string;
      large?: string;
    };
  };
}

export default function PostDetailPage() {
  const params = useParams();
  const { address } = useAccount();
  const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoinData = async () => {
      if (!params.id) return;

      setLoading(true);
      setError(null);

      try {
        const coinAddress = params.id as string;
        console.log("Fetching coin data for address:", coinAddress);

        const response = await getCoin({
          address: coinAddress,
          chain: baseSepolia.id,
        });

        console.log("Coin response:", response);

        const coin = response.data?.zora20Token;

        if (coin) {
          setCoinData({
            id: coin.id,
            name: coin.name || "Untitled Post",
            symbol: coin.symbol || "POST",
            description: coin.description || "",
            address: coin.address,
            // Use safe conversion for all numeric values
            totalSupply: coin.totalSupply || "0",
            totalVolume: coin.totalVolume || "0",
            volume24h: coin.volume24h || "0",
            marketCap: coin.marketCap || "0",
            createdAt: coin.createdAt || "",
            creatorAddress: coin.creatorAddress || "",
            uniqueHolders: coin.uniqueHolders || 0,
            chainId: coin.chainId || baseSepolia.id,
            mediaContent: coin.mediaContent,
          });
        } else {
          setError("Coin not found");
        }
      } catch (error: any) {
        console.error("Error fetching coin:", error);
        if (error.status === 404) {
          setError("Coin not found");
        } else if (error.status === 401) {
          setError("API key invalid or missing");
        } else {
          setError(`Failed to load coin: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p>Loading coin data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="alert alert-error mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
        <div className="text-center">
          <Link href="/dashboard" className="btn btn-primary mr-4">
            Back to Dashboard
          </Link>
          <Link href="/" className="btn btn-outline">
            Create New Post
          </Link>
        </div>
      </div>
    );
  }

  if (!coinData) {
    return (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="alert alert-warning">
          <span>No coin data found</span>
        </div>
        <Link href="/dashboard" className="btn btn-primary mt-4">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/explore">Explore</Link>
          </li>
          <li>{coinData.name}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {coinData.mediaContent?.previewImage && (
                <div className="mb-6">
                  <img
                    src={coinData.mediaContent.previewImage.medium || coinData.mediaContent.previewImage.small || ""}
                    alt={coinData.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <h1 className="card-title text-3xl mb-4">{coinData.name}</h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-12">
                    <span className="text-2xl mx-3 my-3">{coinData.creatorAddress.slice(2, 4).toUpperCase()}</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold">Creator: {coinData.creatorAddress}</p>
                  <p className="text-sm opacity-70">
                    {coinData.createdAt ? new Date(coinData.createdAt).toLocaleDateString() : "Unknown date"}
                  </p>
                </div>
                {coinData.creatorAddress.toLowerCase() === address?.toLowerCase() && (
                  <div className="badge badge-primary">Your Post</div>
                )}
              </div>

              <div className="prose max-w-none mb-6 bg-base-200 rounded-xl">
                <div className="whitespace-pre-wrap mx-10 my-7 text-accent-content justify-items-center">
                  {coinData.description || "No description available for this post."}
                </div>
              </div>

              <div className="divider"></div>

              {/* Fixed statistics using safe formatters */}
              <div className="stats stats-horizontal shadow">
                <div className="stat">
                  <div className="stat-title">Market Cap</div>
                  <div className="stat-value text-success text-lg">{safeFormatEther(coinData.marketCap)} ETH</div>
                </div>
                <div className="stat">
                  <div className="stat-title">24h Volume</div>
                  <div className="stat-value text-info text-lg">{safeFormatEther(coinData.volume24h)} ETH</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Holders</div>
                  <div className="stat-value text-primary text-lg">{coinData.uniqueHolders}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">🪙 Coin Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Symbol:</span>
                  <span className="font-mono font-bold">{coinData.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Supply:</span>
                  <span className="font-mono">{safeFormatEther(coinData.totalSupply)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Volume:</span>
                  <span className="font-mono">{safeFormatEther(coinData.totalVolume)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span>Base Sepolia</span>
                </div>
                <div className="flex justify-between">
                  <span>Contract:</span>
                  <a
                    href={`https://sepolia.basescan.org/address/${coinData.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary font-mono text-sm"
                  >
                    {coinData.address.slice(0, 6)}...{coinData.address.slice(-4)}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">🎯 Actions</h3>
              <div className="space-y-2">
                <a
                  href={`https://testnet.zora.co/coin/bsep:${coinData.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full"
                >
                  💰 Trade on Zora
                </a>
                <a
                  href={`https://sepolia.basescan.org/address/${coinData.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full"
                >
                  📜 View Contract
                </a>
                <button className="btn btn-outline w-full">📈 View Analytics</button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">📤 Share</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    notification.success("Link copied to clipboard!");
                  }}
                  className="btn btn-outline w-full"
                >
                  📋 Copy Link
                </button>
                <Link href={`https://x.com`} target="_blank">
                  <button className="btn btn-outline w-full">🐦 Share on X</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
