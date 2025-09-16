"use client";

import { useEffect, useState, useMemo } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { getRewardsHistory, watchNewRewards, RewardEvent } from "~~/utils/rewards";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const RewardsAnalytics = () => {
  const { address } = useAccount();
  const [rewardsHistory, setRewardsHistory] = useState<RewardEvent[]>([]);
  const [volumeHistory, setVolumeHistory] = useState<{date: Date, volume: number}[]>([]);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!rewardsHistory.length) return {
      totalRewards: "0",
      averagePerTrade: "0",
      dailyAverage: "0",
      projectedMonthly: "0",
      tradeCount: 0,
      createReferralTotal: "0",
      tradeReferralTotal: "0"
    };

    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    // Filter by timeframe
    const filteredHistory = rewardsHistory.filter(event => {
      const eventDate = event.timestamp * 1000;
      switch(timeframe) {
        case '24h': return now - eventDate <= msPerDay;
        case '7d': return now - eventDate <= 7 * msPerDay;
        case '30d': return now - eventDate <= 30 * msPerDay;
        default: return true;
      }
    });

    let createTotal = 0n;
    let tradeTotal = 0n;
    const tradeCount = filteredHistory.length;
    
    filteredHistory.forEach(event => {
      if (event.transactionHash.includes("create")) {
        createTotal += event.amount;
      } else {
        tradeTotal += event.amount;
      }
    });

    const totalRewards = createTotal + tradeTotal;
    const averagePerTrade = tradeCount ? totalRewards / BigInt(tradeCount) : 0n;
    
    // Calculate daily average
    const oldestEvent = filteredHistory[filteredHistory.length - 1];
    const daysSinceFirst = oldestEvent 
      ? (now - oldestEvent.timestamp * 1000) / msPerDay
      : 1;
    const dailyAverage = totalRewards / BigInt(Math.max(Math.round(daysSinceFirst), 1));
    
    // Project monthly based on daily average
    const projectedMonthly = dailyAverage * 30n;

    return {
      totalRewards: formatEther(totalRewards),
      averagePerTrade: formatEther(averagePerTrade),
      dailyAverage: formatEther(dailyAverage),
      projectedMonthly: formatEther(projectedMonthly),
      tradeCount,
      createReferralTotal: formatEther(createTotal),
      tradeReferralTotal: formatEther(tradeTotal)
    };
  }, [rewardsHistory, timeframe]);

  // Chart data
  const chartData = useMemo(() => {
    if (!rewardsHistory.length) return {
      labels: [],
      datasets: []
    };

    const data = rewardsHistory
      .sort((a, b) => a.timestamp - b.timestamp)
      .reduce((acc, event) => {
        const date = new Date(event.timestamp * 1000).toLocaleDateString();
        const amount = parseFloat(formatEther(event.amount));
        
        const existing = acc.find(d => d.date === date);
        if (existing) {
          existing.amount += amount;
        } else {
          acc.push({ date, amount });
        }
        return acc;
      }, [] as { date: string; amount: number }[]);

    return {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: 'Daily Rewards (ZORA)',
          data: data.map(d => d.amount),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };
  }, [rewardsHistory]);

  // Volume-based projections
  const projections = useMemo(() => {
    const volumes = [10000, 50000, 100000, 500000, 1000000]; // Daily volume scenarios
    return volumes.map(volume => ({
      volume,
      daily: volume * 0.006, // 0.3% create + 0.3% trade
      monthly: volume * 0.006 * 30
    }));
  }, []);

  useEffect(() => {
    if (!address) return;

    const fetchHistory = async () => {
      const history = await getRewardsHistory(address);
      setRewardsHistory(history);

      // Calculate volume history
      const volumes = history.reduce((acc, event) => {
        const date = new Date(event.timestamp * 1000).toLocaleDateString();
        const volume = parseFloat(formatEther(event.amount)) / 0.006; // Reverse calculate volume from reward
        
        const existing = acc.find(d => d.date.toLocaleDateString() === date);
        if (existing) {
          existing.volume += volume;
        } else {
          acc.push({ date: new Date(event.timestamp * 1000), volume });
        }
        return acc;
      }, [] as { date: Date; volume: number }[]);

      setVolumeHistory(volumes);
    };

    fetchHistory();

    const unwatchRewards = watchNewRewards(address, (event) => {
      setRewardsHistory(prev => [...prev, event]);
    });

    return () => unwatchRewards();
  }, [address]);

  if (!address) return null;

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">Rewards Analytics 📊</h2>
          <div className="join">
            {(['24h', '7d', '30d', 'all'] as const).map((t) => (
              <button
                key={t}
                className={`join-item btn btn-sm ${timeframe === t ? 'btn-primary' : ''}`}
                onClick={() => setTimeframe(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-base-100 rounded-box">
            <div className="stat-title">Total Rewards</div>
            <div className="stat-value text-primary">{Number(analytics.totalRewards).toFixed(4)}</div>
            <div className="stat-desc">ZORA</div>
          </div>
          <div className="stat bg-base-100 rounded-box">
            <div className="stat-title">Daily Average</div>
            <div className="stat-value text-secondary">{Number(analytics.dailyAverage).toFixed(4)}</div>
            <div className="stat-desc">ZORA per day</div>
          </div>
          <div className="stat bg-base-100 rounded-box">
            <div className="stat-title">Average Per Trade</div>
            <div className="stat-value">{Number(analytics.averagePerTrade).toFixed(4)}</div>
            <div className="stat-desc">ZORA per trade</div>
          </div>
          <div className="stat bg-base-100 rounded-box">
            <div className="stat-title">Projected Monthly</div>
            <div className="stat-value text-accent">{Number(analytics.projectedMonthly).toFixed(4)}</div>
            <div className="stat-desc">ZORA at current rate</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card bg-base-100">
            <div className="card-body">
              <h3 className="card-title text-lg">Rewards Trend</h3>
              <Line data={chartData} options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }} />
            </div>
          </div>
          
          <div className="card bg-base-100">
            <div className="card-body">
              <h3 className="card-title text-lg">Reward Distribution</h3>
              <div className="stats stats-vertical shadow">
                <div className="stat">
                  <div className="stat-title">Create Referrals</div>
                  <div className="stat-value text-primary">{Number(analytics.createReferralTotal).toFixed(4)}</div>
                  <div className="stat-desc">0.3% per creation</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Trade Referrals</div>
                  <div className="stat-value text-secondary">{Number(analytics.tradeReferralTotal).toFixed(4)}</div>
                  <div className="stat-desc">0.3% per trade</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Volume Projections */}
        <div className="card bg-base-100">
          <div className="card-body">
            <h3 className="card-title text-lg mb-4">Projected Earnings by Volume</h3>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Daily Volume</th>
                    <th>Daily Rewards</th>
                    <th>Monthly Rewards</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map(({ volume, daily, monthly }) => (
                    <tr key={volume}>
                      <td>${volume.toLocaleString()}</td>
                      <td>{daily.toFixed(2)} ZORA</td>
                      <td>{monthly.toFixed(2)} ZORA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Historical Stats */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Trading Activity</h3>
          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Total Trades</div>
              <div className="stat-value">{analytics.tradeCount}</div>
              <div className="stat-desc">In selected period</div>
            </div>
            <div className="stat">
              <div className="stat-title">Highest Daily Volume</div>
              <div className="stat-value">
                ${Math.max(...volumeHistory.map(v => v.volume)).toLocaleString()}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Active Days</div>
              <div className="stat-value">
                {new Set(volumeHistory.map(v => v.date.toLocaleDateString())).size}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};