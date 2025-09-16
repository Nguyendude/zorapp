// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {ChannelFactory} from "../contracts/ChannelFactory.sol";
import {ContentFactory} from "../contracts/ContentFactory.sol";

/**
 * @title DeployFactories
 * @dev Deployment script for Channel and Content factories
 */
contract DeployFactories is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy factories
        ChannelFactory channelFactory = new ChannelFactory();
        ContentFactory contentFactory = new ContentFactory();

        console.log("ChannelFactory deployed at:", address(channelFactory));
        console.log("ContentFactory deployed at:", address(contentFactory));

        vm.stopBroadcast();
    }
}