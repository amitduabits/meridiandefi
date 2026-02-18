# Meridian -- Community Engagement Messages

Pre-submission Discord/Telegram messages for grant program outreach.
Each chain has 3 messages: Introduction, Technical Question, and Grant Inquiry.

---

## A) Ethereum Foundation

### Message 1 -- Introduction (#introductions / #grants)

Hey everyone, I'm Amit -- been building in DeFi for a while and currently working on an open-source AI agent framework called Meridian. The idea is autonomous agents that can reason about on-chain state and execute DeFi strategies across protocols like Aave and Uniswap. I've been looking at the ESP (Ecosystem Support Program) and curious -- are there particular areas within account abstraction or intent-based architectures that the foundation is especially keen to fund right now?

### Message 2 -- Technical Question (#dev / #builders)

I'm building an agent runtime that needs to watch and react to on-chain events across multiple protocols simultaneously (think Aave health factors + Uniswap pool tick changes). Currently using viem's `watchContractEvent` with multicall batching, but I'm hitting some RPC rate-limiting pain at scale. Has anyone here experimented with running a lightweight Reth node specifically for event-heavy workloads? Wondering if the execution extensions API is stable enough for production event streaming.

### Message 3 -- Grant Inquiry (#grants / DM)

Hi, I'm working on Meridian -- an open-source AI agent framework for DeFi (MIT licensed). We've built a working demo on Arbitrum Sepolia with 100+ autonomous trades using an xstate v5 state machine architecture and viem for all EVM interactions. The agents follow a Sense-Think-Act-Reflect loop and we have an on-chain ERC-721 registry for agent identity. GitHub: https://github.com/amitduabits/meridiandefi. I'd love any feedback on whether this aligns with ESP's current priorities around autonomous infrastructure, and if so, what the best path to a formal application would look like.

---

## B) Arbitrum Foundation

### Message 1 -- Introduction (#introductions / #grants)

Hey all! I'm Amit, building Meridian -- an open-source AI agent framework purpose-built for DeFi. We actually chose Arbitrum as our primary testnet, so we've already got a working demo on Arbitrum Sepolia with over 100 autonomous trades executed. Excited to be deeper in this ecosystem. Quick question -- for the grants program, is there a preference for projects that focus on novel Stylus use cases vs. ones that drive TVL through existing Solidity infrastructure?

### Message 2 -- Technical Question (#dev / #builders)

Working on chain connectors for our agent framework and I have a Stylus-specific question. We currently use viem for all our EVM interactions and have adapters for Uniswap V3, Aave V3, etc. I'm exploring writing some of our hot-path logic (specifically the risk pre-flight validator that checks position sizes, slippage bounds, and gas costs before every trade) in Rust via Stylus for the gas savings. Has anyone benchmarked the actual gas difference for computation-heavy view functions on Stylus vs. Solidity? And is the Stylus SDK stable enough to deploy to Sepolia today?

### Message 3 -- Grant Inquiry (#grants / DM)

Hi -- I'm building Meridian, an open-source AI agent framework for DeFi that's already live on Arbitrum Sepolia. We've executed 100+ autonomous trades in testing, using an xstate state machine for the agent lifecycle, viem chain connectors, and a custom strategy DSL that lets users define trading strategies in near-natural language. We also have an ERC-721 agent registry contract deployed. The whole stack is MIT licensed: https://github.com/amitduabits/meridiandefi. I think this fits well within Arbitrum's DeFi infrastructure goals -- would love to get feedback on a grant application before submitting formally.

---

## C) Kadena

### Message 1 -- Introduction (#introductions / #grants)

Hey Kadena community! I'm Amit, working on an open-source AI agent framework called Meridian that automates DeFi strategies using autonomous agents. Currently live on EVM testnets, but I've been reading about Pact and the chainweb architecture and I'm genuinely interested in bringing the framework to Kadena. The formal verification aspect of Pact is really appealing for an agent system where you need guarantees about what autonomous code can do. Is the grants program currently accepting applications for cross-chain infrastructure projects?

### Message 2 -- Technical Question (#dev / #builders)

I've been digging into Pact for a potential integration with our DeFi agent framework. One thing I'm trying to wrap my head around -- with Pact's lack of unbounded recursion and the built-in formal verification, how do most devs handle complex multi-step DeFi operations? For example, in our system an agent might need to: check a collateral ratio, calculate optimal repayment, execute a swap, then repay a loan -- all atomically. In Solidity we'd do this in a single transaction with internal calls. What's the idiomatic Pact pattern for composing multiple module calls into a single atomic operation?

### Message 3 -- Grant Inquiry (#grants / DM)

Hi, I'm building Meridian -- an MIT-licensed AI agent framework for DeFi. We have a working demo with 100+ autonomous trades on EVM testnets (Arbitrum Sepolia), using a state machine agent architecture and on-chain ERC-721 registry for agent identity. We're exploring Kadena integration because Pact's formal verification properties are a natural fit for autonomous agent safety guarantees -- something no other chain really offers at the language level. GitHub: https://github.com/amitduabits/meridiandefi. I'd appreciate any guidance on whether this kind of cross-chain agent infrastructure project fits Kadena's current grant priorities.

---

## D) Taiko

### Message 1 -- Introduction (#introductions / #grants)

Hey Taiko folks! I'm Amit -- building Meridian, an open-source AI agent framework for DeFi. I've been following Taiko's Based Rollup approach closely and the Ethereum-equivalence angle is really interesting for what we're doing. Since our agents already use viem for all EVM interactions, the idea of a rollup where everything just works identically to L1 is pretty compelling. Is the grants program actively funding infrastructure/tooling projects right now, or is the focus more on end-user dApps?

### Message 2 -- Technical Question (#dev / #builders)

Building DeFi agent infrastructure and evaluating Taiko integration. Since Taiko is a Based Rollup with proposing done on L1, I'm curious about the practical implications for latency-sensitive operations. Our agents execute time-critical trades (arbitrage, liquidation protection) and rely on sub-second state reads. With Based sequencing, what's the realistic block time / confirmation latency on Taiko mainnet right now? And is there anything different about how `eth_call` / state queries behave compared to vanilla Geth, or is it truly 1:1 EVM equivalent at the RPC level?

### Message 3 -- Grant Inquiry (#grants / DM)

Hi -- I'm working on Meridian, an open-source AI agent framework for DeFi (MIT licensed). We've built a working testnet demo with 100+ autonomous trades, featuring an xstate v5 state machine runtime, viem-based chain connectors, and a custom strategy DSL. Since Taiko is fully Ethereum-equivalent, our entire existing stack should deploy without modification, which means we could bring autonomous DeFi agents to Taiko with minimal lift. GitHub: https://github.com/amitduabits/meridiandefi. Would love to discuss whether this kind of infrastructure project aligns with Taiko's grant program goals.

---

## E) Avalanche

### Message 1 -- Introduction (#introductions / #grants)

Hey Avalanche community! I'm Amit, working on Meridian -- an open-source framework for building autonomous AI agents that operate across DeFi protocols. We're currently live on EVM testnets and I'm really interested in the Subnet/L1 model for running dedicated agent infrastructure. The ability to spin up an app-specific chain with custom VM rules could solve some real problems around agent isolation and deterministic execution. Is Ava Labs still actively funding projects through the Blizzard Fund or is there a separate grants track I should be looking at?

### Message 2 -- Technical Question (#dev / #builders)

I'm exploring deploying agent infrastructure on Avalanche and have a question about Subnets (now Avalanche L1s). Our framework runs autonomous DeFi agents that need fast finality for trade execution and ideally some customization at the consensus level for agent-specific rules. Is it practical to run a Subnet L1 with a custom precompile that enforces agent risk parameters (max position sizes, approved contract lists) at the VM level? Has anyone built custom precompiles for HyperSDK or is that still too early? Looking at the docs but hard to tell what's production-ready vs. experimental.

### Message 3 -- Grant Inquiry (#grants / DM)

Hi, I'm building Meridian -- an MIT-licensed AI agent framework for DeFi with a working demo on Arbitrum Sepolia (100+ autonomous trades). Our architecture uses an xstate state machine for agent lifecycle management, viem for EVM interactions, and an ERC-721 on-chain agent registry. We see a strong fit with Avalanche's Subnet model -- running a dedicated agent-execution L1 with custom risk-management precompiles would be a unique offering in the ecosystem. GitHub: https://github.com/amitduabits/meridiandefi. I'd appreciate any feedback on grant fit before putting together a formal application.

---

## F) Solana Foundation

### Message 1 -- Introduction (#introductions / #grants)

Hey everyone! I'm Amit, building Meridian -- an open-source AI agent framework for DeFi. We've been EVM-focused so far (live demo on Arbitrum Sepolia with 100+ autonomous trades), but we already have @solana/web3.js and Anchor in our stack for Solana integration. The speed and low cost on Solana makes it ideal for the kind of high-frequency agent operations we're building. Is the Solana Foundation grants program currently accepting applications for DeFi infrastructure/tooling?

### Message 2 -- Technical Question (#dev / #builders)

Building multi-chain DeFi agent infrastructure and working on our Solana connector. We use @solana/web3.js v2 and Anchor for program interactions. Question about transaction construction for autonomous agents: when an agent needs to execute a multi-step operation (e.g., swap on Jupiter then deposit into a lending protocol), what's the current best practice for building these as a single atomic transaction? Are people using Jito bundles for this, or is versioned transactions with lookup tables sufficient? Also, for an agent that needs to monitor multiple accounts for state changes, is geyser/gRPC the way to go or is websocket `accountSubscribe` still viable at scale?

### Message 3 -- Grant Inquiry (#grants / DM)

Hi -- I'm working on Meridian, an open-source AI agent framework for DeFi (MIT licensed). We have a working demo with 100+ autonomous trades on EVM testnets, built on an xstate v5 state machine with a Sense-Think-Act-Reflect decision cycle. Our Solana integration is in progress with @solana/web3.js v2 and Anchor, targeting Jupiter and Marinade as initial protocol adapters. The framework includes an on-chain agent registry (currently ERC-721, planning a Solana program equivalent). GitHub: https://github.com/amitduabits/meridiandefi. Would love feedback on whether this fits the foundation's grant priorities for DeFi infrastructure.

---

## G) BNB Chain

### Message 1 -- Introduction (#introductions / #grants)

Hey BNB Chain community! I'm Amit -- building an open-source AI agent framework called Meridian that lets developers create autonomous agents for DeFi. We're live on EVM testnets with 100+ automated trades. BSC's large DeFi ecosystem and the opBNB L2 make it a natural target for us. I've been looking at the MVB (Most Valuable Builder) program and the grants -- is there a particular track that fits best for developer tooling / infrastructure projects?

### Message 2 -- Technical Question (#dev / #builders)

Working on our BNB Chain connector for Meridian (DeFi agent framework). We use viem for all EVM interactions and currently have adapters for Uniswap V3 and Aave V3. For BSC, I'm building adapters for PancakeSwap V3 and Venus. Question: PancakeSwap V3 is a Uni V3 fork, but are there any gotchas in the smart contract interfaces that differ from mainnet Uniswap V3? Specifically around the quoter and swap router ABIs. Also, for opBNB -- is the RPC interface fully standard, or are there BNB-specific extensions I should know about for things like gas estimation?

### Message 3 -- Grant Inquiry (#grants / DM)

Hi, I'm building Meridian -- an MIT-licensed AI agent framework for DeFi. We've got a working testnet demo with 100+ autonomous trades, using an xstate state machine runtime and viem EVM connectors. Our architecture includes protocol adapters (swap, lend, stake) and an on-chain ERC-721 agent registry. BSC integration is straightforward since we're already EVM-native, and we're building PancakeSwap V3 + Venus adapters specifically for BNB Chain. GitHub: https://github.com/amitduabits/meridiandefi. Would appreciate guidance on whether the grants program or MVB is the better fit for this kind of project.

---

## H) NEAR Protocol

### Message 1 -- Introduction (#introductions / #grants)

Hey NEAR community! I'm Amit, building Meridian -- an open-source AI agent framework for autonomous DeFi operations. I've been really interested in NEAR's Chain Abstraction vision and the account model -- the named accounts and access keys system is honestly one of the cleanest designs for managing multiple agent identities I've seen. Currently live on EVM testnets but actively exploring NEAR integration. Is the grants program accepting applications for cross-chain infrastructure right now?

### Message 2 -- Technical Question (#dev / #builders)

Building a DeFi agent framework and seriously evaluating NEAR for our next chain integration. The access key model is really interesting for our use case -- we could create function call access keys scoped to specific DeFi contracts, which would give our autonomous agents the minimum privileges they need without exposing full account access. Two questions: (1) Is there a practical limit on the number of function call access keys per account? Our agents might need 10-20 scoped keys for different protocols. (2) For cross-contract calls, what's the current state of promise-based async patterns in near-sdk-rs? Our agents chain multiple operations (check price, calculate amount, execute swap, verify result) and I want to understand the atomicity guarantees.

### Message 3 -- Grant Inquiry (#grants / DM)

Hi -- I'm working on Meridian, an open-source AI agent framework for DeFi (MIT licensed). We have a working demo with 100+ autonomous trades on EVM testnets, built with an xstate v5 state machine and a Sense-Think-Act-Reflect agent loop. We're planning NEAR integration because the account/access-key model maps perfectly to agent permission management -- scoped function call keys per protocol is exactly what autonomous agents need for safe execution. GitHub: https://github.com/amitduabits/meridiandefi. I'd love feedback on grant fit, especially around the Chain Abstraction narrative.

---

## I) Polygon

### Message 1 -- Introduction (#introductions / #grants)

Hey Polygon community! I'm Amit, working on Meridian -- an open-source framework for building autonomous AI agents in DeFi. We're live on EVM testnets (Arbitrum Sepolia) and looking at Polygon as a target chain. The low fees on PoS and the zkEVM's EVM compatibility both look great for agent operations. Is the Polygon Village grants program the right place for developer infrastructure projects, or is there a more specific track?

### Message 2 -- Technical Question (#dev / #builders)

Building DeFi agent infrastructure that needs to work on Polygon PoS and potentially zkEVM. We use viem for all chain interactions. Quick question -- on zkEVM, are there any known differences in gas estimation for complex multi-call transactions compared to PoS? Our agents construct dynamic transactions that include multiple swaps and lending operations in sequence, and accurate gas estimation is critical because agents need to include gas costs in their profitability calculations before executing. Also, is there anything I should watch for with viem's `simulateContract` on zkEVM?

### Message 3 -- Grant Inquiry (#grants / DM)

Hi, I'm building Meridian -- an MIT-licensed AI agent framework for DeFi with a working testnet demo (100+ autonomous trades on Arbitrum Sepolia). The framework uses an xstate state machine runtime, viem chain connectors, a custom strategy DSL, and an ERC-721 on-chain agent registry. Polygon integration is relatively straightforward since we're EVM-native, and the low transaction costs on both PoS and zkEVM make it ideal for agent workloads that produce many small transactions. GitHub: https://github.com/amitduabits/meridiandefi. Would appreciate any direction on grant application fit.

---

## J) Base / Coinbase

### Message 1 -- Introduction (#introductions / #grants)

Hey Base builders! I'm Amit -- working on Meridian, an open-source AI agent framework for DeFi. We've got a working demo on Arbitrum Sepolia with 100+ autonomous trades. Base is high on our list for mainnet deployment given the ecosystem growth and the focus on bringing more people onchain. I've been looking at the Base Builder Grants -- is the program currently prioritizing any specific verticals within DeFi infrastructure?

### Message 2 -- Technical Question (#dev / #builders)

Building autonomous DeFi agents and targeting Base for deployment. We use viem (since Base is built by the team behind it, seemed like the obvious choice). Question about Base-specific infrastructure: for an agent system that needs reliable mempool visibility for MEV protection (our agents use Flashbots-style bundles on mainnet Ethereum to avoid sandwich attacks), what's the equivalent approach on Base? Since it's a single sequencer, is frontrunning even a practical concern, or do we just need to worry about the sequencer ordering? And for high-frequency state reads, is there a recommended RPC provider that handles aggressive polling well on Base?

### Message 3 -- Grant Inquiry (#grants / DM)

Hi -- I'm working on Meridian, an open-source AI agent framework for DeFi (MIT licensed). We have a working demo with 100+ autonomous trades on testnet, built with xstate v5 for agent state management, viem for all chain interactions, and a custom strategy DSL for defining trading logic. We also have an on-chain ERC-721 agent registry for agent identity and permissioning. Base is a natural fit for us given viem compatibility and the growing DeFi ecosystem. GitHub: https://github.com/amitduabits/meridiandefi. Would love feedback on whether this aligns with Base Builder Grants priorities.

---

## K) Sui

### Message 1 -- Introduction (#introductions / #grants)

Hey Sui community! I'm Amit, building Meridian -- an open-source AI agent framework for DeFi. We're currently EVM-focused (live demo on Arbitrum Sepolia, 100+ autonomous trades), but Sui's object-centric model is really interesting for representing agent state and owned positions. The Move language's resource safety also maps well to our risk management requirements. Is the Sui Foundation grants program open for applications from cross-chain infrastructure projects?

### Message 2 -- Technical Question (#dev / #builders)

Evaluating Sui integration for our DeFi agent framework and I have an architecture question about the object model. In our system, each agent manages a portfolio of positions across multiple protocols. On EVM, we track this off-chain and reconcile with on-chain state. On Sui, it seems like owned objects could directly represent agent positions -- the agent's address owns the LP tokens, lending receipts, etc., and the type system enforces what operations are valid. Is this the right mental model? And practically, when an agent needs to do a multi-step operation (swap then deposit), can I compose these in a single programmable transaction block without transferring objects between steps?

### Message 3 -- Grant Inquiry (#grants / DM)

Hi, I'm building Meridian -- an MIT-licensed AI agent framework for DeFi. We have a working demo with 100+ autonomous trades on EVM testnets, using an xstate state machine runtime and a Sense-Think-Act-Reflect decision loop. We're exploring Sui because the object model and Move's linear types are a strong fit for agent-owned assets and safe autonomous execution -- resources can't be accidentally duplicated or dropped, which is exactly the guarantee you want for autonomous DeFi agents. GitHub: https://github.com/amitduabits/meridiandefi. I'd appreciate any direction on grant application fit and whether the foundation is interested in agent infrastructure.

---

## L) Starknet

### Message 1 -- Introduction (#introductions / #grants)

Hey Starknet community! I'm Amit -- building Meridian, an open-source AI agent framework for DeFi. I've been following Starknet's development closely, and the native account abstraction is probably the single most useful feature for autonomous agent systems. Every agent being a smart contract account with custom validation logic is exactly what we need. Is the Starknet Foundation currently running a grants program for DeFi infrastructure?

### Message 2 -- Technical Question (#dev / #builders)

Building DeFi agent infrastructure and exploring Starknet integration. The native account abstraction is a huge draw -- our framework runs autonomous agents that need to execute transactions independently, and having custom `__validate__` and `__execute__` functions in Cairo means we could enforce agent-level risk rules (max trade size, approved contract list, daily loss limits) directly in the account contract. Two questions: (1) What's the current state of Cairo tooling for TypeScript/Node.js integration? We'd need to call our agent account contracts from a Node runtime. (2) For our strategy DSL, we compile user strategies into executable code -- has anyone experimented with compiling a subset of logic to Cairo for on-chain execution?

### Message 3 -- Grant Inquiry (#grants / DM)

Hi -- I'm working on Meridian, an open-source AI agent framework for DeFi (MIT licensed). We've executed 100+ autonomous trades on EVM testnets using an xstate state machine with on-chain ERC-721 agent identity. Starknet's native account abstraction is incredibly compelling for us -- it means agent risk management (position limits, approved contracts, circuit breakers) can be enforced at the account contract level, not just off-chain. We'd be building Cairo account contracts specifically designed for autonomous agent execution. GitHub: https://github.com/amitduabits/meridiandefi. Would love to discuss grant fit for this kind of infrastructure.

---

## M) Optimism

### Message 1 -- Introduction (#introductions / #grants)

Hey Optimism community! I'm Amit, building Meridian -- an open-source AI agent framework for DeFi. We're live on Arbitrum Sepolia for testing and looking at the OP Stack ecosystem as well. Really interested in the RetroPGF model and the broader Optimism Collective vision. For an infrastructure project like ours (developer tooling for autonomous agents), is RetroPGF the right path, or is there a proactive grants track that makes more sense?

### Message 2 -- Technical Question (#dev / #builders)

Building multi-chain DeFi agent infrastructure and working on OP Stack support. We use viem for everything so basic compatibility is fine. My question is about cross-chain agent coordination -- our framework supports agent-to-agent communication via libp2p, but for agents operating across OP Stack chains (OP Mainnet, Base, Zora, etc.), it would be useful to have on-chain messaging between them. Is anyone using the L2-to-L2 cross-chain messaging that's been discussed in the Superchain roadmap? Or is the practical approach today still to go through L1 for inter-L2 communication?

### Message 3 -- Grant Inquiry (#grants / DM)

Hi, I'm building Meridian -- an MIT-licensed AI agent framework for DeFi with a working demo (100+ autonomous trades on testnet). Our stack includes an xstate state machine runtime, viem chain connectors, a strategy DSL, and an ERC-721 on-chain agent registry. We see a strong fit with the Superchain vision -- autonomous agents that can operate across OP Stack chains, coordinating strategies between OP Mainnet, Base, and other chains in the ecosystem. GitHub: https://github.com/amitduabits/meridiandefi. Would appreciate feedback on whether a proactive grant application or RetroPGF is the better path for infrastructure like this.

---

*Last updated: 2026-02-17*
