"use client";

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { createPublicClient } from "viem";
import { notification } from "~~/utils/scaffold-eth";
import { ChannelForm } from "~~/components/create/ChannelForm";
import { ContentForm } from "~~/components/create/ContentForm";

interface BlogPost {
  title: string;
  content: string;
  symbol: string;
}

interface CoinCreationResult {
  address: string;
  name: string;
  symbol: string;
  transaction: string;
}

export default function CreatePage() {
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [activeTab, setActiveTab] = useState<"channel" | "content">("channel");
  const [blogPost, setBlogPost] = useState<BlogPost>({
    title: "",
    content: "",
    symbol: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdCoin, setCreatedCoin] = useState<CoinCreationResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleTabChange = (tab: "channel" | "content") => {
    setActiveTab(tab);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBlogPost(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        notification.error("Please select a valid image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        notification.error("Image file size must be less than 10MB");
        return;
      }
      setImageFile(file);
      notification.success(`Image selected: ${file.name}`);
    }
  };

  const createBlogPostCoin = async () => {
    if (!connectedAddress || !walletClient) {
      notification.error("Please connect your wallet");
      return;
    }
    if (!blogPost.title.trim()) {
      notification.error("Post title is required");
      return;
    }
    if (!blogPost.content.trim()) {
      notification.error("Post content is required");
      return;
    }
    if (!imageFile) {
      notification.error("Featured image is required");
      return;
    }
    setIsCreating(true);
    try {
      // TODO: Implement coin creation logic
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating blog post coin:', error);
      notification.error("Failed to create blog post coin");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col py-8 px-4 lg:px-8 min-h-full">
      <div className="max-w-2xl mx-auto w-full">
        <h1 className="text-4xl font-bold mb-8">Create New</h1>
        
        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6">
          <button
            className={`tab ${activeTab === "channel" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("channel")}
          >
            Channel
          </button>
          <button
            className={`tab ${activeTab === "content" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("content")}
          >
            Content
          </button>
        </div>

        {/* Form */}
        {activeTab === "channel" ? (
          <ChannelForm />
        ) : (
          <ContentForm 
            blogPost={blogPost} 
            isCreating={isCreating} 
            onInputChange={handleInputChange}
            onImageChange={handleImageChange}
            onSubmit={createBlogPostCoin}
            createdCoin={createdCoin}
          />
        )}
      </div>
    </div>
  );
}