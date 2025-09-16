"use client";

import { useState, useCallback, useRef } from "react";
import { parseEther } from "viem";
import { useDebounce } from "use-debounce";
import { useCreateChannel, useCheckSymbolAvailability } from "~~/utils/channel";
import { uploadFileToIPFS, uploadMetadataToIPFS, createChannelMetadata } from "~~/utils/ipfs";

const CHANNEL_CATEGORIES = [
  "Technology",
  "Entertainment",
  "Education",
  "Gaming",
  "Music",
  "Art",
  "Sports",
  "News",
  "Other",
];

export const CreateChannelForm = () => {
  const profileImageRef = useRef<HTMLInputElement>(null);
  const bannerImageRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    category: "",
    initialSupply: "1000000", // Default 1M tokens
    socialLinks: [] as string[],
    profileImage: null as File | null,
    bannerImage: null as File | null,
  });

  const [symbolError, setSymbolError] = useState("");
  const [imageError, setImageError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [debouncedSymbol] = useDebounce(formData.symbol, 500);
  
  const { isAvailable, isLoading: isCheckingSymbol } = useCheckSymbolAvailability(debouncedSymbol);
  const { createChannel, isLoading: isCreating, isSuccess } = useCreateChannel();

  // Validate symbol format
  const validateSymbol = useCallback((symbol: string) => {
    if (symbol.length < 3) {
      return "Symbol must be at least 3 characters";
    }
    if (symbol.length > 10) {
      return "Symbol must be 10 characters or less";
    }
    if (!/^[A-Za-z0-9]+$/.test(symbol)) {
      return "Symbol must contain only letters and numbers";
    }
    return "";
  }, []);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "symbol") {
      const error = validateSymbol(value);
      setSymbolError(error);
      setFormData(prev => ({ ...prev, symbol: value.toUpperCase() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setImageError(`Invalid ${type} image type. Please use JPG, PNG, or GIF.`);
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload images to IPFS if provided
      let profileImageURI = "";
      let bannerImageURI = "";
      
      if (formData.profileImage) {
        profileImageURI = await uploadFileToIPFS(formData.profileImage);
      }
      
      if (formData.bannerImage) {
        bannerImageURI = await uploadFileToIPFS(formData.bannerImage);
      }
      
      // Create and upload metadata
      const metadata = createChannelMetadata({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        profileImage: profileImageURI,
        bannerImage: bannerImageURI,
        socialLinks: formData.socialLinks,
      });
      
      const metadataURI = await uploadMetadataToIPFS(metadata);
      
      // Create channel with the metadata URI
      await createChannel({
        name: formData.name,
        symbol: formData.symbol,
        initialSupply: parseEther(formData.initialSupply),
        description: metadataURI, // Store IPFS URI in description
        category: formData.category,
      });
      
    } catch (error) {
      console.error("Error creating channel:", error);
      notification.error(
        "Error creating channel",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Handle social link addition
  const handleAddSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, ""],
    }));
  };

  // Handle social link update
  const handleSocialLinkChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => i === index ? value : link),
    }));
  };

  // Handle social link removal
  const handleRemoveSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAvailable) {
      setSymbolError("Symbol is already taken");
      return;
    }

    if (symbolError || imageError) {
      return;
    }

    try {
      await createChannel({
        name: formData.name,
        symbol: formData.symbol,
        initialSupply: parseEther(formData.initialSupply),
        description: formData.description,
        category: formData.category,
      });
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-base-200 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Create a Channel</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Channel Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Channel Name</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Your Channel Name"
            required
          />
        </div>

        {/* Channel Symbol/Ticker */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Channel Symbol (Ticker)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              className={`input input-bordered w-full ${
                symbolError ? "input-error" : isAvailable ? "input-success" : ""
              }`}
              placeholder="SYMBOL"
              required
            />
            {isCheckingSymbol ? (
              <span className="loading loading-spinner absolute right-3 top-3"></span>
            ) : (
              debouncedSymbol && !symbolError && (
                <span className="absolute right-3 top-3">
                  {isAvailable ? "✅" : "❌"}
                </span>
              )
            )}
          </div>
          {symbolError && (
            <label className="label">
              <span className="label-text-alt text-error">{symbolError}</span>
            </label>
          )}
          {!symbolError && debouncedSymbol && !isAvailable && (
            <label className="label">
              <span className="label-text-alt text-error">Symbol is already taken</span>
            </label>
          )}
          <label className="label">
            <span className="label-text-alt">
              This will be your channel's token symbol and cannot be changed later
            </span>
          </label>
        </div>

        {/* Description */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="textarea textarea-bordered h-24"
            placeholder="Describe your channel..."
            required
          ></textarea>
        </div>

        {/* Category */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Category</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="select select-bordered w-full"
            required
          >
            <option value="">Select a category</option>
            {CHANNEL_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Profile Image Upload */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Profile Image</span>
          </label>
          <input
            type="file"
            ref={profileImageRef}
            onChange={(e) => handleFileSelect(e, 'profile')}
            accept="image/jpeg,image/png,image/gif"
            className="hidden"
          />
          <div
            onClick={() => profileImageRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-base-300 transition-colors"
          >
            {formData.profileImage ? (
              <div>
                <img
                  src={URL.createObjectURL(formData.profileImage)}
                  alt="Profile preview"
                  className="mx-auto h-32 w-32 object-cover rounded-full"
                />
                <p className="mt-2 text-sm opacity-70">{formData.profileImage.name}</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Click to upload profile image</p>
                <p className="text-sm opacity-70">JPG, PNG, or GIF</p>
              </div>
            )}
          </div>
        </div>

        {/* Banner Image Upload */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Banner Image</span>
          </label>
          <input
            type="file"
            ref={bannerImageRef}
            onChange={(e) => handleFileSelect(e, 'banner')}
            accept="image/jpeg,image/png,image/gif"
            className="hidden"
          />
          <div
            onClick={() => bannerImageRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-base-300 transition-colors"
          >
            {formData.bannerImage ? (
              <div>
                <img
                  src={URL.createObjectURL(formData.bannerImage)}
                  alt="Banner preview"
                  className="mx-auto h-32 w-full object-cover rounded-lg"
                />
                <p className="mt-2 text-sm opacity-70">{formData.bannerImage.name}</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Click to upload banner image</p>
                <p className="text-sm opacity-70">JPG, PNG, or GIF</p>
              </div>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Social Links</span>
          </label>
          <div className="space-y-2">
            {formData.socialLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => handleSocialLinkChange(index, e.target.value)}
                  className="input input-bordered flex-1"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink(index)}
                  className="btn btn-error btn-square"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddSocialLink}
              className="btn btn-outline w-full"
            >
              Add Social Link
            </button>
          </div>
        </div>

        {/* Initial Supply */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Initial Token Supply</span>
          </label>
          <input
            type="number"
            name="initialSupply"
            value={formData.initialSupply}
            onChange={handleChange}
            className="input input-bordered w-full"
            min="1"
            step="1"
            required
          />
          <label className="label">
            <span className="label-text-alt">
              This is the total number of tokens that will be created for your channel
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`btn btn-primary w-full ${isCreating || isUploading ? "loading" : ""}`}
          disabled={isCreating || isUploading || !!symbolError || !!imageError || !isAvailable}
        >
          {isUploading
            ? "Uploading Files..."
            : isCreating
            ? "Creating Channel..."
            : "Create Channel"}
        </button>

        {/* Success Message */}
        {isSuccess && (
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Channel created successfully!</span>
          </div>
        )}
      </form>
    </div>
  );
};