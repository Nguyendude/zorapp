"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DeployCurrency,
  createCoin,
  createMetadataBuilder,
  createZoraUploaderForCreator,
  setApiKey,
} from "@zoralabs/coins-sdk";
import { Address, createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount, useWalletClient } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

// Set API key immediately (following Zora docs pattern)
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ZORA_API_KEY) {
  setApiKey(process.env.NEXT_PUBLIC_ZORA_API_KEY);
}

interface BlogPost {
  title: string;
  content: string;
  symbol: string;
}

interface CoinCreationResult {
  hash: string;
  address: string;
  deployment: any;
}

export default function PostMintHome() {
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [blogPost, setBlogPost] = useState<BlogPost>({
    title: "",
    content: "",
    symbol: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdCoin, setCreatedCoin] = useState<CoinCreationResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBlogPost(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  // ...rest of the old homepage code...
}
