"use client";

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">How PostMint Works on Base Sepolia</h1>
      <div className="space-y-6">
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
  );
}
