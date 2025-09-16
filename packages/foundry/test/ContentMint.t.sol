// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {ContentMint} from "../contracts/ContentMint.sol";
import {ContentFactory} from "../contracts/ContentFactory.sol";

contract ContentMintTest is Test {
    ContentMint public content;
    ContentFactory public factory;
    address public creator;
    
    event ContentUpdated(
        string contentURI,
        string description,
        string license
    );
    event StatisticsUpdated(uint256 views, uint256 likes);
    event AccessGranted(address user);
    event AccessRevoked(address user);
    
    function setUp() public {
        creator = makeAddr("creator");
        vm.startPrank(creator);
        
        // Deploy factory
        factory = new ContentFactory();
        
        // Create content through factory
        address contentAddress = factory.createContent(
            "Test Content",
            "TEST",
            1000000 ether,
            "mp4",
            "ipfs://content",
            "Test Description",
            "All Rights Reserved",
            300, // 5 minutes duration
            "0x1234567890" // content hash
        );
        
        content = ContentMint(contentAddress);
        vm.stopPrank();
    }
    
    function test_ContentInitialization() public {
        assertEq(content.name(), "Test Content");
        assertEq(content.symbol(), "TEST");
        assertEq(content.contentType(), "mp4");
        assertEq(content.contentURI(), "ipfs://content");
        assertEq(content.description(), "Test Description");
        assertEq(content.license(), "All Rights Reserved");
        assertEq(content.duration(), 300);
        assertEq(content.contentHash(), "0x1234567890");
        assertEq(content.balanceOf(creator), 1000000 ether);
        assertTrue(content.hasAccess(creator));
    }
    
    function test_UpdateContentMetadata() public {
        vm.startPrank(creator);
        
        vm.expectEmit(true, true, true, true);
        emit ContentUpdated(
            "ipfs://newcontent",
            "New Description",
            "Creative Commons"
        );
        
        content.updateContentMetadata(
            "ipfs://newcontent",
            "New Description",
            "Creative Commons"
        );
        
        assertEq(content.contentURI(), "ipfs://newcontent");
        assertEq(content.description(), "New Description");
        assertEq(content.license(), "Creative Commons");
        
        vm.stopPrank();
    }
    
    function test_UpdateStatistics() public {
        vm.startPrank(creator);
        
        vm.expectEmit(true, true, true, true);
        emit StatisticsUpdated(1000, 500);
        content.updateStatistics(1000, 500);
        
        assertEq(content.views(), 1000);
        assertEq(content.likes(), 500);
        
        vm.stopPrank();
    }
    
    function test_AccessControl() public {
        address user = makeAddr("user");
        
        // Initially, user should not have access
        assertFalse(content.hasAccess(user));
        
        // Creator grants access
        vm.startPrank(creator);
        vm.expectEmit(true, true, true, true);
        emit AccessGranted(user);
        content.grantAccess(user);
        
        assertTrue(content.hasAccess(user));
        
        // Creator revokes access
        vm.expectEmit(true, true, true, true);
        emit AccessRevoked(user);
        content.revokeAccess(user);
        
        assertFalse(content.hasAccess(user));
        vm.stopPrank();
    }
    
    function test_TradingFeesAndAccess() public {
        address buyer = makeAddr("buyer");
        vm.deal(buyer, 100 ether);
        
        // Initially buyer has no access
        assertFalse(content.hasAccess(buyer));
        
        // Creator transfers tokens to buyer
        vm.prank(creator);
        content.transfer(buyer, 1000 ether);
        
        // Buyer should now have access
        assertTrue(content.hasAccess(buyer));
        
        uint256 initialCreatorBalance = content.balanceOf(creator);
        uint256 initialBuyerBalance = content.balanceOf(buyer);
        
        // Buyer transfers tokens
        vm.prank(buyer);
        address recipient = makeAddr("recipient");
        content.transfer(recipient, 100 ether);
        
        // Check fee was taken and sent to creator
        uint256 expectedFee = content.calculateTradingFee(100 ether);
        assertEq(
            content.balanceOf(creator),
            initialCreatorBalance + expectedFee
        );
        assertEq(
            content.balanceOf(buyer),
            initialBuyerBalance - 100 ether
        );
        
        // Recipient should have access
        assertTrue(content.hasAccess(recipient));
    }
    
    function test_RevertWhenUnauthorized() public {
        address unauthorized = makeAddr("unauthorized");
        vm.startPrank(unauthorized);
        
        vm.expectRevert("Ownable: caller is not the owner");
        content.updateContentMetadata(
            "ipfs://unauthorized",
            "Unauthorized",
            "Unauthorized"
        );
        
        vm.expectRevert("Ownable: caller is not the owner");
        content.updateStatistics(100, 100);
        
        vm.expectRevert("Ownable: caller is not the owner");
        content.grantAccess(unauthorized);
        
        vm.stopPrank();
    }
    
    function test_FactoryContentTypeValidation() public {
        // Try to create content with invalid type
        vm.prank(creator);
        vm.expectRevert("Invalid content type");
        factory.createContent(
            "Invalid Content",
            "INVALID",
            1000000 ether,
            "invalid",
            "ipfs://content",
            "Description",
            "License",
            0,
            "0x1234"
        );
    }
    
    function test_FactorySymbolValidation() public {
        // Create first content
        vm.prank(creator);
        factory.createContent(
            "First Content",
            "FIRST",
            1000000 ether,
            "mp4",
            "ipfs://first",
            "First Description",
            "License",
            0,
            "0x1234"
        );
        
        // Try to create content with same symbol
        vm.prank(creator);
        vm.expectRevert("Symbol already exists");
        factory.createContent(
            "Second Content",
            "FIRST",
            1000000 ether,
            "mp4",
            "ipfs://second",
            "Second Description",
            "License",
            0,
            "0x5678"
        );
    }
}