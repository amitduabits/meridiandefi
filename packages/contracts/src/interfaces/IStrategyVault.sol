// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IStrategyVault
/// @notice Interface for the Meridian Strategy Vault — an ERC-4626 tokenized vault
///         that allows an authorized agent to execute DeFi strategies on behalf of
///         depositors, subject to strict safety limits.
interface IStrategyVault {
    // ──────────────────────────────────────────────────────────────────────────
    // Structs
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Configuration limits enforced on agent execution.
    struct VaultLimits {
        uint256 maxTxValue;
        uint256 dailyLimit;
        uint256 dailySpent;
        uint256 lastResetTimestamp;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Emitted when the authorized agent address is updated (subject to timelock).
    event AgentUpdateScheduled(address indexed oldAgent, address indexed newAgent, uint256 effectiveAt);

    /// @notice Emitted when a scheduled agent change takes effect.
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    /// @notice Emitted when the agent executes a strategy call.
    event StrategyExecuted(address indexed agent, address indexed target, uint256 value, bytes data);

    /// @notice Emitted when the owner triggers an emergency withdrawal.
    event EmergencyWithdrawal(address indexed to, uint256 amount);

    /// @notice Emitted when a protocol is added to the approved list.
    event ProtocolApproved(address indexed protocol);

    /// @notice Emitted when a protocol is removed from the approved list.
    event ProtocolRevoked(address indexed protocol);

    /// @notice Emitted when vault limits are updated.
    event LimitsUpdated(uint256 maxTxValue, uint256 dailyLimit);

    // ──────────────────────────────────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Caller is not the authorized agent.
    error NotAgent(address caller);

    /// @notice Target protocol is not in the approved list.
    error ProtocolNotApproved(address target);

    /// @notice Single transaction value exceeds `maxTxValue`.
    error ExceedsMaxTxValue(uint256 value, uint256 max);

    /// @notice Cumulative daily spend would exceed `dailyLimit`.
    error ExceedsDailyLimit(uint256 requested, uint256 remaining);

    /// @notice Strategy sub-call reverted.
    error StrategyCallFailed(address target, bytes returnData);

    /// @notice Agent update timelock has not elapsed.
    error TimelockNotElapsed(uint256 effectiveAt, uint256 currentTime);

    /// @notice No pending agent update exists.
    error NoPendingAgentUpdate();

    /// @notice Zero address passed where a non-zero address is expected.
    error ZeroAddress();

    /// @notice Empty calldata array passed to executeStrategy.
    error EmptyCalldata();

    /// @notice Protocol already approved.
    error ProtocolAlreadyApproved(address protocol);

    /// @notice Protocol not currently approved.
    error ProtocolNotCurrentlyApproved(address protocol);

    // ──────────────────────────────────────────────────────────────────────────
    // External functions
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Execute a batch of strategy calls against approved protocols.
    /// @param targets  Array of target contract addresses.
    /// @param values   Array of ETH values to send with each call.
    /// @param calldatas Array of calldata payloads.
    function executeStrategy(address[] calldata targets, uint256[] calldata values, bytes[] calldata calldatas)
        external;

    /// @notice Schedule a new authorized agent (subject to timelock).
    /// @param newAgent The new agent address.
    function setAgent(address newAgent) external;

    /// @notice Finalize a pending agent update after the timelock elapses.
    function finalizeAgentUpdate() external;

    /// @notice Owner-only emergency withdrawal of all underlying assets.
    /// @param to Recipient of the withdrawn assets.
    function emergencyWithdraw(address to) external;

    /// @notice Add a protocol to the approved list.
    /// @param protocol The protocol contract address.
    function approveProtocol(address protocol) external;

    /// @notice Remove a protocol from the approved list.
    /// @param protocol The protocol contract address.
    function revokeProtocol(address protocol) external;

    /// @notice Update vault safety limits.
    /// @param maxTxValue  Maximum value per transaction.
    /// @param dailyLimit  Maximum cumulative daily spend.
    function setLimits(uint256 maxTxValue, uint256 dailyLimit) external;

    /// @notice Returns the current authorized agent.
    function agent() external view returns (address);

    /// @notice Returns whether a protocol is approved.
    function isApprovedProtocol(address protocol) external view returns (bool);

    /// @notice Returns the current vault limits.
    function getLimits() external view returns (VaultLimits memory);
}
