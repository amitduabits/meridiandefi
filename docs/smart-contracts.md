# Smart Contracts

Meridian's on-chain infrastructure consists of four Solidity contracts deployed on EVM-compatible chains. All contracts are built with Foundry, use OpenZeppelin v5 base contracts, and follow the Checks-Effects-Interactions (CEI) pattern with custom errors for gas efficiency.

## Overview

| Contract | Base | Purpose |
|----------|------|---------|
| `AgentRegistry` | ERC-721, Ownable | On-chain agent identity and capability discovery |
| `PaymentEscrow` | Ownable, ReentrancyGuard | Secure ERC-20 escrow for agent task payments |
| `StrategyVault` | ERC-4626, Ownable, ReentrancyGuard | Tokenized vault with agent-delegated execution |
| `MeridianGovernance` | Governor (OZ extensions) | On-chain governance for protocol parameters |

## AgentRegistry

An ERC-721 contract where each minted token represents a unique autonomous agent. Agents register with capabilities and metadata, enabling on-chain discovery by other agents and off-chain systems.

### Interface

```solidity
function registerAgent(
    string[] calldata capabilities,
    string calldata metadataURI
) external returns (uint256 agentId);

function updateCapabilities(
    uint256 agentId,
    string[] calldata capabilities
) external;

function updateReputation(
    uint256 agentId,
    uint256 newReputation
) external;

function deregisterAgent(uint256 agentId) external;

function getAgent(uint256 agentId) external view returns (AgentInfo memory);

function findAgents(string calldata capability) external view returns (uint256[] memory);

function totalAgents() external view returns (uint256);

function setOracle(address _oracle) external;
```

### Agent Registration

Any address can register an agent by calling `registerAgent()` with a list of capability strings and a metadata URI (typically IPFS):

```solidity
uint256 agentId = registry.registerAgent(
    ["SWAP", "PORTFOLIO_MANAGEMENT"],
    "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
);
```

This mints an ERC-721 token to the caller and indexes the agent's capabilities for efficient lookup. Agent IDs start at 1 and auto-increment.

### Capability Discovery

Find all agents that advertise a given capability:

```solidity
uint256[] memory swapAgents = registry.findAgents("SWAP");
```

The contract maintains a reverse index mapping capability strings to arrays of agent IDs.

### Reputation System

An authorized oracle address can update agent reputation scores. This enables off-chain reputation algorithms to write their results on-chain:

```solidity
// Only callable by the designated oracle
registry.updateReputation(agentId, 850);
```

The contract owner can change the oracle address via `setOracle()`.

### Deregistration

Agents can be deregistered by their owner, which burns the ERC-721 token and removes the agent from capability indexes:

```solidity
registry.deregisterAgent(agentId);
```

### AgentInfo Struct

```solidity
struct AgentInfo {
    address owner;
    string[] capabilities;
    string metadataURI;
    uint256 reputation;
    bool active;
    uint256 registeredAt;
}
```

## PaymentEscrow

A secure escrow contract for ERC-20 payments between agents. Supports a full lifecycle: create, fund, release, dispute, settle, and claim.

### Escrow Lifecycle

```
Created (FUNDED) ──► Released (by client)
                 ──► Claimed (by provider, after deadline)
                 ──► Disputed (by client)
                         ──► Settled (by arbiter, split payment)
```

### Interface

```solidity
function createEscrow(
    bytes32 taskId,
    address provider,
    address token,
    uint256 amount,
    uint256 deadline
) external returns (uint256 escrowId);

function releaseEscrow(uint256 escrowId) external;
function claimEscrow(uint256 escrowId) external;
function disputeEscrow(uint256 escrowId) external;

function resolveDispute(
    uint256 escrowId,
    uint256 clientAmount,
    uint256 providerAmount
) external;

function getEscrow(uint256 escrowId) external view returns (Escrow memory);
function setArbiter(address _arbiter) external;
function setFeeRate(uint256 _feeRate) external;
function withdrawFees(address token, address to) external;
```

### Creating an Escrow

The client creates an escrow by depositing ERC-20 tokens:

```solidity
// Client must approve the escrow contract first
token.approve(address(escrow), 1000e6);

uint256 escrowId = escrow.createEscrow(
    keccak256("task-001"),     // task identifier
    providerAddress,           // agent that will perform the work
    address(token),            // payment token (e.g. USDC)
    1000e6,                    // 1000 USDC
    block.timestamp + 7 days   // deadline
);
```

### Payment Flow

- **Release**: The client releases payment to the provider after satisfactory completion. A platform fee (configurable, max 10%) is deducted.
- **Claim**: If the client does not act before the deadline, the provider can claim the payment.
- **Dispute**: The client can dispute before the deadline, freezing the escrow until the arbiter resolves it.
- **Resolution**: The arbiter splits the funds between client and provider. The split must sum to the original escrow amount.

### Fee Management

The platform fee is configurable up to a maximum of 1000 basis points (10%):

```solidity
escrow.setFeeRate(250); // 2.5% fee

// Accumulated fees can be withdrawn by the owner
escrow.withdrawFees(address(token), treasuryAddress);
```

### Escrow Struct

```solidity
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

enum EscrowState { FUNDED, RELEASED, CLAIMED, DISPUTED, SETTLED }
```

## StrategyVault

An ERC-4626 tokenized vault that allows depositors to pool assets while delegating DeFi strategy execution to an authorized agent. The vault enforces per-transaction limits, daily spend limits, a protocol allowlist, and a 48-hour timelock on agent changes.

### Interface

```solidity
function executeStrategy(
    address[] calldata targets,
    uint256[] calldata values,
    bytes[] calldata calldatas
) external;

function setAgent(address newAgent) external;
function finalizeAgentUpdate() external;
function emergencyWithdraw(address to) external;
function approveProtocol(address protocol) external;
function revokeProtocol(address protocol) external;
function setLimits(uint256 maxTxValue, uint256 dailyLimit) external;
function isApprovedProtocol(address protocol) external view returns (bool);
function getLimits() external view returns (VaultLimits memory);
function getApprovedProtocols() external view returns (address[] memory);
```

### How It Works

1. **Depositors** deposit the underlying asset (e.g., USDC) and receive vault shares (ERC-4626 standard `deposit()` / `withdraw()`).

2. **The agent** calls `executeStrategy()` to interact with approved DeFi protocols on behalf of the vault. Each call is checked against:
   - Protocol allowlist (target address must be approved)
   - Per-transaction value limit (`maxTxValue`)
   - Daily cumulative value limit (`dailyLimit`, resets every 24 hours)

3. **The owner** manages security: approving/revoking protocols, setting limits, and updating the agent.

### Strategy Execution

```solidity
// Agent executes a multi-step strategy
vault.executeStrategy(
    [uniswapRouter, aavePool],                    // targets
    [0, 0],                                        // ETH values
    [swapCalldata, supplyCalldata]                 // encoded calls
);
```

Each target must be in the approved protocol list. Each value must not exceed `maxTxValue`, and the cumulative daily spend must not exceed `dailyLimit`.

### Agent Timelock

Agent changes require a 48-hour timelock to protect depositors:

```solidity
// Step 1: Schedule (owner only)
vault.setAgent(newAgentAddress);
// pendingAgent is set, agentEffectiveAt = now + 48 hours

// Step 2: Wait 48 hours...

// Step 3: Finalize (owner only)
vault.finalizeAgentUpdate();
// agent is now updated
```

### Emergency Withdrawal

The owner can withdraw all vault assets in an emergency:

```solidity
vault.emergencyWithdraw(safeAddress);
```

### VaultLimits Struct

```solidity
struct VaultLimits {
    uint256 maxTxValue;
    uint256 dailyLimit;
    uint256 dailySpent;
    uint256 lastResetTimestamp;
}
```

## MeridianGovernance

A full OpenZeppelin Governor implementation for protocol-level governance. Manages fee rates, approved protocols, registry parameters, and other configuration through on-chain proposals.

### Extensions

The governance contract combines:
- `GovernorSettings` -- configurable voting delay, period, and proposal threshold
- `GovernorCountingSimple` -- standard For/Against/Abstain voting
- `GovernorVotes` -- ERC-20 Votes token for governance weight
- `GovernorVotesQuorumFraction` -- quorum as % of total supply
- `GovernorTimelockControl` -- timelock execution for passed proposals

### Deployment Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `token_` | ERC-20 Votes token | Meridian governance token |
| `timelock_` | TimelockController | Executes passed proposals |
| `votingDelay_` | Blocks before voting starts | 1 day (7200 blocks) |
| `votingPeriod_` | Duration of voting window | 1 week (50400 blocks) |
| `proposalThreshold_` | Min votes to create proposal | 1000e18 |
| `quorumPercent_` | Quorum as % of total supply | 4 |

## Development

### Building

```bash
cd packages/contracts
forge build
```

### Testing

```bash
forge test --gas-report
```

Tests are located in `test/` and cover all contract functionality:
- `test/AgentRegistry.t.sol` -- registration, capabilities, reputation, deregistration
- `test/PaymentEscrow.t.sol` -- escrow lifecycle, disputes, fee management
- `test/StrategyVault.t.sol` -- deposits, strategy execution, limits, timelock

### Deployment

Deploy scripts are provided in `script/`:

```bash
# Testnet deployment
forge script script/DeployTestnet.s.sol --rpc-url $RPC_URL --broadcast

# Production deployment
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
```

### Verified Addresses

Contracts will be verified on block explorers upon mainnet deployment. Testnet deployments on Arbitrum Sepolia and Ethereum Sepolia are used for development and integration testing.

## Security Model

1. **CEI Pattern**: All contracts follow Checks-Effects-Interactions ordering to prevent reentrancy issues at the code level, supplemented by `ReentrancyGuard` on `PaymentEscrow` and `StrategyVault`.

2. **Custom Errors**: Gas-efficient `revert` with custom error types instead of `require` strings. Errors include contextual parameters for debugging.

3. **Access Control**: `Ownable` for admin functions, role-based modifiers (`onlyAgent`, `onlyOracle`, `onlyClient`, `onlyArbiter`) for operational functions.

4. **SafeERC20**: All token transfers use OpenZeppelin's `SafeERC20` library to handle non-standard ERC-20 implementations.

5. **Timelock**: The `StrategyVault` enforces a 48-hour timelock on agent changes, giving depositors time to exit before a new agent takes control.

6. **Fee Caps**: The `PaymentEscrow` enforces a maximum fee rate of 10% (1000 bps), preventing excessive platform fees.
