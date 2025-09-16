// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ContentMint.sol";

/**
 * @title ContentFactory
 * @dev Factory contract for creating new Content tokens
 */
contract ContentFactory {
    // Events
    event ContentCreated(
        address indexed contentAddress,
        string name,
        string symbol,
        address indexed creator,
        string contentType,
        uint256 initialSupply
    );
    
    // Array to track all created content
    address[] public contents;
    
    // Mapping from creator address to their content
    mapping(address => address[]) public creatorContents;
    
    // Mapping to track used symbols
    mapping(string => bool) public symbolExists;
    
    // Valid content types
    mapping(string => bool) public validContentTypes;
    
    constructor() {
        // Initialize valid content types
        validContentTypes["mp3"] = true;
        validContentTypes["mpeg"] = true;
        validContentTypes["svg"] = true;
        validContentTypes["png"] = true;
        validContentTypes["jpg"] = true;
        validContentTypes["jpeg"] = true;
        validContentTypes["gif"] = true;
        validContentTypes["mov"] = true;
        validContentTypes["mp4"] = true;
    }
    
    /**
     * @dev Create a new content token
     * @param name Content name
     * @param symbol Content ticker symbol
     * @param initialSupply Initial token supply
     * @param contentType Type of content
     * @param contentURI URI of the content
     * @param description Content description
     * @param license Content license
     * @param duration Content duration
     * @param contentHash Hash of the content
     * @return contentAddress Address of the newly created content contract
     */
    function createContent(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory contentType,
        string memory contentURI,
        string memory description,
        string memory license,
        uint256 duration,
        string memory contentHash
    ) external returns (address contentAddress) {
        // Validate content type and symbol
        require(validContentTypes[contentType], "Invalid content type");
        require(!symbolExists[symbol], "Symbol already exists");
        require(bytes(symbol).length >= 3 && bytes(symbol).length <= 10, "Invalid symbol length");
        
        // Create new content contract
        ContentMint content = new ContentMint(
            name,
            symbol,
            initialSupply,
            contentType,
            contentURI,
            description,
            license,
            duration,
            contentHash
        );
        
        contentAddress = address(content);
        
        // Register content
        contents.push(contentAddress);
        creatorContents[msg.sender].push(contentAddress);
        symbolExists[symbol] = true;
        
        emit ContentCreated(
            contentAddress,
            name,
            symbol,
            msg.sender,
            contentType,
            initialSupply
        );
        
        return contentAddress;
    }
    
    /**
     * @dev Add a new valid content type
     * @param contentType Content type to add
     */
    function addContentType(string memory contentType) external {
        // This should be restricted to admin/owner in production
        validContentTypes[contentType] = true;
    }
    
    /**
     * @dev Remove a valid content type
     * @param contentType Content type to remove
     */
    function removeContentType(string memory contentType) external {
        // This should be restricted to admin/owner in production
        validContentTypes[contentType] = false;
    }
    
    /**
     * @dev Get all content created by a specific address
     * @param creator Address of the content creator
     * @return Array of content addresses
     */
    function getCreatorContent(address creator) external view returns (address[] memory) {
        return creatorContents[creator];
    }
    
    /**
     * @dev Get total number of content items created
     * @return Total content count
     */
    function getTotalContent() external view returns (uint256) {
        return contents.length;
    }
    
    /**
     * @dev Check if a symbol is available
     * @param symbol Symbol to check
     * @return bool Whether the symbol is available
     */
    function isSymbolAvailable(string memory symbol) external view returns (bool) {
        return !symbolExists[symbol];
    }
    
    /**
     * @dev Check if a content type is valid
     * @param contentType Content type to check
     * @return bool Whether the content type is valid
     */
    function isValidContentType(string memory contentType) external view returns (bool) {
        return validContentTypes[contentType];
    }
}