export { default } from "./explore/page";
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

        {/* Created Coin Display */}
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

        {/* Connection Status */}
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

        {/* How it Works */}
        <div className="bg-base-100 rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">How PostMint Works on Base Sepolia</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">✍️</span>
              <div>
                <h3 className="font-semibold">Write Your Post</h3>
                <p className="text-sm opacity-70">Create compelling content that your audience will love</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🪙</span>
              <div>
                <h3 className="font-semibold">Mint as Coin</h3>
                <p className="text-sm opacity-70">Each post becomes a tradeable ERC-20 token on Base Sepolia</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">💰</span>
              <div>
                <h3 className="font-semibold">Earn from Trading</h3>
                <p className="text-sm opacity-70">Receive royalties when supporters buy and trade your coins</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🚀</span>
              <div>
                <h3 className="font-semibold">Supporters Win Too</h3>
                <p className="text-sm opacity-70">Early supporters profit when your content goes viral</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
