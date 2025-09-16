// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {ChannelFactory} from "../contracts/ChannelFactory.sol";
import {ContentFactory} from "../contracts/ContentFactory.sol";

/**
 * @title VerifyFactories
 * @dev Script to verify Channel and Content factory contracts on block explorers
 */
contract VerifyFactories is Script {
    function run() public {
        string memory chainName = vm.envString("CHAIN_NAME");
        address channelFactoryAddress = vm.envAddress("CHANNEL_FACTORY_ADDRESS");
        address contentFactoryAddress = vm.envAddress("CONTENT_FACTORY_ADDRESS");

        // Get API key for the block explorer (e.g., Etherscan)
        string memory explorerApiKey = vm.envString("EXPLORER_API_KEY");

        // Verify ChannelFactory
        string[] memory channelVerifyArgs = new string[](7);
        channelVerifyArgs[0] = "verify-contract";
        channelVerifyArgs[1] = vm.toString(channelFactoryAddress);
        channelVerifyArgs[2] = "contracts/ChannelFactory.sol:ChannelFactory";
        channelVerifyArgs[3] = "--chain";
        channelVerifyArgs[4] = chainName;
        channelVerifyArgs[5] = "--api-key";
        channelVerifyArgs[6] = explorerApiKey;

        vm.ffi(channelVerifyArgs);

        // Verify ContentFactory
        string[] memory contentVerifyArgs = new string[](7);
        contentVerifyArgs[0] = "verify-contract";
        contentVerifyArgs[1] = vm.toString(contentFactoryAddress);
        contentVerifyArgs[2] = "contracts/ContentFactory.sol:ContentFactory";
        contentVerifyArgs[3] = "--chain";
        contentVerifyArgs[4] = chainName;
        contentVerifyArgs[5] = "--api-key";
        contentVerifyArgs[6] = explorerApiKey;

        vm.ffi(contentVerifyArgs);

        console.log("Verification complete for:");
        console.log("ChannelFactory:", channelFactoryAddress);
        console.log("ContentFactory:", contentFactoryAddress);
    }
}