// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IAgentRegistry
/// @notice Interface for the Meridian Agent Registry — an ERC-721-based identity
///         layer that tracks autonomous agent capabilities, metadata, and reputation.
interface IAgentRegistry {
    // ──────────────────────────────────────────────────────────────────────────
    // Structs
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice On-chain representation of a registered agent.
    struct AgentInfo {
        address owner;
        string[] capabilities;
        string metadataURI;
        uint256 reputation;
        bool active;
        uint256 registeredAt;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Emitted when a new agent is registered.
    event AgentRegistered(uint256 indexed agentId, address indexed owner, string metadataURI);

    /// @notice Emitted when an agent's capabilities are updated.
    event CapabilitiesUpdated(uint256 indexed agentId, string[] capabilities);

    /// @notice Emitted when an oracle updates agent reputation.
    event ReputationUpdated(uint256 indexed agentId, uint256 newReputation);

    /// @notice Emitted when an agent is deregistered (burned).
    event AgentDeregistered(uint256 indexed agentId);

    /// @notice Emitted when the reputation oracle address changes.
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    // ──────────────────────────────────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Caller is not the owner of the specified agent.
    error NotAgentOwner(uint256 agentId, address caller);

    /// @notice Caller is not the designated reputation oracle.
    error NotOracle(address caller);

    /// @notice The queried agent does not exist or has been deregistered.
    error AgentNotFound(uint256 agentId);

    /// @notice Empty capabilities array supplied.
    error EmptyCapabilities();

    /// @notice Empty metadata URI supplied.
    error EmptyMetadataURI();

    // ──────────────────────────────────────────────────────────────────────────
    // External functions
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Registers a new agent and mints an ERC-721 token.
    /// @param capabilities The agent's advertised capability strings.
    /// @param metadataURI  IPFS / HTTP URI pointing to off-chain metadata.
    /// @return agentId     The newly minted token / agent ID.
    function registerAgent(string[] calldata capabilities, string calldata metadataURI)
        external
        returns (uint256 agentId);

    /// @notice Updates the capability set for an existing agent.
    /// @param agentId      The agent token ID.
    /// @param capabilities New capabilities list.
    function updateCapabilities(uint256 agentId, string[] calldata capabilities) external;

    /// @notice Updates an agent's on-chain reputation score (oracle only).
    /// @param agentId       The agent token ID.
    /// @param newReputation The updated reputation value.
    function updateReputation(uint256 agentId, uint256 newReputation) external;

    /// @notice Returns full agent information.
    /// @param agentId The agent token ID.
    /// @return info   The AgentInfo struct.
    function getAgent(uint256 agentId) external view returns (AgentInfo memory info);

    /// @notice Finds agents that advertise a given capability.
    /// @param capability The capability string to search for.
    /// @return agentIds  Array of matching agent IDs.
    function findAgents(string calldata capability) external view returns (uint256[] memory agentIds);

    /// @notice Deregisters (burns) an agent. Only the agent owner may call.
    /// @param agentId The agent token ID.
    function deregisterAgent(uint256 agentId) external;

    /// @notice Sets the reputation oracle address (owner only).
    /// @param oracle The new oracle address.
    function setOracle(address oracle) external;
}
