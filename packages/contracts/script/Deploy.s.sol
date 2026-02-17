// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {PaymentEscrow} from "../src/PaymentEscrow.sol";
import {StrategyVault} from "../src/StrategyVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Deploy
/// @notice Deploys all core Meridian contracts to any EVM-compatible chain.
/// @dev Usage:
///   forge script script/Deploy.s.sol:Deploy \
///     --rpc-url $RPC_URL \
///     --private-key $DEPLOYER_PRIVATE_KEY \
///     --broadcast \
///     --verify
///
///   Required environment variables:
///     DEPLOYER           - Address of the deployer / initial owner
///     ORACLE_ADDRESS     - Reputation oracle for AgentRegistry
///     ARBITER_ADDRESS    - Dispute arbiter for PaymentEscrow
///     VAULT_ASSET        - ERC-20 token address for the Strategy Vault underlying
///     AGENT_ADDRESS      - Initial authorized agent for the Strategy Vault
///
///   Optional:
///     FEE_RATE           - PaymentEscrow fee rate in bps (default: 250 = 2.5%)
///     MAX_TX_VALUE       - StrategyVault max tx value (default: 10 ether)
///     DAILY_LIMIT        - StrategyVault daily limit (default: 50 ether)
contract Deploy is Script {
    function run()
        external
        returns (AgentRegistry registry, PaymentEscrow escrow, StrategyVault vault)
    {
        // ── Read configuration from environment ──────────────────────────────
        address deployer = vm.envAddress("DEPLOYER");
        address oracleAddr = vm.envAddress("ORACLE_ADDRESS");
        address arbiterAddr = vm.envAddress("ARBITER_ADDRESS");
        address vaultAsset = vm.envAddress("VAULT_ASSET");
        address agentAddr = vm.envAddress("AGENT_ADDRESS");

        uint256 feeRate = vm.envOr("FEE_RATE", uint256(250));
        uint256 maxTxValue = vm.envOr("MAX_TX_VALUE", uint256(10 ether));
        uint256 dailyLimit = vm.envOr("DAILY_LIMIT", uint256(50 ether));

        // ── Deploy ───────────────────────────────────────────────────────────
        vm.startBroadcast(deployer);

        // 1. AgentRegistry
        registry = new AgentRegistry(deployer, oracleAddr);
        console2.log("AgentRegistry deployed at:", address(registry));

        // 2. PaymentEscrow
        escrow = new PaymentEscrow(deployer, arbiterAddr, feeRate);
        console2.log("PaymentEscrow deployed at:", address(escrow));

        // 3. StrategyVault
        vault = new StrategyVault(
            IERC20(vaultAsset),
            "Meridian Strategy Vault",
            "mVAULT",
            deployer,
            agentAddr,
            maxTxValue,
            dailyLimit
        );
        console2.log("StrategyVault deployed at:", address(vault));

        vm.stopBroadcast();

        // ── Summary ──────────────────────────────────────────────────────────
        console2.log("---");
        console2.log("Deployment complete.");
        console2.log("  Owner:    ", deployer);
        console2.log("  Oracle:   ", oracleAddr);
        console2.log("  Arbiter:  ", arbiterAddr);
        console2.log("  Agent:    ", agentAddr);
        console2.log("  FeeRate:  ", feeRate, "bps");
    }
}
