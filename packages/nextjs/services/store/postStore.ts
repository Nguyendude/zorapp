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
  transport: http(),
});

// PostMint contract event topics
const NEW_POST_EVENT = parseAbiItem("event NewPost(uint256 indexed postId, address indexed author, string title, string content, string imageUrl)");
const POST_TRADED_EVENT = parseAbiItem("event PostTraded(uint256 indexed postId, address indexed trader, uint256 amount, uint256 price)");

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

  // Listen for new posts
  publicClient.watchEvent({
    address: factoryAddress as `0x${string}`,
    event: NEW_POST_EVENT,
    onLogs: logs => {
      logs.forEach(log => {
        const { postId, author, title, content, imageUrl } = log.args;
        store.addPost({
          id: Number(postId),
          title: title ?? "",
          content: content ?? "",
          symbol: "POST", // Default symbol
          coinAddress: log.address,
          author: author ?? "",
          createdAt: Date.now(),
          imageUrl: imageUrl ?? "",
          marketCap: BigInt(0),
          totalSupply: BigInt("1000000000000000000000000000"),
          lastPrice: BigInt(0),
        });
      });
    },
  });

  // Listen for trades to update market data
  publicClient.watchEvent({
    address: factoryAddress as `0x${string}`,
    event: POST_TRADED_EVENT,
    onLogs: logs => {
      logs.forEach(log => {
        const { postId, price } = log.args;
        // Find post by ID and update its market data
        const post = store.posts.find(p => p.id === Number(postId));
        if (post) {
          store.updatePost(post.coinAddress, {
            lastPrice: price,
            marketCap: (price ?? BigInt(0)) * post.totalSupply / BigInt("1000000000000000000"), // Adjust for decimals
          });
        }
      });
    },
  });
};