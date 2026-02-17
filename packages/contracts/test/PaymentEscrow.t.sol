// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {PaymentEscrow} from "../src/PaymentEscrow.sol";
import {IPaymentEscrow} from "../src/interfaces/IPaymentEscrow.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Simple mock ERC-20 for testing.
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @title PaymentEscrowTest
/// @notice Full lifecycle tests: create->fund->release, dispute->resolve,
///         claim after deadline, fee handling, and access control.
contract PaymentEscrowTest is Test {
    // ──────────────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────────────

    PaymentEscrow public escrow;
    MockERC20 public token;

    address public owner = makeAddr("owner");
    address public arbiter = makeAddr("arbiter");
    address public client = makeAddr("client");
    address public provider = makeAddr("provider");

    uint256 public constant AMOUNT = 1000 ether;
    uint256 public constant FEE_RATE = 250; // 2.5%
    bytes32 public constant TASK_ID = keccak256("task-1");

    // ──────────────────────────────────────────────────────────────────────────
    // Setup
    // ──────────────────────────────────────────────────────────────────────────

    function setUp() public {
        escrow = new PaymentEscrow(owner, arbiter, FEE_RATE);
        token = new MockERC20();

        // Fund client
        token.mint(client, 10_000 ether);

        // Client approves escrow
        vm.prank(client);
        token.approve(address(escrow), type(uint256).max);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    function _createDefaultEscrow() internal returns (uint256) {
        vm.prank(client);
        return escrow.createEscrow(TASK_ID, provider, address(token), AMOUNT, block.timestamp + 7 days);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Create Escrow
    // ──────────────────────────────────────────────────────────────────────────

    function test_createEscrow_success() public {
        uint256 escrowId = _createDefaultEscrow();

        assertEq(escrowId, 1);
        assertEq(token.balanceOf(address(escrow)), AMOUNT);

        IPaymentEscrow.Escrow memory e = escrow.getEscrow(escrowId);
        assertEq(e.taskId, TASK_ID);
        assertEq(e.client, client);
        assertEq(e.provider, provider);
        assertEq(e.token, address(token));
        assertEq(e.amount, AMOUNT);
        assertEq(uint8(e.state), uint8(IPaymentEscrow.EscrowState.FUNDED));
    }

    function test_createEscrow_emitsEvent() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.expectEmit(true, true, true, true);
        emit IPaymentEscrow.EscrowCreated(1, TASK_ID, client, provider, address(token), AMOUNT, deadline);

        vm.prank(client);
        escrow.createEscrow(TASK_ID, provider, address(token), AMOUNT, deadline);
    }

    function test_createEscrow_revertsZeroProvider() public {
        vm.prank(client);
        vm.expectRevert(IPaymentEscrow.ZeroAddress.selector);
        escrow.createEscrow(TASK_ID, address(0), address(token), AMOUNT, block.timestamp + 1 days);
    }

    function test_createEscrow_revertsZeroToken() public {
        vm.prank(client);
        vm.expectRevert(IPaymentEscrow.ZeroAddress.selector);
        escrow.createEscrow(TASK_ID, provider, address(0), AMOUNT, block.timestamp + 1 days);
    }

    function test_createEscrow_revertsZeroAmount() public {
        vm.prank(client);
        vm.expectRevert(IPaymentEscrow.ZeroAmount.selector);
        escrow.createEscrow(TASK_ID, provider, address(token), 0, block.timestamp + 1 days);
    }

    function test_createEscrow_revertsDeadlinePassed() public {
        vm.prank(client);
        vm.expectRevert(IPaymentEscrow.DeadlinePassed.selector);
        escrow.createEscrow(TASK_ID, provider, address(token), AMOUNT, block.timestamp - 1);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Release Escrow (happy path)
    // ──────────────────────────────────────────────────────────────────────────

    function test_releaseEscrow_success() public {
        uint256 escrowId = _createDefaultEscrow();

        uint256 expectedFee = (AMOUNT * FEE_RATE) / 10_000;
        uint256 expectedPayout = AMOUNT - expectedFee;

        uint256 providerBefore = token.balanceOf(provider);

        vm.prank(client);
        escrow.releaseEscrow(escrowId);

        assertEq(token.balanceOf(provider), providerBefore + expectedPayout);
        assertEq(escrow.accumulatedFees(address(token)), expectedFee);

        IPaymentEscrow.Escrow memory e = escrow.getEscrow(escrowId);
        assertEq(uint8(e.state), uint8(IPaymentEscrow.EscrowState.RELEASED));
    }

    function test_releaseEscrow_emitsEvent() public {
        uint256 escrowId = _createDefaultEscrow();
        uint256 expectedPayout = AMOUNT - (AMOUNT * FEE_RATE) / 10_000;

        vm.expectEmit(true, true, false, true);
        emit IPaymentEscrow.EscrowReleased(escrowId, provider, expectedPayout);

        vm.prank(client);
        escrow.releaseEscrow(escrowId);
    }

    function test_releaseEscrow_revertsNotClient() public {
        uint256 escrowId = _createDefaultEscrow();

        vm.prank(provider);
        vm.expectRevert(abi.encodeWithSelector(IPaymentEscrow.NotClient.selector, escrowId, provider));
        escrow.releaseEscrow(escrowId);
    }

    function test_releaseEscrow_revertsWrongState() public {
        uint256 escrowId = _createDefaultEscrow();

        // Release once
        vm.prank(client);
        escrow.releaseEscrow(escrowId);

        // Try again — state is now RELEASED, not FUNDED
        vm.prank(client);
        vm.expectRevert(
            abi.encodeWithSelector(
                IPaymentEscrow.InvalidState.selector,
                escrowId,
                IPaymentEscrow.EscrowState.RELEASED,
                IPaymentEscrow.EscrowState.FUNDED
            )
        );
        escrow.releaseEscrow(escrowId);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Claim After Deadline
    // ──────────────────────────────────────────────────────────────────────────

    function test_claimEscrow_success() public {
        uint256 escrowId = _createDefaultEscrow();

        // Fast-forward past deadline
        vm.warp(block.timestamp + 8 days);

        uint256 expectedFee = (AMOUNT * FEE_RATE) / 10_000;
        uint256 expectedPayout = AMOUNT - expectedFee;

        vm.prank(provider);
        escrow.claimEscrow(escrowId);

        assertEq(token.balanceOf(provider), expectedPayout);

        IPaymentEscrow.Escrow memory e = escrow.getEscrow(escrowId);
        assertEq(uint8(e.state), uint8(IPaymentEscrow.EscrowState.CLAIMED));
    }

    function test_claimEscrow_revertsBeforeDeadline() public {
        uint256 escrowId = _createDefaultEscrow();

        IPaymentEscrow.Escrow memory e = escrow.getEscrow(escrowId);

        vm.prank(provider);
        vm.expectRevert(abi.encodeWithSelector(IPaymentEscrow.DeadlineNotReached.selector, escrowId, e.deadline));
        escrow.claimEscrow(escrowId);
    }

    function test_claimEscrow_revertsNotProvider() public {
        uint256 escrowId = _createDefaultEscrow();

        vm.warp(block.timestamp + 8 days);

        vm.prank(client);
        vm.expectRevert(abi.encodeWithSelector(IPaymentEscrow.NotProvider.selector, escrowId, client));
        escrow.claimEscrow(escrowId);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Dispute -> Resolve
    // ──────────────────────────────────────────────────────────────────────────

    function test_disputeEscrow_success() public {
        uint256 escrowId = _createDefaultEscrow();

        vm.prank(client);
        escrow.disputeEscrow(escrowId);

        IPaymentEscrow.Escrow memory e = escrow.getEscrow(escrowId);
        assertEq(uint8(e.state), uint8(IPaymentEscrow.EscrowState.DISPUTED));
    }

    function test_disputeEscrow_emitsEvent() public {
        uint256 escrowId = _createDefaultEscrow();

        vm.expectEmit(true, true, false, false);
        emit IPaymentEscrow.EscrowDisputed(escrowId, client);

        vm.prank(client);
        escrow.disputeEscrow(escrowId);
    }

    function test_disputeEscrow_revertsNotClient() public {
        uint256 escrowId = _createDefaultEscrow();

        vm.prank(provider);
        vm.expectRevert(abi.encodeWithSelector(IPaymentEscrow.NotClient.selector, escrowId, provider));
        escrow.disputeEscrow(escrowId);
    }

    function test_resolveDispute_success() public {
        uint256 escrowId = _createDefaultEscrow();

        vm.prank(client);
        escrow.disputeEscrow(escrowId);

        uint256 clientAmount = 400 ether;
        uint256 providerAmount = 600 ether;

        uint256 clientBefore = token.balanceOf(client);
        uint256 providerBefore = token.balanceOf(provider);

        vm.prank(arbiter);
        escrow.resolveDispute(escrowId, clientAmount, providerAmount);

        assertEq(token.balanceOf(client), clientBefore + clientAmount);
        assertEq(token.balanceOf(provider), providerBefore + providerAmount);

        IPaymentEscrow.Escrow memory e = escrow.getEscrow(escrowId);
        assertEq(uint8(e.state), uint8(IPaymentEscrow.EscrowState.SETTLED));
    }

    function test_resolveDispute_emitsEvent() public {
        uint256 escrowId = _createDefaultEscrow();

        vm.prank(client);
        escrow.disputeEscrow(escrowId);

        vm.expectEmit(true, false, false, true);
        emit IPaymentEscrow.DisputeResolved(escrowId, 500 ether, 500 ether, arbiter);

        vm.prank(arbiter);
        escrow.resolveDispute(escrowId, 500 ether, 500 ether);
    }

    function test_resolveDispute_revertsNotArbiter() public {
        uint256 escrowId = _createDefaultEscrow();

        vm.prank(client);
        escrow.disputeEscrow(escrowId);

        vm.prank(client);
        vm.expectRevert(abi.encodeWithSelector(IPaymentEscrow.NotArbiter.selector, client));
        escrow.resolveDispute(escrowId, 500 ether, 500 ether);
    }

    function test_resolveDispute_revertsInvalidSplit() public {
        uint256 escrowId = _createDefaultEscrow();

        vm.prank(client);
        escrow.disputeEscrow(escrowId);

        vm.prank(arbiter);
        vm.expectRevert(
            abi.encodeWithSelector(IPaymentEscrow.InvalidSplit.selector, 500 ether, 600 ether, AMOUNT)
        );
        escrow.resolveDispute(escrowId, 500 ether, 600 ether);
    }

    function test_resolveDispute_revertsNotDisputed() public {
        uint256 escrowId = _createDefaultEscrow();

        vm.prank(arbiter);
        vm.expectRevert(
            abi.encodeWithSelector(
                IPaymentEscrow.InvalidState.selector,
                escrowId,
                IPaymentEscrow.EscrowState.FUNDED,
                IPaymentEscrow.EscrowState.DISPUTED
            )
        );
        escrow.resolveDispute(escrowId, 500 ether, 500 ether);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Admin
    // ──────────────────────────────────────────────────────────────────────────

    function test_setArbiter_success() public {
        address newArbiter = makeAddr("newArbiter");

        vm.prank(owner);
        escrow.setArbiter(newArbiter);

        assertEq(escrow.arbiter(), newArbiter);
    }

    function test_setFeeRate_success() public {
        vm.prank(owner);
        escrow.setFeeRate(500);

        assertEq(escrow.feeRate(), 500);
    }

    function test_setFeeRate_revertsTooHigh() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IPaymentEscrow.FeeRateTooHigh.selector, 1001));
        escrow.setFeeRate(1001);
    }

    function test_withdrawFees_success() public {
        // Create and release an escrow to accumulate fees
        uint256 escrowId = _createDefaultEscrow();
        vm.prank(client);
        escrow.releaseEscrow(escrowId);

        uint256 expectedFee = (AMOUNT * FEE_RATE) / 10_000;
        assertGt(expectedFee, 0);

        address treasury = makeAddr("treasury");

        vm.prank(owner);
        escrow.withdrawFees(address(token), treasury);

        assertEq(token.balanceOf(treasury), expectedFee);
        assertEq(escrow.accumulatedFees(address(token)), 0);
    }
}
