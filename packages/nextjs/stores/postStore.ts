import { create } from 'zustand';

export interface Post {
  id: number;
  title: string;
  content: string;
  symbol: string;
  author: string;
  coinAddress: string;
  imageUrl: string;
  createdAt: number;
  totalSupply: bigint;
  marketCap: bigint;
}

interface PostStore {
  posts: Post[];
  isLoading: boolean;
  error: Error | null;
  addPost: (post: Post) => void;
  setPosts: (posts: Post[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  fetchPosts: () => Promise<void>;
}

export const usePostStore = create<PostStore>((set) => ({
  posts: [],
  isLoading: false,
  error: null,
  addPost: (post) => set((state) => ({ 
    posts: [...state.posts, post],
    error: null
  })),
  setPosts: (posts) => set({ 
    posts,
    error: null
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  fetchPosts: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement actual fetching logic here
      // This is a placeholder that sets empty posts
      set({ posts: [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch posts'),
        isLoading: false 
      });
    }
  }
}));