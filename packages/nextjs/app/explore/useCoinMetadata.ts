import { useEffect, useState } from "react";

export function useCoinMetadata(address: string | undefined) {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    async function fetchMetadata() {
      setLoading(true);
      try {
        // Try to fetch Zora metadata URI from the Zora API
        const zoraApi = `https://api.zora.co/v1/token/ethereum/${address}/1`;
        const resp = await fetch(zoraApi);
        const data = await resp.json();
        const uri = data?.token?.tokenUrl || data?.token?.metadataURI;
        if (uri) {
          // If it's an ipfs:// URI, convert to gateway URL
          const url = uri.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}` : uri;
          const metaResp = await fetch(url);
          const meta = await metaResp.json();
          if (!cancelled) setMetadata(meta);
        } else {
          if (!cancelled) setMetadata(null);
        }
      } catch {
        if (!cancelled) setMetadata(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMetadata();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return { metadata, loading };
}
