"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { baseSepolia } from "viem/chains";

// Zora's Protocol Rewards contract on Base Sepolia
const ZORA_REWARDS_ADDRESS = "0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B";

// ABI for the rewards tracking
const REWARDS_ABI = [
  "event RewardPaid(address indexed receiver, uint256 amount, address token)",
  "function claimableRewards(address user) external view returns (uint256)",
  "function getAccumulatedRewards(address user) external view returns (uint256)"
] as const;

export const RewardsTracker = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [claimableRewards, setClaimableRewards] = useState<string>("0");
  const [totalRewards, setTotalRewards] = useState<string>("0");
  const [recentRewards, setRecentRewards] = useState<{amount: string, timestamp: number}[]>([]);

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchRewards = async () => {
      try {
        // Get claimable rewards
        const claimable = await publicClient.readContract({
          address: ZORA_REWARDS_ADDRESS,
          abi: REWARDS_ABI,
          functionName: "claimableRewards",
          args: [address]
        });

        // Get total accumulated rewards
        const accumulated = await publicClient.readContract({
          address: ZORA_REWARDS_ADDRESS,
          abi: REWARDS_ABI,
          functionName: "getAccumulatedRewards",
          args: [address]
        });

        setClaimableRewards(formatEther(claimable));
        setTotalRewards(formatEther(accumulated));

        // Get recent reward events
        const rewardEvents = await publicClient.getContractEvents({
          address: ZORA_REWARDS_ADDRESS,
          abi: REWARDS_ABI,
          eventName: "RewardPaid",
          args: {
            receiver: address
          },
          fromBlock: 'earliest'
        });

        const formattedRewards = rewardEvents.map(event => ({
          amount: formatEther(event.args.amount || 0n),
          timestamp: Number(event.blockTimestamp)
        }));

        setRecentRewards(formattedRewards);

      } catch (error) {
        console.error("Error fetching rewards:", error);
      }
    };

    fetchRewards();

    // Set up event listener for new rewards
    const unwatch = publicClient.watchContractEvent({
      address: ZORA_REWARDS_ADDRESS,
      abi: REWARDS_ABI,
      eventName: "RewardPaid",
      args: { receiver: address },
      onLogs: logs => {
        // Update rewards when new ones come in
        fetchRewards();
      }
    });

    return () => {
      unwatch();
    };
  }, [address, publicClient]);

  if (!address) {
    return null;
  }

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Developer Rewards 💰</h2>
        
        <div className="stats stats-vertical lg:stats-horizontal shadow">
          <div className="stat">
            <div className="stat-title">Claimable Rewards</div>
            <div className="stat-value text-primary">{Number(claimableRewards).toFixed(4)} ETH</div>
            <div className="stat-desc">Available to claim</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Total Rewards</div>
            <div className="stat-value text-secondary">{Number(totalRewards).toFixed(4)} ETH</div>
            <div className="stat-desc">All-time earnings</div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Recent Rewards</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRewards.map((reward, index) => (
                  <tr key={index}>
                    <td>{Number(reward.amount).toFixed(4)} ETH</td>
                    <td>{new Date(reward.timestamp * 1000).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};