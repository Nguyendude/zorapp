
"use client";

import { useState, useEffect } from "react";
import { useAccount, useContractWrite, usePublicClient } from "wagmi";
import { formatEther, parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import {
	tradeCoin,
	getOnchainCoinDetails,
	setApiKey
} from "@zoralabs/coins-sdk";
import type { TradeParameters } from "@zoralabs/coins-sdk";
import { notification } from "~~/utils/scaffold-eth";

setApiKey(process.env.NEXT_PUBLIC_ZORA_API_KEY || "");

export interface TradingInterfaceProps {
	coinAddress: string;
	postTitle: string;
	postId: string;
}

export const TradingInterface = ({ coinAddress, postTitle, postId }: TradingInterfaceProps) => {
	const { address } = useAccount();
	const publicClient = usePublicClient();
	const [tradeAmount, setTradeAmount] = useState("");
	const [isTrading, setIsTrading] = useState(false);
	const [coinDetails, setCoinDetails] = useState<any>(null);
	const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");

			useEffect(() => {
				const fetchCoinDetails = async () => {
					if (!coinAddress || !publicClient || !address) return;
					try {
						const clientConfig = {
							...publicClient,
							cacheTime: publicClient.cacheTime ?? 0,
							chain: baseSepolia,
							key: publicClient.key ?? "",
							account: address,
						};
						const details = await getOnchainCoinDetails({
							coin: coinAddress as `0x${string}`,
							publicClient: clientConfig,
						});
						setCoinDetails(details);
					} catch (error) {
						console.error("Error fetching coin details:", error);
					}
				};
				fetchCoinDetails();
			}, [coinAddress, address, publicClient]);

	// TODO: Implement supportPost contract interaction if needed

	const handleTrade = async () => {
		if (!address || !tradeAmount || !coinAddress) {
			notification.error("Please connect wallet and enter amount");
			return;
		}
		setIsTrading(true);
		try {
			const tradeParams: TradeParameters = {
				sell: tradeType === "buy"
					? { type: "eth" }
					: { type: "erc20", address: coinAddress as `0x${string}` },
				buy: tradeType === "buy"
					? { type: "erc20", address: coinAddress as `0x${string}` }
					: { type: "eth" },
				amountIn: parseEther(tradeAmount),
				sender: address as `0x${string}`,
				recipient: address as `0x${string}`,
				slippage: 5,
			};
			if (publicClient && address) {
				const clientConfig = {
					...publicClient,
					cacheTime: publicClient.cacheTime ?? 0,
					chain: baseSepolia,
					key: publicClient.key ?? "",
					account: address,
				};
				await tradeCoin({
					tradeParameters: tradeParams,
					walletClient: undefined as any, // TODO: Provide walletClient from wagmi
					publicClient: clientConfig,
				});
			}
			notification.success(`Successfully ${tradeType === "buy" ? "bought" : "sold"} coins!`);
			setTradeAmount("");
							if (publicClient && address) {
								const clientConfig = {
									...publicClient,
									cacheTime: publicClient.cacheTime ?? 0,
									chain: baseSepolia,
									key: publicClient.key ?? "",
									account: address,
								};
								const updatedDetails = await getOnchainCoinDetails({
									coin: coinAddress as `0x${string}`,
									publicClient: clientConfig,
								});
								setCoinDetails(updatedDetails);
							}
		} catch (error) {
			console.error("Error trading:", error);
			notification.error("Trade failed. Please try again.");
		} finally {
			setIsTrading(false);
		}
	};

		return (
			<div className="rounded-xl bg-gradient-to-br from-base-100 to-base-200 shadow-2xl p-6 w-full max-w-md mx-auto">
				<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
					<span role="img" aria-label="trade">💰</span> Trade: <span className="truncate">{postTitle}</span>
				</h2>
				{coinDetails && (
					<div className="grid grid-cols-3 gap-4 mb-6">
						<div className="bg-base-300 rounded-lg p-3 text-center">
							<div className="text-xs text-accent">Current Price</div>
							<div className="font-mono text-lg font-bold">
								{formatEther(BigInt(coinDetails.price || "0"))} ETH
							</div>
						</div>
						<div className="bg-base-300 rounded-lg p-3 text-center">
							<div className="text-xs text-accent">Market Cap</div>
							<div className="font-mono text-sm">
								{formatEther(BigInt(coinDetails.marketCap || "0"))} ETH
							</div>
						</div>
						<div className="bg-base-300 rounded-lg p-3 text-center">
							<div className="text-xs text-accent">Total Supply</div>
							<div className="font-mono text-sm">
								{formatEther(BigInt(coinDetails.totalSupply || "0"))}
							</div>
						</div>
					</div>
				)}
				<div className="flex justify-center mb-6">
					<button
						onClick={() => setTradeType("buy")}
						className={`px-6 py-2 rounded-l-lg font-semibold border-2 border-success ${tradeType === "buy" ? "bg-success text-white" : "bg-base-100 text-success"}`}
					>
						Buy
					</button>
					<button
						onClick={() => setTradeType("sell")}
						className={`px-6 py-2 rounded-r-lg font-semibold border-2 border-error ${tradeType === "sell" ? "bg-error text-white" : "bg-base-100 text-error"}`}
					>
						Sell
					</button>
				</div>
				<div className="mb-4">
					<label className="block text-sm font-medium mb-2">Amount (ETH)</label>
					<input
						type="number"
						step="0.001"
						value={tradeAmount}
						onChange={(e) => setTradeAmount(e.target.value)}
						placeholder="0.01"
						className="input input-bordered w-full"
					/>
				</div>
				<div className="flex justify-end">
					<button
						onClick={handleTrade}
						disabled={isTrading || !address || !tradeAmount}
						className={`btn px-8 py-2 font-bold text-lg ${tradeType === "buy" ? "btn-success" : "btn-error"}`}
					>
						{isTrading ? (
							<>
								<span className="loading loading-spinner loading-sm"></span>
								<span className="ml-2">Trading...</span>
							</>
						) : (
							<span>{tradeType === "buy" ? "🟢 Buy" : "🔴 Sell"} Coins</span>
						)}
					</button>
				</div>
				<div className="mt-4 text-xs text-center text-accent-content opacity-70">
					Powered by Zora Coins SDK
				</div>
			</div>
		);
};
