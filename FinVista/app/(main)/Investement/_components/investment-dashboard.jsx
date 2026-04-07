"use client";
import { useState } from "react";

import { getUserInvestments } from "@/actions/investment";
import { InvestmentSummary } from "./investment-summary";
import { FDCard } from "./fd-card";
import { StockCard } from "./stock-card";
import { SIPCard } from "./sip-card";
import { MutualFundCard } from "./mutual-fund-card";

export function InvestmentDashboard({ initialInvestments }) {
  const [investments, setInvestments] = useState(initialInvestments);

  async function refreshInvestments() {
    const data = await getUserInvestments();
    setInvestments(data);
  }

  const fds = investments.filter(inv => inv.type === "FD");
  const stocks = investments.filter(inv => inv.type === "STOCKS");
  const sips = investments.filter(inv => inv.type === "SIP");
  const mutualFunds = investments.filter(inv => inv.type === "MUTUAL_FUNDS");

  return (
    <div className="space-y-6">
      {/* Summary Section - remains on top */}
      <InvestmentSummary investments={investments} />

      {/* Grid layout with 2 cards per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FDCard fds={fds} refreshInvestments={refreshInvestments} />
        <StockCard stocks={stocks} refreshInvestments={refreshInvestments} />
        <SIPCard sips={sips} refreshInvestments={refreshInvestments} />
        <MutualFundCard mutualFunds={mutualFunds} refreshInvestments={refreshInvestments} />
      </div>
    </div>
  );
}
