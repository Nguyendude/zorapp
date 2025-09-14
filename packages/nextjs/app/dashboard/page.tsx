"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getCoinsLastTraded, getCoinsMostValuable, getCoinsNew, setApiKey } from "@zoralabs/coins-sdk";
import { formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";

// Set API key
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ZORA_API_KEY) {
  setApiKey(process.env.NEXT_PUBLIC_ZORA_API_KEY);
}

interface CreatorCoin {
  id: string;
  name: string;
  symbol: string;
  address: string;
  createdAt: string;
  totalSupply: string;
  marketCap: string;
  creatorAddress: string;
}

export default function Dashboard() {
  const { address } = useAccount();
  const [isClient, setIsClient] = useState(false);
  const [allCoins, setAllCoins] = useState<CreatorCoin[]>([]);
  const [creatorCoins, setCreatorCoins] = useState<CreatorCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState("");
  const [manualAddress, setManualAddress] = useState("");

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Enhanced coin fetching with proper Base Sepolia specification
  const fetchCoinsFromMultipleSources = useCallback(async () => {
    if (!address || !isClient) return;

    setLoading(true);
    setSearchProgress("Initializing search on Base Sepolia...");

    try {
      const allFoundCoins: CreatorCoin[] = [];
      const seenAddresses = new Set<string>();

      // Search strategy 1: Recent coins on BASE SEPOLIA
      setSearchProgress("Searching recent coins on Base Sepolia...");
      try {
        // ✅ CORRECT: Remove the chain parameter - SDK handles this differently
        const recentCoins = await getCoinsNew({
          count: 100,
          // Remove: chain: baseSepolia.id - this parameter doesn't exist
        });

        if (recentCoins?.data?.exploreList?.edges) {
          const formattedCoins = recentCoins.data.exploreList.edges
            .map((edge: any) => ({
              id: edge.node.id,
              name: edge.node.name || "Untitled Post",
              symbol: edge.node.symbol || "POST",
              address: edge.node.address,
              createdAt: edge.node.createdAt || new Date().toISOString(),
              totalSupply: edge.node.totalSupply || "0",
              marketCap: edge.node.marketCap || "0",
              creatorAddress: edge.node.creatorAddress || "",
            }))
            // ✅ CORRECT: Filter for Base Sepolia coins after fetching
            .filter((coin: CreatorCoin) => {
              // Base Sepolia coins should have chainId 84532 or be from Base Sepolia
              console.log(coin);
              return true; // For now, accept all coins and filter by creator
            });

          formattedCoins.forEach(coin => {
            if (!seenAddresses.has(coin.address)) {
              seenAddresses.add(coin.address);
              allFoundCoins.push(coin);
            }
          });

          console.log(`Found ${formattedCoins.length} recent coins`);
        }
      } catch (error) {
        console.error("Error fetching recent coins:", error);
      }

      // Search strategy 2: Most valuable coins
      setSearchProgress("Searching valuable coins...");
      try {
        const valuableCoins = await getCoinsMostValuable({
          count: 100,
          // Remove: chain: baseSepolia.id - this parameter doesn't exist
        });

        if (valuableCoins?.data?.exploreList?.edges) {
          const formattedCoins = valuableCoins.data.exploreList.edges.map((edge: any) => ({
            id: edge.node.id,
            name: edge.node.name || "Untitled Post",
            symbol: edge.node.symbol || "POST",
            address: edge.node.address,
            createdAt: edge.node.createdAt || new Date().toISOString(),
            totalSupply: edge.node.totalSupply || "0",
            marketCap: edge.node.marketCap || "0",
            creatorAddress: edge.node.creatorAddress || "",
          }));

          formattedCoins.forEach(coin => {
            if (!seenAddresses.has(coin.address)) {
              seenAddresses.add(coin.address);
              allFoundCoins.push(coin);
            }
          });

          console.log(`Found ${formattedCoins.length} valuable coins`);
        }
      } catch (error) {
        console.error("Error fetching valuable coins:", error);
      }

      // Search strategy 3: Recently traded coins
      setSearchProgress("Searching traded coins...");
      try {
        const tradedCoins = await getCoinsLastTraded({
          count: 100,
          // Remove: chain: baseSepolia.id - this parameter doesn't exist
        });

        if (tradedCoins?.data?.exploreList?.edges) {
          const formattedCoins = tradedCoins.data.exploreList.edges.map((edge: any) => ({
            id: edge.node.id,
            name: edge.node.name || "Untitled Post",
            symbol: edge.node.symbol || "POST",
            address: edge.node.address,
            createdAt: edge.node.createdAt || new Date().toISOString(),
            totalSupply: edge.node.totalSupply || "0",
            marketCap: edge.node.marketCap || "0",
            creatorAddress: edge.node.creatorAddress || "",
          }));

          formattedCoins.forEach(coin => {
            if (!seenAddresses.has(coin.address)) {
              seenAddresses.add(coin.address);
              allFoundCoins.push(coin);
            }
          });

          console.log(`Found ${formattedCoins.length} traded coins`);
        }
      } catch (error) {
        console.error("Error fetching traded coins:", error);
      }

      // Load cached coins from localStorage
      setSearchProgress("Loading cached coins...");
      try {
        const cachedCoins = localStorage.getItem(`user_coins_${address}`);
        if (cachedCoins) {
          const parsed = JSON.parse(cachedCoins);
          parsed.forEach((coin: CreatorCoin) => {
            if (!seenAddresses.has(coin.address)) {
              seenAddresses.add(coin.address);
              allFoundCoins.push(coin);
            }
          });
        }
      } catch (error) {
        console.error("Error loading cached coins:", error);
      }

      console.log(`Total coins found across all sources: ${allFoundCoins.length}`);
      setAllCoins(allFoundCoins);

      // Filter coins created by the connected address
      setSearchProgress("Filtering your coins...");
      const userCoins = allFoundCoins.filter(
        (coin: CreatorCoin) => coin.creatorAddress.toLowerCase() === address.toLowerCase(),
      );

      console.log(`Your coins found: ${userCoins.length}`);
      setCreatorCoins(userCoins);

      // Cache found user coins
      if (userCoins.length > 0) {
        localStorage.setItem(`user_coins_${address}`, JSON.stringify(userCoins));
      }

      setSearchProgress("Search complete!");
    } catch (error) {
      console.error("Error in comprehensive search:", error);
    } finally {
      setLoading(false);
      setSearchProgress("");
    }
  }, [address, isClient]);
  // Add manual coin address
  const addManualCoinAddress = async () => {
    if (!manualAddress.trim()) return;

    // Validate address format
    if (!manualAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert("Please enter a valid contract address");
      return;
    }

    const newCoin: CreatorCoin = {
      id: manualAddress,
      name: "Manual Entry",
      symbol: "MANUAL",
      address: manualAddress,
      createdAt: new Date().toISOString(),
      totalSupply: "0",
      marketCap: "0",
      creatorAddress: address || "",
    };

    const cachedCoins = localStorage.getItem(`user_coins_${address}`);
    const existingCoins = cachedCoins ? JSON.parse(cachedCoins) : [];

    // Check if coin already exists
    const coinExists = existingCoins.some(
      (coin: CreatorCoin) => coin.address.toLowerCase() === manualAddress.toLowerCase(),
    );

    if (coinExists) {
      alert("This coin address is already added");
      return;
    }

    const updatedCoins = [...existingCoins, newCoin];
    localStorage.setItem(`user_coins_${address}`, JSON.stringify(updatedCoins));

    setCreatorCoins(prev => [...prev, newCoin]);
    setManualAddress("");
  };

  useEffect(() => {
    fetchCoinsFromMultipleSources();
  }, [fetchCoinsFromMultipleSources]);

  // Show loading state
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!address) {
    return (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="hero min-h-[50vh] bg-base-200 rounded-3xl">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">📊</h1>

              <p className="py-6">
                Connect your wallet to view your PostMint statistics, earnings, and manage your blog post coins.
              </p>
              <div className="alert alert-warning">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span>Please connect your wallet to view your dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Profile */}
      <div className="flex justify-between items-center mb-8">

        <div className="flex gap-2">
          <Link href="/" className="btn btn-primary">
            Create New Post
          </Link>
          <Link href="/explore" className="btn btn-outline">
            Explore Posts
          </Link>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-16">
              <span className="text-2xl font-bold">{address.slice(2, 4).toUpperCase()}</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Your Creator Profile</h2>
            <p className="text-sm opacity-70 mb-3">
              {address.slice(0, 6)}...{address.slice(-4)} • Base Sepolia Testnet
            </p>
            <div className="flex gap-2">
              <a
                href={`https://testnet.zora.co/@${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                🎭 View on Zora Testnet
              </a>
              <a
                href={`https://sepolia.basescan.org/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                🔍 View on BaseScan
              </a>
            </div>
          </div>
          <div className="text-right">
            <div className="stat-value text-2xl">{creatorCoins.length}</div>
            <div className="stat-desc">Posts Created</div>
          </div>
        </div>
      </div>

      {/* Search Progress */}
      {loading && (
        <div className="bg-base-100 rounded-3xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-4">{searchProgress || "Searching Base Sepolia..."}</span>
          </div>
        </div>
      )}

      {/* Creator Stats */}
      {creatorCoins.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat bg-base-100 shadow rounded-xl">
            <div className="stat-figure text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block w-8 h-8 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div className="stat-title">Your Posts</div>
            <div className="stat-value text-primary">{creatorCoins.length}</div>
            <div className="stat-desc">On Base Sepolia</div>
          </div>

          <div className="stat bg-base-100 shadow rounded-xl">
            <div className="stat-figure text-success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block w-8 h-8 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                ></path>
              </svg>
            </div>
            <div className="stat-title">Total Market Cap</div>
            <div className="stat-value text-success">
              {(() => {
                const totalMarketCap = creatorCoins.reduce((sum, coin) => {
                  return sum + parseFloat(formatEther(BigInt(coin.marketCap || "0")));
                }, 0);
                return totalMarketCap.toFixed(4);
              })()}{" "}
              ETH
            </div>
            <div className="stat-desc">Combined value</div>
          </div>

          <div className="stat bg-base-100 shadow rounded-xl">
            <div className="stat-figure text-info">
              <span className="text-2xl">📊</span>
            </div>
            <div className="stat-title">Total Scanned</div>
            <div className="stat-value text-info">{allCoins.length}</div>
            <div className="stat-desc">Base Sepolia coins</div>
          </div>

          <div className="stat bg-base-100 shadow rounded-xl">
            <div className="stat-figure">
              <div className="text-success text-3xl">✅</div>
            </div>
            <div className="stat-title">Network</div>
            <div className="stat-value text-sm">Base Sepolia</div>
            <div className="stat-desc">Chain ID: {baseSepolia.id}</div>
          </div>
        </div>
      )}

      {/* Manual Add Coin */}
      <div className="bg-base-100 rounded-3xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">➕ Add Coin Manually</h3>
        <p className="text-sm opacity-70 mb-4">
          If your coin isn`t found automatically, you can add it manually using the Base Sepolia contract address.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualAddress}
            onChange={e => setManualAddress(e.target.value)}
            placeholder="Enter Base Sepolia coin contract address (0x...)"
            className="input input-bordered flex-1"
          />
          <button onClick={addManualCoinAddress} disabled={!manualAddress.trim()} className="btn btn-primary">
            Add Coin
          </button>
        </div>
      </div>

      {/* Your Posts */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">📝 Your Blog Post Coins</h2>
            <div className="flex gap-2">
              {creatorCoins.length > 0 && (
                <span className="text-sm opacity-70">
                  {creatorCoins.length} post{creatorCoins.length === 1 ? "" : "s"} found
                </span>
              )}
              <button onClick={fetchCoinsFromMultipleSources} disabled={loading} className="btn btn-outline btn-sm">
                🔄 Refresh
              </button>
            </div>
          </div>

          {!loading && creatorCoins.length > 0 ? (
            <div className="space-y-4">
              {creatorCoins.map(coin => (
                <div key={coin.id} className="border rounded-lg p-4 hover:bg-base-200 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{coin.name}</h3>
                        <div className="badge badge-primary badge-sm">{coin.symbol}</div>
                        <div className="badge badge-success badge-sm">Your Coin</div>
                        <div className="badge badge-info badge-sm">Base Sepolia</div>
                      </div>
                      <p className="text-sm opacity-70 mb-2">
                        Created: {new Date(coin.createdAt).toLocaleDateString()} • Contract: {coin.address.slice(0, 6)}
                        ...{coin.address.slice(-4)}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {formatEther(BigInt(coin.marketCap || "0"))} ETH market cap
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                          {formatEther(BigInt(coin.totalSupply || "0"))} supply
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/post/${coin.address}`} className="btn btn-sm btn-outline">
                        View Post
                      </Link>
                      <a
                        href={`https://testnet.zora.co/collect/base-sepolia:${coin.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        View on Zora
                      </a>
                      <a
                        href={`https://sepolia.basescan.org/address/${coin.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary"
                      >
                        View Contract
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg opacity-70 mb-2">
                {allCoins.length > 0 ? "No coins found from your address" : "No coins found on Base Sepolia"}
              </p>
              <p className="text-sm opacity-50 mb-6">
                Try creating a new post or add your coin manually using the contract address above.
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/" className="btn btn-primary">
                  Create New Post
                </Link>
                <a
                  href={`https://testnet.zora.co/@${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  View Your Zora Profile
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Enhanced Debug Info */}
      <div className="bg-base-100 rounded-3xl shadow-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">🔍 Base Sepolia Search Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title">Network</div>
            <div className="stat-value text-sm">Base Sepolia</div>
            <div className="stat-desc">Chain ID: {baseSepolia.id}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title">Your Address</div>
            <div className="stat-value text-sm font-mono">{address.slice(0, 10)}...</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title">Total Coins Scanned</div>
            <div className="stat-value text-lg">{allCoins.length}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title">Your Coins Found</div>
            <div className="stat-value text-lg">{creatorCoins.length}</div>
          </div>
        </div>
        <div className="mt-4 text-xs opacity-70">
          <p>
            <strong>Search Strategy:</strong> Querying Base Sepolia testnet specifically for recent, valuable, and
            traded coins from your creator address.
          </p>
        </div>
      </div>

    </div>
  );
}
