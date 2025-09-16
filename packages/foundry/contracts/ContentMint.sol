// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ContentMint
 * @dev Contract for creating tradeable tokens for media content
 */
contract ContentMint is ERC20, Ownable {
    using Strings for uint256;

    // Content metadata
    string public contentType; // mp3, mpeg, svg, png, etc.
    string public contentURI; // IPFS/Arweave URI of the content
    string public description;
    string public license;
    uint256 public duration; // For audio/video content (in seconds)
    uint256 public creationDate;
    string public contentHash; // Hash for content verification
    
    // Content statistics
    uint256 public views;
    uint256 public likes;
    
    // Trading parameters
    uint256 public constant TRADING_FEE_BPS = 30; // 0.3% trading fee
    uint256 public constant MAX_BPS = 10000;
    
    // Access control
    mapping(address => bool) public hasAccess;
    
    // Events
    event ContentUpdated(
        string contentURI,
        string description,
        string license
    );
    event StatisticsUpdated(uint256 views, uint256 likes);
    event AccessGranted(address user);
    event AccessRevoked(address user);
    
    /**
     * @dev Constructor for creating a new content token
     * @param name Content name
     * @param symbol Content ticker symbol
     * @param initialSupply Initial token supply
     * @param _contentType Type of content (mp3, mpeg, etc.)
     * @param _contentURI URI where content is stored
     * @param _description Content description
     * @param _license Content license
     * @param _duration Content duration (0 for non-temporal content)
     * @param _contentHash Hash of the content for verification
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory _contentType,
        string memory _contentURI,
        string memory _description,
        string memory _license,
        uint256 _duration,
        string memory _contentHash
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(bytes(_contentType).length > 0, "Content type required");
        require(bytes(_contentURI).length > 0, "Content URI required");
        require(bytes(_contentHash).length > 0, "Content hash required");
        
        contentType = _contentType;
        contentURI = _contentURI;
        description = _description;
        license = _license;
        duration = _duration;
        contentHash = _contentHash;
        creationDate = block.timestamp;
        
        // Grant access to creator
        hasAccess[msg.sender] = true;
        emit AccessGranted(msg.sender);
        
        // Mint initial supply to content creator
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Update content metadata
     * @param _contentURI New content URI
     * @param _description New description
     * @param _license New license
     */
    function updateContentMetadata(
        string memory _contentURI,
        string memory _description,
        string memory _license
    ) external onlyOwner {
        require(bytes(_contentURI).length > 0, "Content URI required");
        
        contentURI = _contentURI;
        description = _description;
        license = _license;
        
        emit ContentUpdated(_contentURI, _description, _license);
    }
    
    /**
     * @dev Update content statistics
     * @param _views New view count
     * @param _likes New like count
     */
    function updateStatistics(
        uint256 _views,
        uint256 _likes
    ) external onlyOwner {
        views = _views;
        likes = _likes;
        emit StatisticsUpdated(_views, _likes);
    }
    
    /**
     * @dev Grant content access to an address
     * @param user Address to grant access to
     */
    function grantAccess(address user) external onlyOwner {
        require(!hasAccess[user], "Already has access");
        hasAccess[user] = true;
        emit AccessGranted(user);
    }
    
    /**
     * @dev Revoke content access from an address
     * @param user Address to revoke access from
     */
    function revokeAccess(address user) external onlyOwner {
        require(user != owner(), "Cannot revoke owner access");
        require(hasAccess[user], "No access to revoke");
        hasAccess[user] = false;
        emit AccessRevoked(user);
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
     * @dev Override transfer function to include trading fee and access control
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
        
        // Grant access to recipient if they receive tokens
        if (success && !hasAccess[to]) {
            hasAccess[to] = true;
            emit AccessGranted(to);
        }
        
        return success;
    }
    
    /**
     * @dev Override transferFrom function to include trading fee and access control
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
        
        // Grant access to recipient if they receive tokens
        if (success && !hasAccess[to]) {
            hasAccess[to] = true;
            emit AccessGranted(to);
        }
        
        return success;
    }
}