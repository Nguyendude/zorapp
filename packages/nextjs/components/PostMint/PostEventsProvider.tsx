import { useEffect } from "react";
import { initializePostEventListeners } from "../../services/store/postStore";

// Factory address on Base Sepolia
const FACTORY_ADDRESS = "0xcc71abcc15da45dde1fdb4dff29785c028de8f0b";

export default function PostEventsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize contract event listeners
    initializePostEventListeners(FACTORY_ADDRESS);
  }, []);

  return <>{children}</>;
}