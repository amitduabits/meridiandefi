// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IPaymentEscrow
/// @notice Interface for the Meridian Payment Escrow — holds ERC-20 tokens in
///         escrow for agent task payments with a full dispute-resolution lifecycle.
interface IPaymentEscrow {
    // ──────────────────────────────────────────────────────────────────────────
    // Enums
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Lifecycle states for an escrow.
    enum EscrowState {
        CREATED,
        FUNDED,
        RELEASED,
        DISPUTED,
        SETTLED,
        CLAIMED
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Structs
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Represents a single escrow instance.
    struct Escrow {
        bytes32 taskId;
        address client;
        address provider;
        address token;
        uint256 amount;
        uint256 deadline;
        EscrowState state;
        uint256 createdAt;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Emitted when a new escrow is created and funded.
    event EscrowCreated(
        uint256 indexed escrowId,
        bytes32 indexed taskId,
        address indexed client,
        address provider,
        address token,
        uint256 amount,
        uint256 deadline
    );

    /// @notice Emitted when the client releases funds to the provider.
    event EscrowReleased(uint256 indexed escrowId, address indexed provider, uint256 amount);

    /// @notice Emitted when the provider claims funds after the deadline.
    event EscrowClaimed(uint256 indexed escrowId, address indexed provider, uint256 amount);

    /// @notice Emitted when the client disputes the escrow.
    event EscrowDisputed(uint256 indexed escrowId, address indexed disputant);

    /// @notice Emitted when an arbiter settles the dispute.
    event DisputeResolved(
        uint256 indexed escrowId, uint256 clientAmount, uint256 providerAmount, address indexed arbiter
    );

    /// @notice Emitted when the arbiter address changes.
    event ArbiterUpdated(address indexed oldArbiter, address indexed newArbiter);

    /// @notice Emitted when the platform fee rate changes.
    event FeeRateUpdated(uint256 oldRate, uint256 newRate);

    // ──────────────────────────────────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Zero address passed where a non-zero address is expected.
    error ZeroAddress();

    /// @notice Amount must be greater than zero.
    error ZeroAmount();

    /// @notice Deadline must be in the future.
    error DeadlinePassed();

    /// @notice Escrow is not in the expected state.
    error InvalidState(uint256 escrowId, EscrowState current, EscrowState expected);

    /// @notice Caller is not the client of the escrow.
    error NotClient(uint256 escrowId, address caller);

    /// @notice Caller is not the provider of the escrow.
    error NotProvider(uint256 escrowId, address caller);

    /// @notice Caller is not the designated arbiter.
    error NotArbiter(address caller);

    /// @notice Deadline has not yet been reached.
    error DeadlineNotReached(uint256 escrowId, uint256 deadline);

    /// @notice Fee rate exceeds the maximum allowed (10 000 = 100%).
    error FeeRateTooHigh(uint256 rate);

    /// @notice Split amounts do not equal the escrowed total.
    error InvalidSplit(uint256 clientAmount, uint256 providerAmount, uint256 total);

    // ──────────────────────────────────────────────────────────────────────────
    // External functions
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Creates and funds a new escrow. The caller must have approved
    ///         this contract to spend `amount` of `token`.
    /// @param taskId   Off-chain task identifier.
    /// @param provider The agent / service provider address.
    /// @param token    The ERC-20 token used for payment.
    /// @param amount   The payment amount (before fees).
    /// @param deadline Unix timestamp after which the provider may claim.
    /// @return escrowId The ID of the created escrow.
    function createEscrow(bytes32 taskId, address provider, address token, uint256 amount, uint256 deadline)
        external
        returns (uint256 escrowId);

    /// @notice Client releases funds to the provider, signalling task completion.
    /// @param escrowId The escrow to release.
    function releaseEscrow(uint256 escrowId) external;

    /// @notice Provider claims escrowed funds after the deadline passes without
    ///         a dispute from the client.
    /// @param escrowId The escrow to claim.
    function claimEscrow(uint256 escrowId) external;

    /// @notice Client opens a dispute on the escrow.
    /// @param escrowId The escrow to dispute.
    function disputeEscrow(uint256 escrowId) external;

    /// @notice Arbiter resolves a disputed escrow by splitting funds.
    /// @param escrowId      The disputed escrow.
    /// @param clientAmount  Amount returned to the client.
    /// @param providerAmount Amount sent to the provider.
    function resolveDispute(uint256 escrowId, uint256 clientAmount, uint256 providerAmount) external;

    /// @notice Returns the escrow struct for a given ID.
    /// @param escrowId The escrow ID.
    /// @return escrow  The Escrow struct.
    function getEscrow(uint256 escrowId) external view returns (Escrow memory escrow);

    /// @notice Sets the arbiter address (owner only).
    /// @param arbiter The new arbiter address.
    function setArbiter(address arbiter) external;

    /// @notice Sets the platform fee rate in basis points (owner only).
    /// @param feeRate The new fee rate (max 1000 = 10%).
    function setFeeRate(uint256 feeRate) external;
}
