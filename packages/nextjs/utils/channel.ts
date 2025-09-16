"use client";

import { Address } from "viem";
import { useContractWrite, useContractRead, useWaitForTransaction } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

const FACTORY_ADDRESS = "YOUR_FACTORY_ADDRESS"; // Add after deployment

export interface CreateChannelArgs {
  name: string;
  symbol: string;
  initialSupply: bigint;
  description: string;
  category: string;
}

export interface ChannelMetadata {
  name: string;
  symbol: string;
  description: string;
  category: string;
  profileImage?: string;
  bannerImage?: string;
  socialLinks: string[];
  subscribers: number;
  totalViews: number;
}

export const useCreateChannel = () => {
  const { data: createData, write, isLoading } = useContractWrite({
    address: FACTORY_ADDRESS as Address,
    abi: [
      {
        name: "createChannel",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "initialSupply", type: "uint256" },
          { name: "description", type: "string" },
          { name: "category", type: "string" },
        ],
        outputs: [{ name: "channelAddress", type: "address" }],
      },
    ],
    functionName: "createChannel",
  });

  const { isLoading: isWaiting, isSuccess } = useWaitForTransaction({
    hash: createData?.hash,
  });

  const createChannel = async (args: CreateChannelArgs) => {
    try {
      write({
        args: [args.name, args.symbol, args.initialSupply, args.description, args.category],
      });
    } catch (error) {
      notification.error(
        "Error creating channel",
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  };

  return {
    createChannel,
    isLoading: isLoading || isWaiting,
    isSuccess,
    hash: createData?.hash,
  };
};

export const useCheckSymbolAvailability = (symbol: string) => {
  const { data: isAvailable, isLoading } = useContractRead({
    address: FACTORY_ADDRESS as Address,
    abi: [
      {
        name: "isSymbolAvailable",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "symbol", type: "string" }],
        outputs: [{ name: "", type: "bool" }],
      },
    ],
    functionName: "isSymbolAvailable",
    args: [symbol],
    enabled: symbol.length >= 3,
  });

  return {
    isAvailable,
    isLoading,
  };
};

export const useChannelMetadata = (channelAddress: Address) => {
  const { data: metadata, isLoading } = useContractRead({
    address: channelAddress,
    abi: [
      {
        name: "name",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "symbol",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "description",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "category",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "profileImage",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "bannerImage",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "getSocialLinks",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string[]" }],
      },
      {
        name: "subscribers",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
      },
      {
        name: "totalViews",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "name",
  }) as any;

  return {
    metadata: metadata as ChannelMetadata | undefined,
    isLoading,
  };
};