"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, useWalletClient, useContractWrite, useTransaction } from "wagmi";
import { channelFactoryABI, channelFactoryAddress } from "~~/contracts/contracts-config";
import { notification } from "~~/utils/scaffold-eth";

interface ChannelFormData {
  name: string;
  symbol: string;
  description: string;
  initialSupply: string;
}

export function ChannelForm() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ChannelFormData>({
    name: "",
    symbol: "",
    description: "",
    initialSupply: "1000000",
  });

  const { 
    write: createChannel,
    data: txData,
    isLoading: isWritePending,
    isSuccess: isWriteSuccess,
    error: writeError
  } = useContractWrite({
    address: channelFactoryAddress,
    abi: channelFactoryABI,
    functionName: "createChannel",
  });

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useTransaction({
    hash: txData?.hash,
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
      notification.info("Creating channel...");

      createChannel({
        args: [
          formData.name,
          formData.symbol,
          formData.description,
          parseEther(formData.initialSupply || "0")
        ],
      });

    } catch (error) {
      console.error(error);
      notification.error("Error creating channel");
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message when transaction is confirmed
  if (isConfirmed) {
    notification.success("Channel created successfully!");
    setFormData({
      name: "",
      symbol: "",
      description: "",
      initialSupply: "1000000",
    });
  }

  // Show error message if transaction fails
  if (writeError) {
    notification.error(writeError.message || "Error creating channel");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Channel Name</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="input input-bordered w-full"
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Symbol</span>
        </label>
        <input
          type="text"
          name="symbol"
          value={formData.symbol}
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
          <span className="label-text">Initial Supply</span>
        </label>
        <input
          type="number"
          name="initialSupply"
          value={formData.initialSupply}
          onChange={handleInputChange}
          className="input input-bordered w-full"
          min="0"
          required
        />
      </div>

      <button
        type="submit"
        className={`btn btn-primary ${(isWritePending || isConfirming) ? 'loading' : ''}`}
        disabled={!isConnected || isWritePending || isConfirming}
      >
        {isWritePending || isConfirming ? 'Creating Channel...' : 'Create Channel'}
      </button>
    </form>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Name</span>
        </label>
        <input
          type="text"
          name="name"
          placeholder="Enter channel name"
          className="input input-bordered"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Symbol</span>
        </label>
        <input
          type="text"
          name="symbol"
          placeholder="Enter channel symbol"
          className="input input-bordered"
          value={formData.symbol}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Description</span>
        </label>
        <textarea
          name="description"
          placeholder="Enter channel description"
          className="textarea textarea-bordered h-24"
          value={formData.description}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Initial Supply</span>
        </label>
        <input
          type="number"
          name="initialSupply"
          placeholder="Enter initial supply"
          className="input input-bordered"
          value={formData.initialSupply}
          onChange={handleInputChange}
          required
        />
      </div>

      <button
        type="submit"
        className={`btn btn-primary mt-4 ${isLoading ? "loading" : ""}`}
        disabled={isLoading}
      >
        {isLoading ? "Creating channel..." : "Create channel"}
      </button>
    </form>
  );
}