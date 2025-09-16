"use client";

import { Address } from "viem";
import { useContractWrite, useContractRead, useWaitForTransaction } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

const FACTORY_ADDRESS = "YOUR_FACTORY_ADDRESS"; // Add after deployment

export interface CreateContentArgs {
  name: string;
  symbol: string;
  initialSupply: bigint;
  contentType: string;
  contentURI: string;
  description: string;
  license: string;
  duration: number;
  contentHash: string;
}

export interface ContentMetadata {
  name: string;
  symbol: string;
  contentType: string;
  contentURI: string;
  description: string;
  license: string;
  duration: number;
  creationDate: number;
  contentHash: string;
  views: number;
  likes: number;
}

export const useCreateContent = () => {
  const { data: createData, write, isLoading } = useContractWrite({
    address: FACTORY_ADDRESS as Address,
    abi: [
      {
        name: "createContent",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "initialSupply", type: "uint256" },
          { name: "contentType", type: "string" },
          { name: "contentURI", type: "string" },
          { name: "description", type: "string" },
          { name: "license", type: "string" },
          { name: "duration", type: "uint256" },
          { name: "contentHash", type: "string" },
        ],
        outputs: [{ name: "contentAddress", type: "address" }],
      },
    ],
    functionName: "createContent",
  });

  const { isLoading: isWaiting, isSuccess } = useWaitForTransaction({
    hash: createData?.hash,
  });

  const createContent = async (args: CreateContentArgs) => {
    try {
      write({
        args: [
          args.name,
          args.symbol,
          args.initialSupply,
          args.contentType,
          args.contentURI,
          args.description,
          args.license,
          args.duration,
          args.contentHash,
        ],
      });
    } catch (error) {
      notification.error(
        "Error creating content",
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  };

  return {
    createContent,
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

export const useValidContentTypes = () => {
  const { data: types, isLoading } = useContractRead({
    address: FACTORY_ADDRESS as Address,
    abi: [
      {
        name: "isValidContentType",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "contentType", type: "string" }],
        outputs: [{ name: "", type: "bool" }],
      },
    ],
    functionName: "isValidContentType",
  });

  return {
    validTypes: types as string[] | undefined,
    isLoading,
  };
};

export const useContentMetadata = (contentAddress: Address) => {
  const { data: metadata, isLoading } = useContractRead({
    address: contentAddress,
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
        name: "contentType",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "contentURI",
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
        name: "license",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "duration",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
      },
      {
        name: "creationDate",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
      },
      {
        name: "contentHash",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "views",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
      },
      {
        name: "likes",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "name",
  }) as any;

  return {
    metadata: metadata as ContentMetadata | undefined,
    isLoading,
  };
};