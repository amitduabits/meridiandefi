// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {PaymentEscrow} from "../src/PaymentEscrow.sol";
import {StrategyVault} from "../src/StrategyVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Minimal ERC-20 deployed as a mock asset on testnets.
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @title DeployTestnet
/// @notice Deploys all Meridian contracts to Arbitrum Sepolia or Ethereum Sepolia,
///         including a mock USDC token for testing.
/// @dev Usage:
///
///   Arbitrum Sepolia:
///     forge script script/DeployTestnet.s.sol:DeployTestnet \
///       --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
///       --private-key $DEPLOYER_PRIVATE_KEY \
///       --broadcast \
///       --verify \
///       --etherscan-api-key $ARBISCAN_API_KEY
///
///   Ethereum Sepolia:
///     forge script script/DeployTestnet.s.sol:DeployTestnet \
///       --rpc-url https://rpc.sepolia.org \
///       --private-key $DEPLOYER_PRIVATE_KEY \
///       --broadcast \
///       --verify \
///       --etherscan-api-key $ETHERSCAN_API_KEY
///
///   The deployer's address is used as owner, oracle, arbiter, AND initial agent
///   for convenience during testnet development. Override with env vars as needed.
contract DeployTestnet is Script {
    function run()
        external
        returns (
            MockUSDC mockToken,
            AgentRegistry registry,
            PaymentEscrow escrow,
            StrategyVault vault
        )
    {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Allow overrides for testnet roles; default to deployer
        address oracleAddr = vm.envOr("ORACLE_ADDRESS", deployer);
        address arbiterAddr = vm.envOr("ARBITER_ADDRESS", deployer);
        address agentAddr = vm.envOr("AGENT_ADDRESS", deployer);

        uint256 feeRate = vm.envOr("FEE_RATE", uint256(250));
        uint256 maxTxValue = vm.envOr("MAX_TX_VALUE", uint256(10 ether));
        uint256 dailyLimit = vm.envOr("DAILY_LIMIT", uint256(50 ether));

        console2.log("Deploying Meridian testnet suite...");
        console2.log("  Deployer:", deployer);
        console2.log("  Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // ── 1. Deploy mock USDC ──────────────────────────────────────────────
        mockToken = new MockUSDC();
        console2.log("MockUSDC deployed at:", address(mockToken));

        // ── 2. AgentRegistry ─────────────────────────────────────────────────
        registry = new AgentRegistry(deployer, oracleAddr);
        console2.log("AgentRegistry deployed at:", address(registry));

        // ── 3. PaymentEscrow ─────────────────────────────────────────────────
        escrow = new PaymentEscrow(deployer, arbiterAddr, feeRate);
        console2.log("PaymentEscrow deployed at:", address(escrow));

        // ── 4. StrategyVault ─────────────────────────────────────────────────
        vault = new StrategyVault(
            IERC20(address(mockToken)),
            "Meridian Strategy Vault (Testnet)",
            "mVAULT-T",
            deployer,
            agentAddr,
            maxTxValue,
            dailyLimit
        );
        console2.log("StrategyVault deployed at:", address(vault));

        vm.stopBroadcast();

        // ── Summary ──────────────────────────────────────────────────────────
        console2.log("---");
        console2.log("Testnet deployment complete!");
        console2.log("  MockUSDC:       ", address(mockToken));
        console2.log("  AgentRegistry:  ", address(registry));
        console2.log("  PaymentEscrow:  ", address(escrow));
        console2.log("  StrategyVault:  ", address(vault));
    }
}
