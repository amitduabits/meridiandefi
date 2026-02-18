/// <reference types="vite/client" />

export const config = {
  apiUrl: import.meta.env["VITE_API_URL"] || "https://meridiandefi-production.up.railway.app",
  wsUrl: import.meta.env["VITE_WS_URL"] || "wss://meridiandefi-production.up.railway.app",
  chainExplorerUrl: "https://sepolia.arbiscan.io",
  agentWallet:
    import.meta.env["VITE_AGENT_WALLET"] ||
    "0xf12Eebe60EC31c58A488FEE0F57D890C2bd4Bf8d",
  mockMode: import.meta.env["VITE_MOCK_MODE"] === "true", // default false — use live API
};
