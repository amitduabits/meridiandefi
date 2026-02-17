// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IPaymentEscrow} from "./interfaces/IPaymentEscrow.sol";

/// @title PaymentEscrow
/// @author Meridian Protocol
/// @notice Holds ERC-20 tokens in escrow for agent task payments. Supports a full
///         lifecycle: create -> fund -> release / dispute -> settle / claim.
/// @dev Uses SafeERC20 for all token transfers. Follows CEI pattern. Custom errors
///      for gas-efficient reverts.
contract PaymentEscrow is IPaymentEscrow, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ──────────────────────────────────────────────────────────────────────────
    // Constants
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Maximum fee rate: 10 % (1 000 basis points).
    uint256 public constant MAX_FEE_RATE = 1_000;

    /// @notice Basis-point denominator.
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // ──────────────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Auto-incrementing escrow ID counter.
    uint256 private _nextEscrowId;

    /// @notice Address authorized to resolve disputes.
    address public arbiter;

    /// @notice Platform fee rate in basis points.
    uint256 public feeRate;

    /// @notice Accumulated fees per token: token => amount.
    mapping(address => uint256) public accumulatedFees;

    /// @dev escrowId => Escrow
    mapping(uint256 => Escrow) private _escrows;

    // ──────────────────────────────────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────────────────────────────────

    /// @param initialOwner The contract owner.
    /// @param _arbiter     The initial dispute arbiter.
    /// @param _feeRate     The initial platform fee rate in basis points.
    constructor(address initialOwner, address _arbiter, uint256 _feeRate) Ownable(initialOwner) {
        if (_feeRate > MAX_FEE_RATE) revert FeeRateTooHigh(_feeRate);
        arbiter = _arbiter;
        feeRate = _feeRate;
        _nextEscrowId = 1;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────────────────────────────────

    /// @dev Reverts if caller is not the escrow client.
    modifier onlyClient(uint256 escrowId) {
        if (_escrows[escrowId].client != msg.sender) {
            revert NotClient(escrowId, msg.sender);
        }
        _;
    }

    /// @dev Reverts if caller is not the escrow provider.
    modifier onlyProvider(uint256 escrowId) {
        if (_escrows[escrowId].provider != msg.sender) {
            revert NotProvider(escrowId, msg.sender);
        }
        _;
    }

    /// @dev Reverts if caller is not the arbiter.
    modifier onlyArbiter() {
        if (msg.sender != arbiter) revert NotArbiter(msg.sender);
        _;
    }

    /// @dev Reverts if the escrow is not in the expected state.
    modifier inState(uint256 escrowId, EscrowState expected) {
        EscrowState current = _escrows[escrowId].state;
        if (current != expected) {
            revert InvalidState(escrowId, current, expected);
        }
        _;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Lifecycle
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IPaymentEscrow
    function createEscrow(bytes32 taskId, address provider, address token, uint256 amount, uint256 deadline)
        external
        nonReentrant
        returns (uint256 escrowId)
    {
        // Checks
        if (provider == address(0)) revert ZeroAddress();
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (deadline <= block.timestamp) revert DeadlinePassed();

        // Effects
        escrowId = _nextEscrowId++;

        _escrows[escrowId] = Escrow({
            taskId: taskId,
            client: msg.sender,
            provider: provider,
            token: token,
            amount: amount,
            deadline: deadline,
            state: EscrowState.FUNDED,
            createdAt: block.timestamp
        });

        // Interactions — pull tokens from the client
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit EscrowCreated(escrowId, taskId, msg.sender, provider, token, amount, deadline);
    }

    /// @inheritdoc IPaymentEscrow
    function releaseEscrow(uint256 escrowId)
        external
        nonReentrant
        onlyClient(escrowId)
        inState(escrowId, EscrowState.FUNDED)
    {
        Escrow storage escrow = _escrows[escrowId];

        // Effects
        escrow.state = EscrowState.RELEASED;

        // Calculate fee
        uint256 fee = (escrow.amount * feeRate) / BPS_DENOMINATOR;
        uint256 payout = escrow.amount - fee;
        if (fee > 0) {
            accumulatedFees[escrow.token] += fee;
        }

        // Interactions
        IERC20(escrow.token).safeTransfer(escrow.provider, payout);

        emit EscrowReleased(escrowId, escrow.provider, payout);
    }

    /// @inheritdoc IPaymentEscrow
    function claimEscrow(uint256 escrowId)
        external
        nonReentrant
        onlyProvider(escrowId)
        inState(escrowId, EscrowState.FUNDED)
    {
        Escrow storage escrow = _escrows[escrowId];

        // Checks
        if (block.timestamp < escrow.deadline) {
            revert DeadlineNotReached(escrowId, escrow.deadline);
        }

        // Effects
        escrow.state = EscrowState.CLAIMED;

        // Calculate fee
        uint256 fee = (escrow.amount * feeRate) / BPS_DENOMINATOR;
        uint256 payout = escrow.amount - fee;
        if (fee > 0) {
            accumulatedFees[escrow.token] += fee;
        }

        // Interactions
        IERC20(escrow.token).safeTransfer(escrow.provider, payout);

        emit EscrowClaimed(escrowId, escrow.provider, payout);
    }

    /// @inheritdoc IPaymentEscrow
    function disputeEscrow(uint256 escrowId)
        external
        onlyClient(escrowId)
        inState(escrowId, EscrowState.FUNDED)
    {
        // Effects
        _escrows[escrowId].state = EscrowState.DISPUTED;

        emit EscrowDisputed(escrowId, msg.sender);
    }

    /// @inheritdoc IPaymentEscrow
    function resolveDispute(uint256 escrowId, uint256 clientAmount, uint256 providerAmount)
        external
        nonReentrant
        onlyArbiter
        inState(escrowId, EscrowState.DISPUTED)
    {
        Escrow storage escrow = _escrows[escrowId];

        // Checks
        if (clientAmount + providerAmount != escrow.amount) {
            revert InvalidSplit(clientAmount, providerAmount, escrow.amount);
        }

        // Effects
        escrow.state = EscrowState.SETTLED;

        // Interactions
        if (clientAmount > 0) {
            IERC20(escrow.token).safeTransfer(escrow.client, clientAmount);
        }
        if (providerAmount > 0) {
            IERC20(escrow.token).safeTransfer(escrow.provider, providerAmount);
        }

        emit DisputeResolved(escrowId, clientAmount, providerAmount, msg.sender);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Views
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IPaymentEscrow
    function getEscrow(uint256 escrowId) external view returns (Escrow memory escrow) {
        escrow = _escrows[escrowId];
    }

    /// @notice Returns the total number of escrows ever created.
    function totalEscrows() external view returns (uint256) {
        return _nextEscrowId - 1;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Admin
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IPaymentEscrow
    function setArbiter(address _arbiter) external onlyOwner {
        address old = arbiter;
        arbiter = _arbiter;
        emit ArbiterUpdated(old, _arbiter);
    }

    /// @inheritdoc IPaymentEscrow
    function setFeeRate(uint256 _feeRate) external onlyOwner {
        if (_feeRate > MAX_FEE_RATE) revert FeeRateTooHigh(_feeRate);
        uint256 old = feeRate;
        feeRate = _feeRate;
        emit FeeRateUpdated(old, _feeRate);
    }

    /// @notice Withdraw accumulated platform fees for a specific token (owner only).
    /// @param token The ERC-20 token to withdraw fees for.
    /// @param to    The recipient of the fees.
    function withdrawFees(address token, address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = accumulatedFees[token];
        if (amount == 0) revert ZeroAmount();

        // Effects
        accumulatedFees[token] = 0;

        // Interactions
        IERC20(token).safeTransfer(to, amount);
    }
}
