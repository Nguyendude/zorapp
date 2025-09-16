// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ChannelMint.sol";

/**
 * @title ChannelFactory
 * @dev Factory contract for creating new Channel tokens
 */
contract ChannelFactory {
    // Events
    event ChannelCreated(
        address indexed channelAddress,
        string name,
        string symbol,
        address indexed creator,
        uint256 initialSupply
    );
    
    // Array to track all created channels
    address[] public channels;
    
    // Mapping from creator address to their channels
    mapping(address => address[]) public creatorChannels;
    
    // Mapping to track used symbols
    mapping(string => bool) public symbolExists;
    
    /**
     * @dev Create a new channel token
     * @param name Channel display name
     * @param symbol Channel ticker symbol
     * @param initialSupply Initial token supply
     * @param description Channel description
     * @param category Channel category
     * @return channelAddress Address of the newly created channel contract
     */
    function createChannel(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory description,
        string memory category
    ) external returns (address channelAddress) {
        // Validate symbol
        require(!symbolExists[symbol], "Symbol already exists");
        require(bytes(symbol).length >= 3 && bytes(symbol).length <= 10, "Invalid symbol length");
        
        // Create new channel contract
        ChannelMint channel = new ChannelMint(
            name,
            symbol,
            initialSupply,
            description,
            category
        );
        
        channelAddress = address(channel);
        
        // Register channel
        channels.push(channelAddress);
        creatorChannels[msg.sender].push(channelAddress);
        symbolExists[symbol] = true;
        
        emit ChannelCreated(
            channelAddress,
            name,
            symbol,
            msg.sender,
            initialSupply
        );
        
        return channelAddress;
    }
    
    /**
     * @dev Get all channels created by a specific address
     * @param creator Address of the channel creator
     * @return Array of channel addresses
     */
    function getCreatorChannels(address creator) external view returns (address[] memory) {
        return creatorChannels[creator];
    }
    
    /**
     * @dev Get total number of channels created
     * @return Total channel count
     */
    function getTotalChannels() external view returns (uint256) {
        return channels.length;
    }
    
    /**
     * @dev Check if a symbol is available
     * @param symbol Symbol to check
     * @return bool Whether the symbol is available
     */
    function isSymbolAvailable(string memory symbol) external view returns (bool) {
        return !symbolExists[symbol];
    }
}