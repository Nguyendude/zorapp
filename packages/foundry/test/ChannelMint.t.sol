// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {ChannelMint} from "../contracts/ChannelMint.sol";
import {ChannelFactory} from "../contracts/ChannelFactory.sol";

contract ChannelMintTest is Test {
    ChannelMint public channel;
    ChannelFactory public factory;
    address public creator;
    
    event ChannelUpdated(
        string description,
        string category,
        string profileImage,
        string bannerImage
    );
    
    event SocialLinkAdded(string link);
    event SocialLinkRemoved(uint256 index);
    event StatisticsUpdated(uint256 subscribers, uint256 totalViews);
    
    function setUp() public {
        creator = makeAddr("creator");
        vm.startPrank(creator);
        
        // Deploy factory
        factory = new ChannelFactory();
        
        // Create channel through factory
        address channelAddress = factory.createChannel(
            "Test Channel",
            "TEST",
            1000000 ether,
            "Test Description",
            "Technology"
        );
        
        channel = ChannelMint(channelAddress);
        vm.stopPrank();
    }
    
    function test_ChannelInitialization() public {
        assertEq(channel.name(), "Test Channel");
        assertEq(channel.symbol(), "TEST");
        assertEq(channel.description(), "Test Description");
        assertEq(channel.category(), "Technology");
        assertEq(channel.balanceOf(creator), 1000000 ether);
    }
    
    function test_UpdateChannelMetadata() public {
        vm.startPrank(creator);
        
        vm.expectEmit(true, true, true, true);
        emit ChannelUpdated(
            "New Description",
            "Gaming",
            "ipfs://profile",
            "ipfs://banner"
        );
        
        channel.updateChannelMetadata(
            "New Description",
            "Gaming",
            "ipfs://profile",
            "ipfs://banner"
        );
        
        assertEq(channel.description(), "New Description");
        assertEq(channel.category(), "Gaming");
        assertEq(channel.profileImage(), "ipfs://profile");
        assertEq(channel.bannerImage(), "ipfs://banner");
        
        vm.stopPrank();
    }
    
    function test_SocialLinks() public {
        vm.startPrank(creator);
        
        // Add links
        vm.expectEmit(true, true, true, true);
        emit SocialLinkAdded("https://twitter.com/test");
        channel.addSocialLink("https://twitter.com/test");
        
        vm.expectEmit(true, true, true, true);
        emit SocialLinkAdded("https://github.com/test");
        channel.addSocialLink("https://github.com/test");
        
        string[] memory links = channel.getSocialLinks();
        assertEq(links.length, 2);
        assertEq(links[0], "https://twitter.com/test");
        assertEq(links[1], "https://github.com/test");
        
        // Remove link
        vm.expectEmit(true, true, true, true);
        emit SocialLinkRemoved(0);
        channel.removeSocialLink(0);
        
        links = channel.getSocialLinks();
        assertEq(links.length, 1);
        assertEq(links[0], "https://github.com/test");
        
        vm.stopPrank();
    }
    
    function test_UpdateStatistics() public {
        vm.startPrank(creator);
        
        vm.expectEmit(true, true, true, true);
        emit StatisticsUpdated(1000, 5000);
        channel.updateStatistics(1000, 5000);
        
        assertEq(channel.subscribers(), 1000);
        assertEq(channel.totalViews(), 5000);
        
        vm.stopPrank();
    }
    
    function test_TradingFees() public {
        address buyer = makeAddr("buyer");
        vm.deal(buyer, 100 ether);
        
        // Creator transfers tokens to buyer
        vm.prank(creator);
        channel.transfer(buyer, 1000 ether);
        
        uint256 initialCreatorBalance = channel.balanceOf(creator);
        uint256 initialBuyerBalance = channel.balanceOf(buyer);
        
        // Buyer transfers tokens
        vm.prank(buyer);
        channel.transfer(makeAddr("recipient"), 100 ether);
        
        // Check fee was taken and sent to creator
        uint256 expectedFee = channel.calculateTradingFee(100 ether);
        assertEq(
            channel.balanceOf(creator),
            initialCreatorBalance + expectedFee
        );
        assertEq(
            channel.balanceOf(buyer),
            initialBuyerBalance - 100 ether
        );
    }
    
    function test_RevertWhenUnauthorized() public {
        address unauthorized = makeAddr("unauthorized");
        vm.startPrank(unauthorized);
        
        vm.expectRevert("Ownable: caller is not the owner");
        channel.updateChannelMetadata(
            "Unauthorized",
            "Unauthorized",
            "",
            ""
        );
        
        vm.expectRevert("Ownable: caller is not the owner");
        channel.addSocialLink("https://test.com");
        
        vm.expectRevert("Ownable: caller is not the owner");
        channel.updateStatistics(100, 100);
        
        vm.stopPrank();
    }
    
    function test_FactorySymbolValidation() public {
        // Create first channel
        vm.prank(creator);
        factory.createChannel(
            "First Channel",
            "FIRST",
            1000000 ether,
            "First Description",
            "Technology"
        );
        
        // Try to create channel with same symbol
        vm.prank(creator);
        vm.expectRevert("Symbol already exists");
        factory.createChannel(
            "Second Channel",
            "FIRST",
            1000000 ether,
            "Second Description",
            "Technology"
        );
    }
}