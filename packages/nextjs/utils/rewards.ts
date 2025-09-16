import { createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";

const ZORA_REWARDS_ADDRESS = "0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B";

// Event signature for reward payments
const REWARD_PAID_EVENT = parseAbiItem('event RewardPaid(address indexed receiver, uint256 amount, address token)');

export interface RewardEvent {
  receiver: string;
  amount: bigint;
  token: string;
  blockNumber: bigint;
  transactionHash: string;
  timestamp: number;
}

export const getRewardsHistory = async (address: string): Promise<RewardEvent[]> => {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  try {
    // Get all reward events for this address
    const events = await publicClient.getLogs({
      address: ZORA_REWARDS_ADDRESS,
      event: REWARD_PAID_EVENT,
      args: {
        receiver: address as `0x${string}`,
      },
      fromBlock: 'earliest',
    });

    // Format events with additional data
    const rewardEvents = await Promise.all(events.map(async (event) => {
      const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
      
      return {
        receiver: event.args.receiver,
        amount: event.args.amount,
        token: event.args.token,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Number(block.timestamp),
      } as RewardEvent;
    }));

    return rewardEvents;
  } catch (error) {
    console.error("Error fetching rewards history:", error);
    return [];
  }
};

export const watchNewRewards = (
  address: string,
  callback: (event: RewardEvent) => void
) => {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // Watch for new reward events
  const unwatch = publicClient.watchContractEvent({
    address: ZORA_REWARDS_ADDRESS,
    event: REWARD_PAID_EVENT,
    args: { receiver: address as `0x${string}` },
    onLogs: async (logs) => {
      // Process each new reward event
      for (const log of logs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        
        const rewardEvent: RewardEvent = {
          receiver: log.args.receiver,
          amount: log.args.amount,
          token: log.args.token,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          timestamp: Number(block.timestamp),
        };

        callback(rewardEvent);
      }
    },
  });

  return unwatch;
};

export const getClaimableRewards = async (address: string): Promise<bigint> => {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  try {
    const claimable = await publicClient.readContract({
      address: ZORA_REWARDS_ADDRESS,
      abi: [{
        name: "claimableRewards",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      }],
      functionName: "claimableRewards",
      args: [address as `0x${string}`],
    });

    return claimable;
  } catch (error) {
    console.error("Error fetching claimable rewards:", error);
    return 0n;
  }
};