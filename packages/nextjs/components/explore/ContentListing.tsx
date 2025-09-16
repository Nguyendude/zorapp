"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { useContractRead, useWatchContractEvent } from "wagmi";
import { contentFactoryABI, contentFactoryAddress } from "~~/contracts/contracts-config";
import { notification } from "~~/utils/scaffold-eth";

interface Content {
  address: string;
  channelAddress: string;
  title: string;
  description: string;
  uri: string;
  price: bigint;
  supply: bigint;
}

export function ContentListing() {
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: allContent } = useContractRead({
    address: contentFactoryAddress as `0x${string}`,
    abi: contentFactoryABI,
    functionName: "allContent",
  });

  // Watch for new content creation events
  useWatchContractEvent({
    address: contentFactoryAddress as `0x${string}`,
    abi: contentFactoryABI,
    eventName: "ContentCreated",
    onLogs(logs) {
      if (logs && logs.length > 0) {
        const log = logs[0];
        if (log && 'args' in log) {
          const { content, channel, title, description, uri, price, supply } = log.args;
          setContents(prev => [...prev, {
            address: content as string,
            channelAddress: channel as string,
            title: title as string,
            description: description as string,
            uri: uri as string,
            price: BigInt(price?.toString() || "0"),
            supply: BigInt(supply?.toString() || "0")
          }]);
        }
      }
    },
  });

  useEffect(() => {
    const loadContent = async () => {
      if (!allContent) return;
      
      try {
        setIsLoading(true);
        setContents(
          (allContent as Array<{
            addr: string;
            channel: string;
            title: string;
            description: string;
            uri: string;
            price: string;
            supply: string;
          }>).map(content => ({
            address: content.addr,
            channelAddress: content.channel,
            title: content.title,
            description: content.description,
            uri: content.uri,
            price: BigInt(content.price || "0"),
            supply: BigInt(content.supply || "0")
          }))
        );
      } catch (error) {
        console.error('Error loading content:', error);
        notification.error("Failed to load content");
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [allContent]);

  return (
    <div className="w-full space-y-4 p-4">
      {contents.map((content) => (
        <div key={content.address} className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title flex justify-between">
              {content.title}
              <Link
                href={`/channels/${content.channelAddress}`}
                className="text-sm opacity-60 hover:opacity-100"
              >
                View Channel
              </Link>
            </h2>
            <p>{content.description}</p>
            <div className="flex justify-between items-center mt-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm opacity-70">
                  Price: {formatEther(content.price)} ETH
                </span>
                <span className="text-sm opacity-70">
                  Available: {content.supply.toString()} copies
                </span>
              </div>
              <div className="card-actions">
                <Link
                  href={`/content/${content.address}`}
                  className="btn btn-primary btn-sm"
                >
                  View Details
                </Link>
                <Link
                  href={`/content/${content.address}/trade`}
                  className="btn btn-ghost btn-sm"
                >
                  Trade
                </Link>
              </div>
            </div>
            {content.uri && (
              <div className="mt-4 pt-4 border-t border-base-300">
                <a
                  href={content.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary text-sm opacity-70 hover:opacity-100"
                >
                  View Content →
                </a>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {!isLoading && contents.length === 0 && (
        <div className="text-center py-8 opacity-70">
          <p className="text-xl mb-4">No content has been created yet</p>
          <Link href="/create" className="btn btn-primary">
            Create Content
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
}