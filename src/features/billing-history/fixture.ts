import type { BillingHistory } from "./model";

// Explicit development preview only. Never used as a fallback for failed API requests.
export const previewHistory: BillingHistory = {
  tenant: { name: "Maya Santos", boardingHouseName: "Maple House", roomNumber: "101" },
  bills: [
    { billId: "preview-october", billingMonth: "2026-10-01", totalAmount: 5350, electricCharge: 600, waterCharge: 250, outstandingBalance: 2350, dueDate: "2026-10-10", settledDate: null, status: "partial" },
    { billId: "preview-september", billingMonth: "2026-09-01", totalAmount: 5280, electricCharge: 530, waterCharge: 250, outstandingBalance: 0, dueDate: "2026-09-10", settledDate: "2026-09-08", status: "paid" },
    { billId: "preview-august", billingMonth: "2026-08-01", totalAmount: 5200, electricCharge: 460, waterCharge: 240, outstandingBalance: 0, dueDate: "2026-08-10", settledDate: "2026-08-07", status: "paid" },
  ],
};
