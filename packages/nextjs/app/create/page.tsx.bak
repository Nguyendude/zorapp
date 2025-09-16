"use client";

import { useState } from "react";
import { ChannelForm } from "~~/components/create/ChannelForm";
import { ContentForm } from "~~/components/create/ContentForm";

export default function Page() {
  const [activeTab, setActiveTab] = useState<"channel" | "content">("channel");

  const handleTabChange = (tab: "channel" | "content") => {
    setActiveTab(tab);
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
        {activeTab === "channel" ? <ChannelForm /> : <ContentForm />}
      </div>
    </div>
  );
  }

export default function CreatePage() {
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
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });
      notification.info("📝 Creating metadata...");
      // Enhanced metadata creation with proper indexing hints
      const metadataBuilder = createMetadataBuilder()
        .withName(blogPost.title.trim())
        .withSymbol(blogPost.symbol || "POST")
        .withDescription(blogPost.content.trim() || "NO CONTENT")
        .withImage(imageFile)
        // Add additional metadata for better indexing
        .withProperties({
          type: "blog_post",
          platform: "PostMint",
          chain: "base-sepolia",
          creator: connectedAddress
        });

      // Create metadata with proper creator attribution
      const { createMetadataParameters } = await metadataBuilder.upload(
        createZoraUploaderForCreator(connectedAddress as Address)
      );
      notification.info("✅ Metadata uploaded to IPFS!");
      const coinParams = {
        ...createMetadataParameters,
        payoutRecipient: connectedAddress as Address,
        chainId: baseSepolia.id,
        currency: DeployCurrency.ETH,
      };
      notification.info("🪙 Creating coin...");
      const result = await createCoin(coinParams, walletClient, publicClient, {
        gasMultiplier: 120,
      });
      const coinAddress = result.address ?? "";
      setCreatedCoin({
        hash: result.hash,
        address: coinAddress,
        deployment: result.deployment,
      });

      // Update both Zora indexer and local store
      try {
        // Notify Zora indexer
        const indexerNotification = await fetch("https://api.zora.co/v1/indexer/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": process.env.NEXT_PUBLIC_ZORA_API_KEY || ""
          },
          body: JSON.stringify({
            chainId: baseSepolia.id,
            contractAddress: coinAddress,
            eventType: "NEW_COIN",
            metadata: createMetadataParameters
          })
        });

        if (!indexerNotification.ok) {
          console.warn("Zora indexer notification failed, coin might take longer to appear");
        }

        // Add to local store immediately
        usePostStore.getState().addPost({
          id: Date.now(), // Temporary ID until we get the event
          title: blogPost.title,
          content: blogPost.content,
          symbol: blogPost.symbol || "POST",
          coinAddress: coinAddress,
          author: connectedAddress,
          createdAt: Date.now(),
          imageUrl: URL.createObjectURL(imageFile),
          marketCap: BigInt(0),
          totalSupply: BigInt("1000000000000000000000000000"),
          lastPrice: BigInt(0)
        });

      } catch (error) {
        console.warn("Failed to update indexes:", error);
      }

      // Send Telegram notification
      await sendNewPostNotification({
        title: blogPost.title,
        author: connectedAddress,
        coinAddress: coinAddress,
        content: blogPost.content,
        marketCap: BigInt(0),
        totalSupply: BigInt("1000000000000000000000000000"), // 1B tokens
        mediaUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
      });

      notification.success("🎉 New coin launched!");
      setBlogPost({ title: "", content: "", symbol: "" });
      setImageFile(null);
    } catch (error: any) {
      if (error.message?.includes("upload") || error.message?.includes("IPFS")) {
        notification.error("IPFS upload failed. Please try with a smaller image.");
      } else if (error.message?.includes("timeout")) {
        notification.error("Transaction timeout. Check your wallet for pending transactions.");
      } else if (error.message?.includes("rejected") || error.message?.includes("denied")) {
        notification.error("Transaction was rejected by user.");
      } else if (error.message?.includes("insufficient")) {
        notification.error("Insufficient funds. Get Base Sepolia ETH from the faucet.");
      } else {
        notification.error(`Creation failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-8">📝 PostMint - Publish to Earn</h1>
        <div className="bg-base-100 rounded-3xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Create your Content Coin</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Post Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={blogPost.title}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="Enter your blog post title"
                maxLength={100}
              />
              <div className="text-xs opacity-60 mt-1">{blogPost.title.length}/100 characters</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">symbol</label>
              <input
                type="text"
                name="symbol"
                value={blogPost.symbol}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="Symbol for your post"
                maxLength={10}
              />
              <div className="text-xs opacity-60 mt-1">{blogPost.symbol.length}/10 characters</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Featured Image <span className="text-error">*Required</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input file-input-bordered w-full"
              />
              {imageFile && (
                <div className="mt-2 p-2 bg-success/10 rounded-lg">
                  <p className="text-sm text-success">
                    ✅ Selected: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
              <div className="text-xs opacity-60 mt-1">
                Maximum file size: 10MB. Supported formats: JPG, PNG, GIF, WebP
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Content <span className="text-error">*</span>
              </label>
              <textarea
                name="content"
                value={blogPost.content}
                onChange={handleInputChange}
                className="textarea textarea-bordered  rounded-3xl w-full h-40"
                placeholder="Write your blog post content here..."
                maxLength={5000}
              />
              <div className="text-xs opacity-60 mt-1">{blogPost.content.length}/5000 characters</div>
            </div>
            <div className="pt-4">
              <button
                onClick={createBlogPostCoin}
                disabled={
                  isCreating || !connectedAddress || !blogPost.title.trim() || !blogPost.content.trim() || !imageFile
                }
                className="btn btn-primary w-full"
              >
                {isCreating ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating Coin...
                  </>
                ) : (
                  "🚀 Create Blog Post Coin"
                )}
              </button>
            </div>
          </div>
        </div>
        {createdCoin && (
          <div className="bg-success/10 border border-success rounded-3xl p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4 text-success">🎉 Coin Created Successfully!</h3>
            <div className="space-y-2">
              <p>
                <strong>Transaction Hash:</strong>
                <code className="text-sm ml-2 break-all">{createdCoin.hash}</code>
              </p>
              <p>
                <strong>Coin Address:</strong>
                <code className="text-sm ml-2 break-all">{createdCoin.address}</code>
              </p>
              <p>
                <strong>Network:</strong> Base Sepolia Testnet
              </p>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Link
                  href={`https://sepolia.basescan.org/tx/${createdCoin.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline btn-success"
                >
                  📜 View Transaction
                </Link>
                <Link
                  href={`https://sepolia.basescan.org/address/${createdCoin.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline btn-success"
                >
                  🛈 View Coin Contract
                </Link>
                <Link
                  href={`/post/${createdCoin.address}`}
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline btn-success"
                >
                  🖼 View Post
                </Link>
              </div>
            </div>
          </div>
        )}
        {!connectedAddress && (
          <div className="alert alert-warning mb-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>Please connect your wallet to create blog post coins</span>
          </div>
        )}
      </div>
    </div>
  );
}
