// ---------------------------------------------------------------------------
// @meridian/sdk — communication module public API
// ---------------------------------------------------------------------------

export {
  P2PNode,
  CommunicationError,
  type P2PNodeConfig,
  type IP2PNode,
} from "./p2p-node.js";

export {
  DiscoveryService,
  DiscoveryError,
  type AgentProfile,
} from "./discovery.js";

export {
  Messenger,
  MessengerError,
  type MessageType,
  type AgentMessage,
} from "./messenger.js";

export {
  NegotiationProtocol,
  NegotiationError,
  type NegotiationState,
  type TaskProposal,
  type NegotiationResult,
} from "./negotiation.js";

export {
  PaymentChannel,
  PaymentChannelError,
  type PaymentChannelConfig,
  type PaymentStatus,
} from "./payment-channel.js";
