// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAgentRegistry} from "./interfaces/IAgentRegistry.sol";

/// @title AgentRegistry
/// @author Meridian Protocol
/// @notice ERC-721 based agent identity registry. Each minted token represents a
///         unique autonomous agent with on-chain capabilities, metadata, and
///         reputation managed by a designated oracle.
/// @dev Follows CEI (Checks-Effects-Interactions) pattern throughout. Uses custom
///      errors instead of require strings for gas efficiency.
contract AgentRegistry is IAgentRegistry, ERC721, Ownable {
    // ──────────────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Auto-incrementing token / agent ID counter.
    uint256 private _nextAgentId;

    /// @notice Address authorized to update agent reputation scores.
    address public oracle;

    /// @dev agentId => AgentInfo
    mapping(uint256 => AgentInfo) private _agents;

    /// @dev capability string => array of agent IDs that advertise it.
    mapping(string => uint256[]) private _capabilityIndex;

    // ──────────────────────────────────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────────────────────────────────

    /// @param initialOwner The contract owner (admin).
    /// @param _oracle      The initial reputation oracle address.
    constructor(address initialOwner, address _oracle)
        ERC721("Meridian Agent", "MAGENT")
        Ownable(initialOwner)
    {
        oracle = _oracle;
        _nextAgentId = 1; // start IDs at 1
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────────────────────────────────

    /// @dev Reverts if the caller does not own the specified agent token.
    modifier onlyAgentOwner(uint256 agentId) {
        if (ownerOf(agentId) != msg.sender) {
            revert NotAgentOwner(agentId, msg.sender);
        }
        _;
    }

    /// @dev Reverts if the caller is not the reputation oracle.
    modifier onlyOracle() {
        if (msg.sender != oracle) {
            revert NotOracle(msg.sender);
        }
        _;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Registration
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IAgentRegistry
    function registerAgent(string[] calldata capabilities, string calldata metadataURI)
        external
        returns (uint256 agentId)
    {
        // Checks
        if (capabilities.length == 0) revert EmptyCapabilities();
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        // Effects
        agentId = _nextAgentId++;

        AgentInfo storage info = _agents[agentId];
        info.owner = msg.sender;
        info.metadataURI = metadataURI;
        info.reputation = 0;
        info.active = true;
        info.registeredAt = block.timestamp;

        // Store capabilities and update index
        for (uint256 i; i < capabilities.length; ++i) {
            info.capabilities.push(capabilities[i]);
            _capabilityIndex[capabilities[i]].push(agentId);
        }

        // Interactions
        _safeMint(msg.sender, agentId);

        emit AgentRegistered(agentId, msg.sender, metadataURI);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Updates
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IAgentRegistry
    function updateCapabilities(uint256 agentId, string[] calldata capabilities)
        external
        onlyAgentOwner(agentId)
    {
        // Checks
        if (capabilities.length == 0) revert EmptyCapabilities();
        _requireActive(agentId);

        // Effects — clear old capabilities from index
        AgentInfo storage info = _agents[agentId];
        _removeFromCapabilityIndex(agentId, info.capabilities);
        delete info.capabilities;

        // Write new capabilities and rebuild index
        for (uint256 i; i < capabilities.length; ++i) {
            info.capabilities.push(capabilities[i]);
            _capabilityIndex[capabilities[i]].push(agentId);
        }

        emit CapabilitiesUpdated(agentId, capabilities);
    }

    /// @inheritdoc IAgentRegistry
    function updateReputation(uint256 agentId, uint256 newReputation) external onlyOracle {
        _requireActive(agentId);

        // Effects
        _agents[agentId].reputation = newReputation;

        emit ReputationUpdated(agentId, newReputation);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Deregistration
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IAgentRegistry
    function deregisterAgent(uint256 agentId) external onlyAgentOwner(agentId) {
        _requireActive(agentId);

        // Effects
        AgentInfo storage info = _agents[agentId];
        info.active = false;
        _removeFromCapabilityIndex(agentId, info.capabilities);

        // Interactions
        _burn(agentId);

        emit AgentDeregistered(agentId);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Admin
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IAgentRegistry
    function setOracle(address _oracle) external onlyOwner {
        address old = oracle;
        oracle = _oracle;
        emit OracleUpdated(old, _oracle);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Views
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IAgentRegistry
    function getAgent(uint256 agentId) external view returns (AgentInfo memory info) {
        if (_agents[agentId].registeredAt == 0) revert AgentNotFound(agentId);
        info = _agents[agentId];
    }

    /// @inheritdoc IAgentRegistry
    function findAgents(string calldata capability) external view returns (uint256[] memory agentIds) {
        agentIds = _capabilityIndex[capability];
    }

    /// @notice Returns the total number of agents ever registered (including deregistered).
    function totalAgents() external view returns (uint256) {
        return _nextAgentId - 1;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ──────────────────────────────────────────────────────────────────────────

    /// @dev Reverts if the agent is not active.
    function _requireActive(uint256 agentId) internal view {
        if (!_agents[agentId].active) revert AgentNotFound(agentId);
    }

    /// @dev Removes `agentId` from the capability index for each capability in `caps`.
    function _removeFromCapabilityIndex(uint256 agentId, string[] storage caps) internal {
        for (uint256 i; i < caps.length; ++i) {
            uint256[] storage ids = _capabilityIndex[caps[i]];
            for (uint256 j; j < ids.length; ++j) {
                if (ids[j] == agentId) {
                    ids[j] = ids[ids.length - 1];
                    ids.pop();
                    break;
                }
            }
        }
    }
}
