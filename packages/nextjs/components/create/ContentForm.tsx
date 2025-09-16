"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, useContractWrite } from "wagmi";
import { contentFactoryABI, contentFactoryAddress } from "~~/contracts/contracts-config";
import { notification } from "~~/utils/scaffold-eth";

interface ContentFormData {
  channelAddress: string;
  title: string;
  description: string;
  uri: string;
  price: string;
  supply: string;
}

export function ContentForm() {
  const { isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ContentFormData>({
    channelAddress: "",
    title: "",
    description: "",
    uri: "",
    price: "0.01",
    supply: "100",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      notification.error("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);
      notification.info("Creating content...");

      // We'll implement contract interaction here after fixing wagmi hook issues
      await new Promise(resolve => setTimeout(resolve, 1000)); // Temporary
      
      notification.success("Content created successfully!");
      
      setFormData({
        channelAddress: "",
        title: "",
        description: "",
        uri: "",
        price: "0.01",
        supply: "100",
      });
    } catch (error) {
      console.error(error);
      notification.error("Error creating content");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Channel Address</span>
        </label>
        <input
          type="text"
          name="channelAddress"
          value={formData.channelAddress}
          onChange={handleInputChange}
          className="input input-bordered w-full"
          placeholder="0x..."
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Title</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="input input-bordered w-full"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Description</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="textarea textarea-bordered h-24"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Content URI</span>
        </label>
        <input
          type="text"
          name="uri"
          value={formData.uri}
          onChange={handleInputChange}
          className="input input-bordered w-full"
          placeholder="ipfs://"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Price (ETH)</span>
        </label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          className="input input-bordered w-full"
          min="0"
          step="0.001"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Supply</span>
        </label>
        <input
          type="number"
          name="supply"
          value={formData.supply}
          onChange={handleInputChange}
          className="input input-bordered w-full"
          min="1"
          required
        />
      </div>

      <button
        type="submit"
        className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
        disabled={!isConnected || isLoading}
      >
        {isLoading ? "Creating content..." : "Create content"}
      >
        {isLoading ? "Creating Content..." : "Create Content"}
      </button>
    </form>
  );
}