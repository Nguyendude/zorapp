"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { getRewardsHistory, watchNewRewards, RewardEvent } from "~~/utils/rewards";

export const DetailedRewardsTracker = () => {
  const { address } = useAccount();
  const [createReferralTotal, setCreateReferralTotal] = useState<string>("0");
  const [tradeReferralTotal, setTradeReferralTotal] = useState<string>("0");
  const [recentTrades, setRecentTrades] = useState<RewardEvent[]>([]);

  useEffect(() => {
    if (!address) return;

    // Fetch historical rewards
    const fetchHistory = async () => {
      const history = await getRewardsHistory(address);
      
      // Calculate totals
      let createTotal = 0n;
      let tradeTotal = 0n;
      
      history.forEach(event => {
        // Identify reward type by transaction data
        if (event.transactionHash.includes("create")) {
          createTotal += event.amount;
        } else {
          tradeTotal += event.amount;
        }
      });

      setCreateReferralTotal(formatEther(createTotal));
      setTradeReferralTotal(formatEther(tradeTotal));
      setRecentTrades(history.slice(0, 10)); // Show last 10 trades
    };

    fetchHistory();

    // Watch for new rewards
    const unwatchRewards = watchNewRewards(address, (event) => {
      // Update totals when new rewards come in
      if (event.transactionHash.includes("create")) {
        setCreateReferralTotal(prev => 
          formatEther(parseEther(prev) + event.amount)
        );
      } else {
        setTradeReferralTotal(prev => 
          formatEther(parseEther(prev) + event.amount)
        );
      }

      // Add to recent trades
      setRecentTrades(prev => [event, ...prev.slice(0, 9)]);
    });

    return () => unwatchRewards();
  }, [address]);

  if (!address) return null;

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Platform Rewards 💰</h2>
        
        <div className="stats stats-vertical lg:stats-horizontal shadow">
          <div className="stat">
            <div className="stat-title">Create Referral Total</div>
            <div className="stat-value text-primary">
              {Number(createReferralTotal).toFixed(4)} ZORA
            </div>
            <div className="stat-desc">0.3% per coin creation</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Trade Referral Total</div>
            <div className="stat-value text-secondary">
              {Number(tradeReferralTotal).toFixed(4)} ZORA
            </div>
            <div className="stat-desc">0.3% per trade</div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Recent Rewards</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((reward, index) => (
                  <tr key={index}>
                    <td>
                      {reward.transactionHash.includes("create") 
                        ? "Create Referral" 
                        : "Trade Referral"}
                    </td>
                    <td>{formatEther(reward.amount)} ZORA</td>
                    <td>{new Date(reward.timestamp * 1000).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 bg-base-300 rounded-lg p-4">
          <h4 className="font-semibold mb-2">How Rewards Work</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Create Referral: 0.3% of all trades for coins created through our platform</li>
            <li>Trade Referral: 0.3% of each trade executed through our platform</li>
            <li>Rewards are paid instantly in ZORA tokens</li>
            <li>No claiming needed - automatically sent to your wallet</li>
          </ul>
        </div>
      </div>
    </div>
  );