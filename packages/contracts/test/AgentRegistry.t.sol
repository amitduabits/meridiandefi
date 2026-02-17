// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {IAgentRegistry} from "../src/interfaces/IAgentRegistry.sol";

/// @title AgentRegistryTest
/// @notice Comprehensive tests for the AgentRegistry contract covering
///         registration, updates, deregistration, reputation, and findAgents.
contract AgentRegistryTest is Test {
    // ──────────────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────────────

    AgentRegistry public registry;

    address public owner = makeAddr("owner");
    address public oracle = makeAddr("oracle");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    string[] public defaultCaps;
    string public defaultURI = "ipfs://QmAgent1";

    // ──────────────────────────────────────────────────────────────────────────
    // Setup
    // ──────────────────────────────────────────────────────────────────────────

    function setUp() public {
        registry = new AgentRegistry(owner, oracle);
        defaultCaps.push("defi");
        defaultCaps.push("trading");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    function _registerDefaultAgent(address caller) internal returns (uint256) {
        vm.prank(caller);
        return registry.registerAgent(defaultCaps, defaultURI);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Registration
    // ──────────────────────────────────────────────────────────────────────────

    function test_registerAgent_success() public {
        vm.prank(alice);
        uint256 agentId = registry.registerAgent(defaultCaps, defaultURI);

        assertEq(agentId, 1);
        assertEq(registry.ownerOf(agentId), alice);

        IAgentRegistry.AgentInfo memory info = registry.getAgent(agentId);
        assertEq(info.owner, alice);
        assertEq(info.metadataURI, defaultURI);
        assertEq(info.reputation, 0);
        assertTrue(info.active);
        assertEq(info.capabilities.length, 2);
        assertEq(info.capabilities[0], "defi");
        assertEq(info.capabilities[1], "trading");
    }

    function test_registerAgent_incrementsId() public {
        uint256 id1 = _registerDefaultAgent(alice);
        uint256 id2 = _registerDefaultAgent(bob);

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(registry.totalAgents(), 2);
    }

    function test_registerAgent_emitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit IAgentRegistry.AgentRegistered(1, alice, defaultURI);

        vm.prank(alice);
        registry.registerAgent(defaultCaps, defaultURI);
    }

    function test_registerAgent_revertsEmptyCapabilities() public {
        string[] memory empty = new string[](0);

        vm.prank(alice);
        vm.expectRevert(IAgentRegistry.EmptyCapabilities.selector);
        registry.registerAgent(empty, defaultURI);
    }

    function test_registerAgent_revertsEmptyMetadataURI() public {
        vm.prank(alice);
        vm.expectRevert(IAgentRegistry.EmptyMetadataURI.selector);
        registry.registerAgent(defaultCaps, "");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Update Capabilities
    // ──────────────────────────────────────────────────────────────────────────

    function test_updateCapabilities_success() public {
        uint256 agentId = _registerDefaultAgent(alice);

        string[] memory newCaps = new string[](1);
        newCaps[0] = "analytics";

        vm.prank(alice);
        registry.updateCapabilities(agentId, newCaps);

        IAgentRegistry.AgentInfo memory info = registry.getAgent(agentId);
        assertEq(info.capabilities.length, 1);
        assertEq(info.capabilities[0], "analytics");
    }

    function test_updateCapabilities_updatesIndex() public {
        uint256 agentId = _registerDefaultAgent(alice);

        // Before update: findAgents("defi") should return [agentId]
        uint256[] memory defiAgents = registry.findAgents("defi");
        assertEq(defiAgents.length, 1);
        assertEq(defiAgents[0], agentId);

        // Update to remove "defi", add "analytics"
        string[] memory newCaps = new string[](1);
        newCaps[0] = "analytics";

        vm.prank(alice);
        registry.updateCapabilities(agentId, newCaps);

        // After: "defi" should be empty, "analytics" should contain agentId
        uint256[] memory defiAfter = registry.findAgents("defi");
        assertEq(defiAfter.length, 0);

        uint256[] memory analyticsAfter = registry.findAgents("analytics");
        assertEq(analyticsAfter.length, 1);
        assertEq(analyticsAfter[0], agentId);
    }

    function test_updateCapabilities_revertsNotOwner() public {
        uint256 agentId = _registerDefaultAgent(alice);

        string[] memory newCaps = new string[](1);
        newCaps[0] = "analytics";

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(IAgentRegistry.NotAgentOwner.selector, agentId, bob));
        registry.updateCapabilities(agentId, newCaps);
    }

    function test_updateCapabilities_revertsEmptyCaps() public {
        uint256 agentId = _registerDefaultAgent(alice);
        string[] memory empty = new string[](0);

        vm.prank(alice);
        vm.expectRevert(IAgentRegistry.EmptyCapabilities.selector);
        registry.updateCapabilities(agentId, empty);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Reputation
    // ──────────────────────────────────────────────────────────────────────────

    function test_updateReputation_success() public {
        uint256 agentId = _registerDefaultAgent(alice);

        vm.prank(oracle);
        registry.updateReputation(agentId, 100);

        IAgentRegistry.AgentInfo memory info = registry.getAgent(agentId);
        assertEq(info.reputation, 100);
    }

    function test_updateReputation_emitsEvent() public {
        uint256 agentId = _registerDefaultAgent(alice);

        vm.expectEmit(true, false, false, true);
        emit IAgentRegistry.ReputationUpdated(agentId, 42);

        vm.prank(oracle);
        registry.updateReputation(agentId, 42);
    }

    function test_updateReputation_revertsNotOracle() public {
        uint256 agentId = _registerDefaultAgent(alice);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IAgentRegistry.NotOracle.selector, alice));
        registry.updateReputation(agentId, 50);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Deregistration
    // ──────────────────────────────────────────────────────────────────────────

    function test_deregisterAgent_success() public {
        uint256 agentId = _registerDefaultAgent(alice);

        vm.prank(alice);
        registry.deregisterAgent(agentId);

        IAgentRegistry.AgentInfo memory info = registry.getAgent(agentId);
        assertFalse(info.active);
    }

    function test_deregisterAgent_removesFromIndex() public {
        uint256 agentId = _registerDefaultAgent(alice);

        vm.prank(alice);
        registry.deregisterAgent(agentId);

        uint256[] memory defiAgents = registry.findAgents("defi");
        assertEq(defiAgents.length, 0);
    }

    function test_deregisterAgent_emitsEvent() public {
        uint256 agentId = _registerDefaultAgent(alice);

        vm.expectEmit(true, false, false, false);
        emit IAgentRegistry.AgentDeregistered(agentId);

        vm.prank(alice);
        registry.deregisterAgent(agentId);
    }

    function test_deregisterAgent_revertsNotOwner() public {
        uint256 agentId = _registerDefaultAgent(alice);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(IAgentRegistry.NotAgentOwner.selector, agentId, bob));
        registry.deregisterAgent(agentId);
    }

    function test_deregisterAgent_revertsAlreadyDeregistered() public {
        uint256 agentId = _registerDefaultAgent(alice);

        vm.prank(alice);
        registry.deregisterAgent(agentId);

        // Token is burned, so ownerOf will revert — we test that it cannot be deregistered again
        vm.prank(alice);
        vm.expectRevert(); // ERC721: ownerOf reverts for burned token
        registry.deregisterAgent(agentId);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Find Agents
    // ──────────────────────────────────────────────────────────────────────────

    function test_findAgents_returnsMatchingAgents() public {
        uint256 id1 = _registerDefaultAgent(alice); // defi, trading
        _registerDefaultAgent(bob); // defi, trading

        // Both share "defi" and "trading"
        uint256[] memory defiAgents = registry.findAgents("defi");
        assertEq(defiAgents.length, 2);
        assertEq(defiAgents[0], id1);

        uint256[] memory tradingAgents = registry.findAgents("trading");
        assertEq(tradingAgents.length, 2);
    }

    function test_findAgents_returnsEmptyForUnknownCapability() public {
        _registerDefaultAgent(alice);
        uint256[] memory result = registry.findAgents("unknown");
        assertEq(result.length, 0);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Admin
    // ──────────────────────────────────────────────────────────────────────────

    function test_setOracle_success() public {
        address newOracle = makeAddr("newOracle");

        vm.prank(owner);
        registry.setOracle(newOracle);

        assertEq(registry.oracle(), newOracle);
    }

    function test_setOracle_revertsNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        registry.setOracle(alice);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // View — getAgent
    // ──────────────────────────────────────────────────────────────────────────

    function test_getAgent_revertsForNonexistent() public {
        vm.expectRevert(abi.encodeWithSelector(IAgentRegistry.AgentNotFound.selector, 999));
        registry.getAgent(999);
    }
}
