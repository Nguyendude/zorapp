"use client";

import { create } from "ipfs-http-client";
import all from "it-all";
import { concat } from "uint8arrays/concat";
import { toString } from "uint8arrays/to-string";

// Configure IPFS client
// Replace with your IPFS node or service credentials
const projectId = process.env.NEXT_PUBLIC_INFURA_IPFS_PROJECT_ID;
const projectSecret = process.env.NEXT_PUBLIC_INFURA_IPFS_PROJECT_SECRET;
const auth = `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString("base64")}`;

const ipfsClient = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: auth,
  },
});

export interface IPFSContent {
  name: string;
  description: string;
  image?: string;
  animation_url?: string;
  properties: {
    [key: string]: any;
  };
}

/**
 * Upload a file to IPFS
 * @param file File to upload
 * @returns IPFS URI (ipfs://...)
 */
export const uploadFileToIPFS = async (file: File): Promise<string> => {
  try {
    const added = await ipfsClient.add(file, {
      progress: (prog) => console.log(`Uploading file... ${prog}`),
    });
    
    return `ipfs://${added.cid.toString()}`;
  } catch (error) {
    console.error("Error uploading file to IPFS:", error);
    throw new Error("Failed to upload file to IPFS");
  }
};

/**
 * Upload metadata to IPFS
 * @param content Metadata content
 * @returns IPFS URI (ipfs://...)
 */
export const uploadMetadataToIPFS = async (content: IPFSContent): Promise<string> => {
  try {
    const data = JSON.stringify(content);
    const added = await ipfsClient.add(data);
    return `ipfs://${added.cid.toString()}`;
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error);
    throw new Error("Failed to upload metadata to IPFS");
  }
};

/**
 * Get content from IPFS
 * @param uri IPFS URI (ipfs://...)
 * @returns Content as string
 */
export const getFromIPFS = async (uri: string): Promise<string> => {
  try {
    const cid = uri.replace("ipfs://", "");
    const chunks = await all(ipfsClient.cat(cid));
    const data = concat(chunks);
    return toString(data);
  } catch (error) {
    console.error("Error getting content from IPFS:", error);
    throw new Error("Failed to get content from IPFS");
  }
};

/**
 * Create metadata for channel content
 * @param params Channel metadata parameters
 * @returns Metadata object
 */
export const createChannelMetadata = ({
  name,
  description,
  profileImage,
  bannerImage,
  category,
  socialLinks,
}: {
  name: string;
  description: string;
  profileImage?: string;
  bannerImage?: string;
  category: string;
  socialLinks: string[];
}): IPFSContent => {
  return {
    name,
    description,
    image: profileImage,
    properties: {
      category,
      bannerImage,
      socialLinks,
      type: "channel",
    },
  };
};

/**
 * Create metadata for media content
 * @param params Content metadata parameters
 * @returns Metadata object
 */
export const createContentMetadata = ({
  name,
  description,
  contentURI,
  contentType,
  license,
  duration,
  thumbnail,
}: {
  name: string;
  description: string;
  contentURI: string;
  contentType: string;
  license: string;
  duration?: number;
  thumbnail?: string;
}): IPFSContent => {
  return {
    name,
    description,
    image: thumbnail,
    animation_url: contentURI,
    properties: {
      contentType,
      license,
      duration,
      type: "content",
    },
  };
};