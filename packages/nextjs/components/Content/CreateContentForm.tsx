"use client";

import { useState, useCallback, useRef } from "react";
import { parseEther } from "viem";
import { useDebounce } from "use-debounce";
import { useCreateContent, useCheckSymbolAvailability } from "~~/utils/content";

// Supported content types and their file extensions
const CONTENT_TYPES = {
  "Audio": ["mp3", "wav"],
  "Video": ["mp4", "mov", "mpeg"],
  "Image": ["png", "jpg", "jpeg", "gif", "svg"],
  "Animation": ["gif", "svg"],
};

const LICENSE_TYPES = [
  "All Rights Reserved",
  "Creative Commons BY",
  "Creative Commons BY-SA",
  "Creative Commons BY-ND",
  "Creative Commons BY-NC",
  "Creative Commons BY-NC-SA",
  "Creative Commons BY-NC-ND",
  "Public Domain",
];

export const CreateContentForm = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    license: "",
    initialSupply: "1000000", // Default 1M tokens
    contentType: "",
    contentFile: null as File | null,
  });

  const [symbolError, setSymbolError] = useState("");
  const [fileError, setFileError] = useState("");
  const [debouncedSymbol] = useDebounce(formData.symbol, 500);
  
  const { isAvailable, isLoading: isCheckingSymbol } = useCheckSymbolAvailability(debouncedSymbol);
  const { createContent, isLoading: isCreating, isSuccess } = useCreateContent();

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
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileError("Please select a file");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = Object.values(CONTENT_TYPES).flat();
    
    if (!extension || !validExtensions.includes(extension)) {
      setFileError("Invalid file type");
      return;
    }

    setFileError("");
    setFormData(prev => ({
      ...prev,
      contentFile: file,
      contentType: extension,
    }));
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Calculate content duration (for audio/video)
  const calculateDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
        const media = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
        media.preload = "metadata";
        media.onloadedmetadata = () => resolve(Math.round(media.duration));
        media.src = URL.createObjectURL(file);
      } else {
        resolve(0); // 0 duration for non-temporal content
      }
    });
  };

  // Calculate content hash
  const calculateHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contentFile) {
      setFileError("Please select a file");
      return;
    }

    if (!isAvailable) {
      setSymbolError("Symbol is already taken");
      return;
    }

    if (symbolError || fileError) {
      return;
    }

    try {
      // TODO: Upload file to IPFS/Arweave and get URI
      const contentURI = "ipfs://placeholder"; // Replace with actual upload
      
      const duration = await calculateDuration(formData.contentFile);
      const contentHash = await calculateHash(formData.contentFile);

      await createContent({
        name: formData.name,
        symbol: formData.symbol,
        initialSupply: parseEther(formData.initialSupply),
        contentType: formData.contentType,
        contentURI,
        description: formData.description,
        license: formData.license,
        duration,
        contentHash,
      });
    } catch (error) {
      console.error("Error creating content:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-base-200 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Create Content</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Content Name</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Your Content Name"
            required
          />
        </div>

        {/* Content Symbol/Ticker */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Content Symbol (Ticker)</span>
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
        </div>

        {/* File Upload */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Content File</span>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={Object.values(CONTENT_TYPES).flat().map(ext => `.${ext}`).join(",")}
            className="hidden"
          />
          <div
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-base-300 transition-colors ${
              fileError ? "border-error" : "border-primary"
            }`}
          >
            {formData.contentFile ? (
              <div>
                <p className="font-medium">{formData.contentFile.name}</p>
                <p className="text-sm opacity-70">
                  {(formData.contentFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm opacity-70">
                  Supported formats: {Object.values(CONTENT_TYPES).flat().join(", ")}
                </p>
              </div>
            )}
          </div>
          {fileError && (
            <label className="label">
              <span className="label-text-alt text-error">{fileError}</span>
            </label>
          )}
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
            placeholder="Describe your content..."
            required
          ></textarea>
        </div>

        {/* License */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">License</span>
          </label>
          <select
            name="license"
            value={formData.license}
            onChange={handleChange}
            className="select select-bordered w-full"
            required
          >
            <option value="">Select a license</option>
            {LICENSE_TYPES.map(license => (
              <option key={license} value={license}>
                {license}
              </option>
            ))}
          </select>
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
              This is the total number of tokens that will be created for your content
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`btn btn-primary w-full ${isCreating ? "loading" : ""}`}
          disabled={isCreating || !!symbolError || !!fileError || !formData.contentFile || !isAvailable}
        >
          {isCreating ? "Creating Content..." : "Create Content"}
        </button>

        {/* Success Message */}
        {isSuccess && (
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Content created successfully!</span>
          </div>
        )}
      </form>
    </div>
  );
};