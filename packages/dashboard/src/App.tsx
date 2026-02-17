import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { AgentsPage } from "./pages/agents";
import { PortfolioPage } from "./pages/portfolio";
import { TransactionsPage } from "./pages/transactions";
import { RiskPage } from "./pages/risk";
import { HealthPage } from "./pages/health";

export function App() {
  return (
    <div className="flex min-h-screen bg-[#0A0B10]">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen">
        <Routes>
          <Route path="/" element={<AgentsPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/risk" element={<RiskPage />} />
          <Route path="/health" element={<HealthPage />} />
        </Routes>
      </main>
    </div>
  );
}
