// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {StrategyVault} from "../src/StrategyVault.sol";
import {IStrategyVault} from "../src/interfaces/IStrategyVault.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev Simple mock ERC-20 for testing vault deposits.
contract MockAsset is ERC20 {
    constructor() ERC20("Mock Asset", "MASSET") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @dev Mock protocol target that just accepts calls and optionally stores ETH value received.
contract MockProtocol {
    uint256 public lastValue;
    bytes public lastCalldata;

    fallback() external payable {
        lastValue = msg.value;
        lastCalldata = msg.data;
    }

    receive() external payable {}
}

/// @dev Mock protocol that always reverts.
contract RevertingProtocol {
    fallback() external payable {
        revert("mock revert");
    }
}

/// @title StrategyVaultTest
/// @notice Tests for deposit, withdraw, agent execution, emergency withdrawal,
///         protocol management, daily/tx limits, and agent timelock.
contract StrategyVaultTest is Test {
    // ──────────────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────────────

    StrategyVault public vault;
    MockAsset public asset;
    MockProtocol public protocol;
    RevertingProtocol public revertingProtocol;

    address public owner = makeAddr("owner");
    address public agentAddr = makeAddr("agent");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant MAX_TX = 10 ether;
    uint256 public constant DAILY_LIMIT = 50 ether;
    uint256 public constant DEPOSIT_AMOUNT = 100 ether;

    // ──────────────────────────────────────────────────────────────────────────
    // Setup
    // ──────────────────────────────────────────────────────────────────────────

    function setUp() public {
        asset = new MockAsset();
        protocol = new MockProtocol();
        revertingProtocol = new RevertingProtocol();

        vault = new StrategyVault(
            IERC20(address(asset)),
            "Meridian Strategy Vault",
            "mVAULT",
            owner,
            agentAddr,
            MAX_TX,
            DAILY_LIMIT
        );

        // Approve protocol
        vm.prank(owner);
        vault.approveProtocol(address(protocol));

        // Fund alice and approve vault
        asset.mint(alice, 1_000 ether);
        vm.prank(alice);
        asset.approve(address(vault), type(uint256).max);

        // Fund bob and approve vault
        asset.mint(bob, 1_000 ether);
        vm.prank(bob);
        asset.approve(address(vault), type(uint256).max);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Deposit / Withdraw (ERC-4626)
    // ──────────────────────────────────────────────────────────────────────────

    function test_deposit_success() public {
        vm.prank(alice);
        uint256 shares = vault.deposit(DEPOSIT_AMOUNT, alice);

        assertGt(shares, 0);
        assertEq(asset.balanceOf(address(vault)), DEPOSIT_AMOUNT);
        assertEq(vault.balanceOf(alice), shares);
    }

    function test_withdraw_success() public {
        vm.prank(alice);
        vault.deposit(DEPOSIT_AMOUNT, alice);

        uint256 sharesBefore = vault.balanceOf(alice);

        vm.prank(alice);
        uint256 assetsReturned = vault.redeem(sharesBefore, alice, alice);

        assertEq(assetsReturned, DEPOSIT_AMOUNT);
        assertEq(asset.balanceOf(alice), 1_000 ether); // back to original
        assertEq(vault.balanceOf(alice), 0);
    }

    function test_multipleDepositors() public {
        vm.prank(alice);
        vault.deposit(DEPOSIT_AMOUNT, alice);

        vm.prank(bob);
        vault.deposit(DEPOSIT_AMOUNT, bob);

        assertEq(asset.balanceOf(address(vault)), 2 * DEPOSIT_AMOUNT);
        assertGt(vault.balanceOf(alice), 0);
        assertGt(vault.balanceOf(bob), 0);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Agent Execution
    // ──────────────────────────────────────────────────────────────────────────

    function test_executeStrategy_success() public {
        // Fund the vault with some ETH for strategy calls
        vm.deal(address(vault), 100 ether);

        address[] memory targets = new address[](1);
        targets[0] = address(protocol);

        uint256[] memory values = new uint256[](1);
        values[0] = 5 ether;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("doSomething()");

        vm.prank(agentAddr);
        vault.executeStrategy(targets, values, calldatas);

        assertEq(protocol.lastValue(), 5 ether);
    }

    function test_executeStrategy_revertsNotAgent() public {
        address[] memory targets = new address[](1);
        targets[0] = address(protocol);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IStrategyVault.NotAgent.selector, alice));
        vault.executeStrategy(targets, values, calldatas);
    }

    function test_executeStrategy_revertsUnapprovedProtocol() public {
        address unapproved = makeAddr("unapproved");

        address[] memory targets = new address[](1);
        targets[0] = unapproved;
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        vm.prank(agentAddr);
        vm.expectRevert(abi.encodeWithSelector(IStrategyVault.ProtocolNotApproved.selector, unapproved));
        vault.executeStrategy(targets, values, calldatas);
    }

    function test_executeStrategy_revertsExceedsMaxTxValue() public {
        vm.deal(address(vault), 100 ether);

        address[] memory targets = new address[](1);
        targets[0] = address(protocol);
        uint256[] memory values = new uint256[](1);
        values[0] = MAX_TX + 1;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        vm.prank(agentAddr);
        vm.expectRevert(abi.encodeWithSelector(IStrategyVault.ExceedsMaxTxValue.selector, MAX_TX + 1, MAX_TX));
        vault.executeStrategy(targets, values, calldatas);
    }

    function test_executeStrategy_revertsExceedsDailyLimit() public {
        vm.deal(address(vault), 100 ether);

        // Execute 5 transactions of MAX_TX each (5 * 10 = 50 = DAILY_LIMIT)
        for (uint256 i; i < 5; ++i) {
            address[] memory targets = new address[](1);
            targets[0] = address(protocol);
            uint256[] memory values = new uint256[](1);
            values[0] = MAX_TX;
            bytes[] memory calldatas = new bytes[](1);
            calldatas[0] = "";

            vm.prank(agentAddr);
            vault.executeStrategy(targets, values, calldatas);
        }

        // 6th should exceed daily limit
        address[] memory targets = new address[](1);
        targets[0] = address(protocol);
        uint256[] memory values = new uint256[](1);
        values[0] = 1 ether;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        vm.prank(agentAddr);
        vm.expectRevert(abi.encodeWithSelector(IStrategyVault.ExceedsDailyLimit.selector, 1 ether, 0));
        vault.executeStrategy(targets, values, calldatas);
    }

    function test_executeStrategy_dailyLimitResetsAfterOneDay() public {
        vm.deal(address(vault), 200 ether);

        // Exhaust daily limit
        for (uint256 i; i < 5; ++i) {
            address[] memory targets = new address[](1);
            targets[0] = address(protocol);
            uint256[] memory values = new uint256[](1);
            values[0] = MAX_TX;
            bytes[] memory calldatas = new bytes[](1);
            calldatas[0] = "";

            vm.prank(agentAddr);
            vault.executeStrategy(targets, values, calldatas);
        }

        // Warp 1 day forward
        vm.warp(block.timestamp + 1 days);

        // Should succeed again
        address[] memory targets = new address[](1);
        targets[0] = address(protocol);
        uint256[] memory values = new uint256[](1);
        values[0] = MAX_TX;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        vm.prank(agentAddr);
        vault.executeStrategy(targets, values, calldatas);
    }

    function test_executeStrategy_revertsOnFailedCall() public {
        vm.prank(owner);
        vault.approveProtocol(address(revertingProtocol));

        vm.deal(address(vault), 100 ether);

        address[] memory targets = new address[](1);
        targets[0] = address(revertingProtocol);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        vm.prank(agentAddr);
        vm.expectRevert(); // StrategyCallFailed
        vault.executeStrategy(targets, values, calldatas);
    }

    function test_executeStrategy_revertsEmptyCalldata() public {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);

        vm.prank(agentAddr);
        vm.expectRevert(IStrategyVault.EmptyCalldata.selector);
        vault.executeStrategy(targets, values, calldatas);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Emergency Withdraw
    // ──────────────────────────────────────────────────────────────────────────

    function test_emergencyWithdraw_success() public {
        vm.prank(alice);
        vault.deposit(DEPOSIT_AMOUNT, alice);

        address treasury = makeAddr("treasury");

        vm.prank(owner);
        vault.emergencyWithdraw(treasury);

        assertEq(asset.balanceOf(treasury), DEPOSIT_AMOUNT);
        assertEq(asset.balanceOf(address(vault)), 0);
    }

    function test_emergencyWithdraw_revertsNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.emergencyWithdraw(alice);
    }

    function test_emergencyWithdraw_revertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(IStrategyVault.ZeroAddress.selector);
        vault.emergencyWithdraw(address(0));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Agent Timelock
    // ──────────────────────────────────────────────────────────────────────────

    function test_setAgent_schedulesUpdate() public {
        address newAgent = makeAddr("newAgent");

        vm.prank(owner);
        vault.setAgent(newAgent);

        assertEq(vault.pendingAgent(), newAgent);
        assertEq(vault.agentEffectiveAt(), block.timestamp + vault.AGENT_TIMELOCK());
    }

    function test_finalizeAgentUpdate_success() public {
        address newAgent = makeAddr("newAgent");

        vm.prank(owner);
        vault.setAgent(newAgent);

        // Warp past timelock
        vm.warp(block.timestamp + vault.AGENT_TIMELOCK());

        vm.prank(owner);
        vault.finalizeAgentUpdate();

        assertEq(vault.agent(), newAgent);
        assertEq(vault.pendingAgent(), address(0));
    }

    function test_finalizeAgentUpdate_revertsBeforeTimelock() public {
        address newAgent = makeAddr("newAgent");

        vm.prank(owner);
        vault.setAgent(newAgent);

        // Don't warp — try immediately
        vm.prank(owner);
        vm.expectRevert(); // TimelockNotElapsed
        vault.finalizeAgentUpdate();
    }

    function test_finalizeAgentUpdate_revertsNoPending() public {
        vm.prank(owner);
        vm.expectRevert(IStrategyVault.NoPendingAgentUpdate.selector);
        vault.finalizeAgentUpdate();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Protocol Management
    // ──────────────────────────────────────────────────────────────────────────

    function test_approveProtocol_success() public {
        address newProto = makeAddr("newProtocol");

        vm.prank(owner);
        vault.approveProtocol(newProto);

        assertTrue(vault.isApprovedProtocol(newProto));
    }

    function test_approveProtocol_revertsAlreadyApproved() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(IStrategyVault.ProtocolAlreadyApproved.selector, address(protocol))
        );
        vault.approveProtocol(address(protocol));
    }

    function test_revokeProtocol_success() public {
        vm.prank(owner);
        vault.revokeProtocol(address(protocol));

        assertFalse(vault.isApprovedProtocol(address(protocol)));
    }

    function test_revokeProtocol_revertsNotApproved() public {
        address unknown = makeAddr("unknown");

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IStrategyVault.ProtocolNotCurrentlyApproved.selector, unknown));
        vault.revokeProtocol(unknown);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Limits
    // ──────────────────────────────────────────────────────────────────────────

    function test_setLimits_success() public {
        vm.prank(owner);
        vault.setLimits(20 ether, 100 ether);

        IStrategyVault.VaultLimits memory limits = vault.getLimits();
        assertEq(limits.maxTxValue, 20 ether);
        assertEq(limits.dailyLimit, 100 ether);
    }

    function test_setLimits_revertsNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.setLimits(1, 1);
    }
}
