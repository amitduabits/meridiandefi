/// <reference types="vite/client" />

export const config = {
  apiUrl: import.meta.env["VITE_API_URL"] || "https://api.meridianagents.xyz",
  wsUrl: import.meta.env["VITE_WS_URL"] || "wss://api.meridianagents.xyz",
  chainExplorerUrl: "https://sepolia.arbiscan.io",
  agentWallet:
    import.meta.env["VITE_AGENT_WALLET"] ||
    "0x0000000000000000000000000000000000000000",
  mockMode: import.meta.env["VITE_MOCK_MODE"] !== "false", // default true
};
