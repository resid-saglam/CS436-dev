// src/services/reportService.ts
import { apiFetch } from "../api/api";

export interface ProfitLossDTO {
  totalRevenue: number;
  totalCost: number;
  profitOrLoss: number;
  status: "Profit" | "Loss";
}

export async function fetchProfitLoss(
  startDate: string,
  endDate: string
): Promise<ProfitLossDTO> {
  return await apiFetch<ProfitLossDTO>(
    `/sales/revenue-report?startDate=${startDate}&endDate=${endDate}`
  );
}
