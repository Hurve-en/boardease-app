import {api} from "@/lib/api";

export type AdminDashboardData = {
  rooms: {total: number; occupied: number; unoccupied: number};
  tenants: {total: number; active: number};
  billing: {
    month: string;
    totalBilled: string;
    totalCollected: string;
    totalOutstanding: string;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
  };
  overdue: {count: number; amount: string};
  recentPayments: {
    paymentId: string;
    tenantName: string;
    amount: string;
    paymentDate: string;
    billingMonth: string;
  }[];
};

export function fetchAdminDashboard(signal: AbortSignal) {
  return api<AdminDashboardData>("/api/dashboard", {signal});
}
