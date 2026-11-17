// lib/bills.ts
import { api } from "./api";

export type Bill = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status?: "paid" | "partial" | "unpaid";
  outstandingBalance?: number;
};

type ApiBill = Omit<Bill, "amount" | "outstandingBalance"> & {
  amount: number | string;
  outstandingBalance?: number | string;
};

export const getBills = async () => {
  const bills = await api<ApiBill[]>("/api/bills");
  return bills.map((bill) => ({
    ...bill,
    amount: Number(bill.amount),
    outstandingBalance:
      bill.outstandingBalance === undefined
        ? undefined
        : Number(bill.outstandingBalance),
  }));
};
export const getBill = (id: string) => api<Bill>(`/api/bills/${id}`);
export const createBill = (data: Omit<Bill, "id">) =>
  api<Bill>("/api/bills", { method: "POST", body: JSON.stringify(data) });
export const deleteBill = (id: string) =>
  api(`/api/bills/${id}`, { method: "DELETE" });
