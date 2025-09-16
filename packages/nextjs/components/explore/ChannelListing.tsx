"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { useContractRead, useWatchContractEvent } from "wagmi";
import { channelFactoryABI, channelFactoryAddress } from "~~/contracts/contracts-config";
import { notification } from "~~/utils/scaffold-eth";

interface Channel {
  address: string;
  name: string;
  symbol: string;
  description: string;
  totalSupply: bigint;
}

export function ChannelListing() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: allChannels } = useContractRead({
    address: channelFactoryAddress as `0x${string}`,
    abi: channelFactoryABI,
    functionName: "allChannels",
  });

  // Watch for new channel creation events
  useWatchContractEvent({
    address: channelFactoryAddress as `0x${string}`,
    abi: channelFactoryABI,
    eventName: "ChannelCreated",
    onLogs(logs) {
      if (logs && logs.length > 0) {
        const log = logs[0];
        if (log && 'args' in log) {
          const { channel, name, symbol } = log.args;
          setChannels(prev => [...prev, {
            address: channel as string,
            name: name as string,
            symbol: symbol as string,
            description: "",
            totalSupply: 0n
          }]);
        }
      }
    },
  });

  useEffect(() => {
    const loadChannels = async () => {
      if (!allChannels) return;
      
      try {
        setIsLoading(true);
        setChannels(
          (allChannels as Array<{
            addr: string;
            name: string;
            symbol: string;
            description: string;
            totalSupply: string;
          }>).map(channel => ({
            address: channel.addr,
            name: channel.name,
            symbol: channel.symbol,
            description: channel.description || "",
            totalSupply: BigInt(channel.totalSupply || "0")
          }))
        );
      } catch (error) {
        console.error('Error loading channels:', error);
        notification.error("Failed to load channels");
      } finally {
        setIsLoading(false);
      }
    };

    loadChannels();
  }, [allChannels]);

  return (
    <div className="w-full space-y-4 p-4">
      {channels.map((channel) => (
        <div key={channel.address} className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              {channel.name} <span className="text-sm opacity-60">({channel.symbol})</span>
            </h2>
            <p>{channel.description}</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm opacity-70">
                Total Supply: {formatEther(channel.totalSupply)} tokens
              </span>
              <div className="card-actions">
                <Link
                  href={`/channels/${channel.address}`}
                  className="btn btn-primary btn-sm"
                >
                  View Details
                </Link>
                <Link
                  href={`/channels/${channel.address}/trade`}
                  className="btn btn-ghost btn-sm"
                >
                  Trade Tokens
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {!isLoading && channels.length === 0 && (
        <div className="text-center py-8 opacity-70">
          <p className="text-xl mb-4">No channels have been created yet</p>
          <Link href="/create" className="btn btn-primary">
            Create Channel
          </Link>
        </div>
      )}

      {isLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card bg-base-200 shadow-xl h-32"/>
          ))}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    const loadChannels = async () => {
      setIsLoading(true);
      try {
        // TODO: Implement channel loading from contracts
        // This will be implemented once we have the contract interaction ready
      } catch (error) {
        console.error("Error loading channels:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChannels();
  }, []);

  if (isLoading) {
    return <div className="w-full h-48 flex items-center justify-center">Loading channels...</div>;
  }

  if (channels.length === 0) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center">
        <p className="text-lg mb-4">No channels found</p>
        <Link href="/create" className="btn btn-primary">
          Create a Channel
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {channels.map((channel) => (
        <div key={channel.id} className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">{channel.name}</h2>
            <p className="text-sm opacity-60">{channel.symbol}</p>
            <p className="mt-2">{channel.description || "No description available"}</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="opacity-60">Total Supply</span>
                <span>{formatEther(BigInt(channel.totalSupply))} tokens</span>
              </div>
            </div>
            <div className="card-actions justify-end mt-4">
              <Link
                href={`/channels/${channel.address}`}
                className="btn btn-primary btn-sm"
              >
                View Channel
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}