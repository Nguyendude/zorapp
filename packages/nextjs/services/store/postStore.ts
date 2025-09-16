import { createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Post {
  id: number;
  title: string;
  content: string;
  symbol: string;
  coinAddress: string;
  author: string;
  createdAt: number;
  imageUrl: string;
  marketCap: bigint;
  totalSupply: bigint;
  lastPrice: bigint;
}

interface PostStore {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  addPost: (post: Post) => void;
  updatePost: (coinAddress: string, update: Partial<Post>) => void;
  setPosts: (posts: Post[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create a viem public client
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://base-sepolia.g.alchemy.com/v2/o3VW3WRXrsXXMRX3l7jZxLUqhWyZzXBy'),
});

// PostMint contract event topics
const POST_CREATED_EVENT = parseAbiItem('event PostCreated(uint256 indexed postId, address indexed author, string title, address coinAddress, string metadataURI)');
const POST_SUPPORTED_EVENT = parseAbiItem('event PostSupported(uint256 indexed postId, address indexed supporter, uint256 amount, uint256 coinAmount)');

export const usePostStore = create<PostStore>()(
  persist(
    (set, get) => ({
      posts: [],
      isLoading: false,
      error: null,

      addPost: (post: Post) =>
        set(state => ({
          posts: [post, ...state.posts],
        })),

      updatePost: (coinAddress: string, update: Partial<Post>) =>
        set(state => ({
          posts: state.posts.map(post =>
            post.coinAddress === coinAddress ? { ...post, ...update } : post,
          ),
        })),

      setPosts: (posts: Post[]) => set({ posts }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: "post-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Initialize event listeners for real-time updates
export const initializePostEventListeners = async (factoryAddress: string) => {
  const store = usePostStore.getState();
  store.setLoading(true);
  
  try {
    // Just fetch very recent posts (last 5 blocks)
    const currentBlock = await publicClient.getBlockNumber();
    const startBlock = currentBlock - 5n; // Look back 5 blocks for recent posts
    
    console.log('Fetching recent posts...');
    const existingPosts = await publicClient.getLogs({
      address: factoryAddress as `0x${string}`,
      event: POST_CREATED_EVENT,
      fromBlock: startBlock,
      toBlock: currentBlock,
    });

    // Set up real-time event watching for new posts
    publicClient.watchEvent({
      address: factoryAddress as `0x${string}`,
      event: POST_CREATED_EVENT,
      onLogs: logs => {
        logs.forEach(log => {
          const { postId, author, title, coinAddress, metadataURI } = log.args;
          store.addPost({
            id: Number(postId),
            title: title ?? "",
            content: metadataURI ?? "",
            symbol: "ZORA",
            coinAddress: coinAddress || "",
            author: author ?? "",
            createdAt: Date.now(),
            imageUrl: "",
            marketCap: 0n,
            totalSupply: 0n,
            lastPrice: 0n,
          });
        });
      },
    });
    
    // Add existing posts to store
    existingPosts.forEach(log => {
      const { postId, author, title, coinAddress, metadataURI } = log.args;
      store.addPost({
        id: Number(postId),
        title: title ?? "",
        content: metadataURI ?? "",
        symbol: "ZORA",
        coinAddress: coinAddress || "",
        author: author ?? "",
        createdAt: Date.now(),
        imageUrl: "",
        marketCap: BigInt(0),
        totalSupply: BigInt("1000000000000000000000000000"),
        lastPrice: BigInt(0),
      });
    });
    
    console.log(`Loaded ${existingPosts.length} existing posts`);
  } catch (error) {
    console.error('Error loading posts:', error);
    store.setError(error instanceof Error ? error.message : 'Unknown error loading posts');
  } finally {
    store.setLoading(false);
  }

  // Listen for new posts
  publicClient.watchEvent({
    address: factoryAddress as `0x${string}`,
    event: POST_CREATED_EVENT,
    onLogs: logs => {
      logs.forEach(log => {
        const { postId, author, title, coinAddress, metadataURI } = log.args;
        store.addPost({
          id: Number(postId),
          title: title ?? "",
          content: metadataURI ?? "", // Using metadataURI as content for now
          symbol: "ZORA", // We can fetch this from the coin contract
          coinAddress: coinAddress || "",
          author: author ?? "",
          createdAt: Date.now(),
          imageUrl: "", // This could be part of metadataURI
          marketCap: BigInt(0),
          totalSupply: BigInt("1000000000000000000000000000"),
          lastPrice: BigInt(0),
        });
        
        // Log for debugging
        console.log('New post added:', {
          id: Number(postId),
          title,
          author,
          coinAddress
        });
      });
    },
  });

  // Listen for support events to update market data
  publicClient.watchEvent({
    address: factoryAddress as `0x${string}`,
    event: POST_SUPPORTED_EVENT,
    onLogs: logs => {
      logs.forEach(log => {
        const { postId, amount, coinAmount } = log.args;
        // Find post by ID and update its market data
        const post = store.posts.find(p => p.id === Number(postId));
        if (post) {
          store.updatePost(post.coinAddress, {
            lastPrice: amount || 0n,
            marketCap: ((amount || 0n) * (coinAmount || 0n)) / BigInt("1000000000000000000"), // Adjust for decimals
            totalSupply: BigInt(coinAmount || 0)
          });
        }
      });
    },
  });
};