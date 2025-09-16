// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ChannelMint
 * @dev Contract for creating tradeable channel tokens with associated metadata
 */
contract ChannelMint is ERC20, Ownable {
    using Strings for uint256;

    // Channel metadata
    string public description;
    string public category;
    string public profileImage;
    string public bannerImage;
    string[] public socialLinks;
    
    // Channel statistics
    uint256 public subscribers;
    uint256 public totalViews;
    
    // Trading parameters
    uint256 public constant TRADING_FEE_BPS = 30; // 0.3% trading fee
    uint256 public constant MAX_BPS = 10000;
    
    // Events
    event ChannelUpdated(
        string description,
        string category,
        string profileImage,
        string bannerImage
    );
    event SocialLinkAdded(string link);
    event SocialLinkRemoved(uint256 index);
    event StatisticsUpdated(uint256 subscribers, uint256 totalViews);
    
    /**
     * @dev Constructor for creating a new channel token
     * @param name Channel display name
     * @param symbol Channel ticker symbol (will be the token symbol)
     * @param initialSupply Initial token supply
     * @param _description Channel description
     * @param _category Channel category
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory _description,
        string memory _category
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(bytes(_description).length > 0, "Description required");
        require(bytes(_category).length > 0, "Category required");
        
        description = _description;
        category = _category;
        
        // Mint initial supply to channel creator
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Update channel metadata
     * @param _description New channel description
     * @param _category New channel category
     * @param _profileImage New profile image URI
     * @param _bannerImage New banner image URI
     */
    function updateChannelMetadata(
        string memory _description,
        string memory _category,
        string memory _profileImage,
        string memory _bannerImage
    ) external onlyOwner {
        require(bytes(_description).length > 0, "Description required");
        require(bytes(_category).length > 0, "Category required");
        
        description = _description;
        category = _category;
        profileImage = _profileImage;
        bannerImage = _bannerImage;
        
        emit ChannelUpdated(_description, _category, _profileImage, _bannerImage);
    }
    
    /**
     * @dev Add a social media link to the channel
     * @param link Social media link to add
     */
    function addSocialLink(string memory link) external onlyOwner {
        require(bytes(link).length > 0, "Link cannot be empty");
        socialLinks.push(link);
        emit SocialLinkAdded(link);
    }
    
    /**
     * @dev Remove a social media link from the channel
     * @param index Index of the link to remove
     */
    function removeSocialLink(uint256 index) external onlyOwner {
        require(index < socialLinks.length, "Invalid index");
        
        // Move the last element to the deleted position
        socialLinks[index] = socialLinks[socialLinks.length - 1];
        socialLinks.pop();
        
        emit SocialLinkRemoved(index);
    }
    
    /**
     * @dev Update channel statistics
     * @param _subscribers New subscriber count
     * @param _totalViews New total views count
     */
    function updateStatistics(
        uint256 _subscribers,
        uint256 _totalViews
    ) external onlyOwner {
        subscribers = _subscribers;
        totalViews = _totalViews;
        emit StatisticsUpdated(_subscribers, _totalViews);
    }
    
    /**
     * @dev Get all social links
     * @return Array of social media links
     */
    function getSocialLinks() external view returns (string[] memory) {
        return socialLinks;
    }
    
    /**
     * @dev Calculate trading fee for a given amount
     * @param amount Amount being traded
     * @return Fee amount
     */
    function calculateTradingFee(uint256 amount) public pure returns (uint256) {
        return (amount * TRADING_FEE_BPS) / MAX_BPS;
    }
    
    /**
     * @dev Override transfer function to include trading fee
     * @param to Recipient address
     * @param value Amount to transfer
     * @return success Whether the transfer was successful
     */
    function transfer(address to, uint256 value) public override returns (bool) {
        uint256 fee = calculateTradingFee(value);
        uint256 transferAmount = value - fee;
        
        // Transfer main amount
        bool success = super.transfer(to, transferAmount);
        
        // Transfer fee to contract owner
        if (success && fee > 0) {
            super.transfer(owner(), fee);
        }
        
        return success;
    }
    
    /**
     * @dev Override transferFrom function to include trading fee
     * @param from Sender address
     * @param to Recipient address
     * @param value Amount to transfer
     * @return success Whether the transfer was successful
     */
    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        uint256 fee = calculateTradingFee(value);
        uint256 transferAmount = value - fee;
        
        // Transfer main amount
        bool success = super.transferFrom(from, to, transferAmount);
        
        // Transfer fee to contract owner
        if (success && fee > 0) {
            super.transferFrom(from, owner(), fee);
        }
        
        return success;
    }
}