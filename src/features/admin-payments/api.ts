import {api} from "@/lib/api";

export type AdminBill = {
  billId: string;
  tenantName: string;
  roomNumber: string | null;
  billingMonth: string;
  totalAmount: string;
  outstandingBalance: string;
  dueDate: string;
  status: "paid" | "partial" | "unpaid";
};

export type PaymentSubmission = {
  submissionId: string;
  billId: string;
  submittedBy: string;
  amount: string;
  referenceNumber: string | null;
  receiptUrl: string | null;
  status: "pending" | "approved" | "needs_update";
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  paymentDate: string | null;
  tenantFirstName: string | null;
  tenantLastName: string | null;
  billingMonth: string;
  outstandingBalance: string;
};

type BillListResponse = {bills: AdminBill[]};

export async function fetchAdminPayments(month: string, signal: AbortSignal) {
  const [billData, submissions] = await Promise.all([
    api<BillListResponse>(`/api/bills?month=${encodeURIComponent(month)}`, {signal}),
    api<PaymentSubmission[]>("/api/payment-submissions", {signal}),
  ]);
  return {bills: billData.bills, submissions};
}

export function approvePaymentSubmission(
  submission: PaymentSubmission,
  paymentDate: string,
) {
  return api("/api/payments", {
    method: "POST",
    body: JSON.stringify({
      billId: submission.billId,
      amount: Number(submission.amount),
      paymentDate,
      submissionId: submission.submissionId,
    }),
  });
}

export function updatePaymentSubmission(
  submissionId: string,
  status: "pending" | "needs_update",
  reviewNote?: string,
) {
  return api("/api/payment-submissions", {
    method: "PATCH",
    body: JSON.stringify({submissionId, status, reviewNote}),
  });
}

export function recordManualPayment(
  billId: string,
  amount: number,
  paymentDate: string,
) {
  return api("/api/payments", {
    method: "POST",
    body: JSON.stringify({billId, amount, paymentDate}),
  });
}
