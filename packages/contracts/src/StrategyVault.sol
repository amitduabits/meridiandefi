// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IStrategyVault} from "./interfaces/IStrategyVault.sol";

/// @title StrategyVault
/// @author Meridian Protocol
/// @notice ERC-4626 tokenized vault that delegates DeFi strategy execution to an
///         authorized agent while enforcing per-tx and daily value limits, protocol
///         allowlists, and a timelock on agent changes.
/// @dev Follows CEI pattern. Custom errors. ReentrancyGuard on state-changing externals.
contract StrategyVault is IStrategyVault, ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ──────────────────────────────────────────────────────────────────────────
    // Constants
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice Timelock duration for agent changes (48 hours).
    uint256 public constant AGENT_TIMELOCK = 48 hours;

    /// @notice One day in seconds — used for daily limit resets.
    uint256 public constant ONE_DAY = 1 days;

    // ──────────────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────────────

    /// @notice The currently authorized agent.
    address public agent;

    /// @notice Pending agent update (address(0) if none).
    address public pendingAgent;

    /// @notice Timestamp at which the pending agent update becomes effective.
    uint256 public agentEffectiveAt;

    /// @notice Vault execution limits.
    VaultLimits private _limits;

    /// @dev protocol address => approved flag
    mapping(address => bool) private _approvedProtocols;

    /// @notice All currently approved protocol addresses (for enumeration).
    address[] private _protocolList;

    // ──────────────────────────────────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────────────────────────────────

    /// @param asset_       The underlying ERC-20 asset.
    /// @param name_        Vault share token name.
    /// @param symbol_      Vault share token symbol.
    /// @param initialOwner The contract owner.
    /// @param _agent       The initial authorized agent.
    /// @param maxTxValue_  Initial per-transaction value limit.
    /// @param dailyLimit_  Initial daily cumulative value limit.
    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address initialOwner,
        address _agent,
        uint256 maxTxValue_,
        uint256 dailyLimit_
    ) ERC4626(asset_) ERC20(name_, symbol_) Ownable(initialOwner) {
        agent = _agent;
        _limits = VaultLimits({
            maxTxValue: maxTxValue_,
            dailyLimit: dailyLimit_,
            dailySpent: 0,
            lastResetTimestamp: block.timestamp
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────────────────────────────────

    /// @dev Reverts if caller is not the authorized agent.
    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent(msg.sender);
        _;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Agent Execution
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IStrategyVault
    function executeStrategy(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) external onlyAgent nonReentrant {
        // Checks
        uint256 len = targets.length;
        if (len == 0) revert EmptyCalldata();

        // Reset daily counter if a new day started
        _resetDailyIfNeeded();

        for (uint256 i; i < len; ++i) {
            address target = targets[i];
            uint256 value = values[i];

            // Checks
            if (!_approvedProtocols[target]) revert ProtocolNotApproved(target);
            if (value > _limits.maxTxValue) revert ExceedsMaxTxValue(value, _limits.maxTxValue);

            uint256 remaining = _limits.dailyLimit - _limits.dailySpent;
            if (value > remaining) revert ExceedsDailyLimit(value, remaining);

            // Effects
            _limits.dailySpent += value;

            // Interactions
            (bool success, bytes memory returnData) = target.call{value: value}(calldatas[i]);
            if (!success) revert StrategyCallFailed(target, returnData);

            emit StrategyExecuted(msg.sender, target, value, calldatas[i]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Agent Management (timelock)
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IStrategyVault
    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert ZeroAddress();

        pendingAgent = newAgent;
        agentEffectiveAt = block.timestamp + AGENT_TIMELOCK;

        emit AgentUpdateScheduled(agent, newAgent, agentEffectiveAt);
    }

    /// @inheritdoc IStrategyVault
    function finalizeAgentUpdate() external onlyOwner {
        if (pendingAgent == address(0)) revert NoPendingAgentUpdate();
        if (block.timestamp < agentEffectiveAt) {
            revert TimelockNotElapsed(agentEffectiveAt, block.timestamp);
        }

        address oldAgent = agent;
        agent = pendingAgent;
        pendingAgent = address(0);
        agentEffectiveAt = 0;

        emit AgentUpdated(oldAgent, agent);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Emergency
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IStrategyVault
    function emergencyWithdraw(address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();

        IERC20 underlying = IERC20(asset());
        uint256 balance = underlying.balanceOf(address(this));

        // Interactions
        underlying.safeTransfer(to, balance);

        emit EmergencyWithdrawal(to, balance);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Protocol Management
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IStrategyVault
    function approveProtocol(address protocol) external onlyOwner {
        if (protocol == address(0)) revert ZeroAddress();
        if (_approvedProtocols[protocol]) revert ProtocolAlreadyApproved(protocol);

        _approvedProtocols[protocol] = true;
        _protocolList.push(protocol);

        emit ProtocolApproved(protocol);
    }

    /// @inheritdoc IStrategyVault
    function revokeProtocol(address protocol) external onlyOwner {
        if (!_approvedProtocols[protocol]) revert ProtocolNotCurrentlyApproved(protocol);

        _approvedProtocols[protocol] = false;

        // Remove from enumerable list (swap-and-pop)
        for (uint256 i; i < _protocolList.length; ++i) {
            if (_protocolList[i] == protocol) {
                _protocolList[i] = _protocolList[_protocolList.length - 1];
                _protocolList.pop();
                break;
            }
        }

        emit ProtocolRevoked(protocol);
    }

    /// @inheritdoc IStrategyVault
    function setLimits(uint256 maxTxValue, uint256 dailyLimit) external onlyOwner {
        _limits.maxTxValue = maxTxValue;
        _limits.dailyLimit = dailyLimit;

        emit LimitsUpdated(maxTxValue, dailyLimit);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // External — Views
    // ──────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IStrategyVault
    function isApprovedProtocol(address protocol) external view returns (bool) {
        return _approvedProtocols[protocol];
    }

    /// @inheritdoc IStrategyVault
    function getLimits() external view returns (VaultLimits memory) {
        return _limits;
    }

    /// @notice Returns the list of all currently approved protocols.
    function getApprovedProtocols() external view returns (address[] memory) {
        return _protocolList;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ──────────────────────────────────────────────────────────────────────────

    /// @dev Resets the daily spending counter if at least 24 hours have passed
    ///      since the last reset.
    function _resetDailyIfNeeded() internal {
        if (block.timestamp >= _limits.lastResetTimestamp + ONE_DAY) {
            _limits.dailySpent = 0;
            _limits.lastResetTimestamp = block.timestamp;
        }
    }
}
