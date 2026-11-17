export type BillStatus = "paid" | "partial" | "unpaid";
export type StatusFilter = BillStatus | "all";
export type Utility = "electricity" | "water";

export type HistoryBill = {
  billId: string;
  billingMonth: string;
  totalAmount: number;
  electricCharge: number;
  waterCharge: number;
  outstandingBalance: number;
  dueDate: string;
  settledDate: string | null;
  status: BillStatus;
};

export type BillingHistory = {
  tenant: { name: string; boardingHouseName: string | null; roomNumber: string | null };
  bills: HistoryBill[];
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency", currency: "PHP", minimumFractionDigits: 2,
});
const shortCurrency = new Intl.NumberFormat("en-PH", {
  style: "currency", currency: "PHP", maximumFractionDigits: 0,
});
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const statusLabels: Record<BillStatus, string> = { paid: "Paid", partial: "Partial", unpaid: "Unpaid" };
export const formatMoney = (value: number) => currency.format(value);
export const formatChartMoney = (value: number) => shortCurrency.format(value);
export const monthName = (date: string) => monthNames[Number(date.slice(5, 7)) - 1];
export const billMonthLabel = (date: string) => `${monthName(date)} ${date.slice(0, 4)}`;
export const shortDate = (date: string) => `${Number(date.slice(8, 10))} ${monthName(date).slice(0, 3)}`;
export const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();

export function filterBills(bills: HistoryBill[], year: string, status: StatusFilter) {
  return bills.filter(bill => (year === "all" || bill.billingMonth.startsWith(`${year}-`)) &&
    (status === "all" || bill.status === status)).sort((a, b) => b.billingMonth.localeCompare(a.billingMonth));
}

export function chartBills(bills: HistoryBill[], year: string) {
  // Status filters affect the list only, so the utility trend stays meaningful.
  return filterBills(bills, year, "all").slice(0, 3).reverse();
}

export function chartRange(bills: Pick<HistoryBill, "billingMonth">[]) {
  const first = bills[0]?.billingMonth;
  const last = bills[bills.length - 1]?.billingMonth;
  if (!first || !last) return "";
  const start = monthName(first).slice(0, 3);
  const end = monthName(last).slice(0, 3);
  if (bills.length === 1) return `${start} ${first.slice(0, 4)}`;
  return first.slice(0, 4) === last.slice(0, 4)
    ? `${start}–${end} ${last.slice(0, 4)}`
    : `${start} ${first.slice(0, 4)}–${end} ${last.slice(0, 4)}`;
}

// Shared by dots and month labels so both use the same plot coordinates.
export function chartX(index: number, count: number, width: number) {
  const inset = Math.min(24, width / 2);
  return count <= 1 ? width / 2 : inset + index * (width - inset * 2) / (count - 1);
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid billing history response.");
  return value as Record<string, unknown>;
}
function requiredString(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Invalid billing history response.");
  return value;
}
function optionalString(value: unknown): string | null {
  return value == null ? null : requiredString(value);
}
function money(value: unknown): number {
  if ((typeof value !== "number" && typeof value !== "string") || !/^\d+(\.\d{1,2})?$/.test(String(value))) {
    throw new Error("Invalid bill amount.");
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount > 99999999.99) throw new Error("Invalid bill amount.");
  return amount;
}
function date(value: unknown): string {
  const text = requiredString(value);
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(text) ||
      new Date(`${text}T00:00:00Z`).toISOString().slice(0, 10) !== text) throw new Error("Invalid bill date.");
  return text;
}

// Validate the proposed tenant API contract at the boundary; never render malformed amounts.
export function parseBillingHistory(value: unknown): BillingHistory {
  const data = object(value);
  const tenant = object(data.tenant);
  if (!Array.isArray(data.bills)) throw new Error("Invalid billing history response.");
  const ids = new Set<string>();
  const months = new Set<string>();
  const bills = data.bills.map(value => {
    const bill = object(value);
    const status = bill.status;
    if (status !== "paid" && status !== "partial" && status !== "unpaid") throw new Error("Invalid bill status.");
    const result: HistoryBill = {
      billId: requiredString(bill.billId), billingMonth: date(bill.billingMonth),
      totalAmount: money(bill.totalAmount), electricCharge: money(bill.electricCharge),
      waterCharge: money(bill.waterCharge), outstandingBalance: money(bill.outstandingBalance),
      dueDate: date(bill.dueDate), settledDate: bill.settledDate == null ? null : date(bill.settledDate), status,
    };
    if (result.billingMonth.slice(8) !== "01" || ids.has(result.billId) || months.has(result.billingMonth) ||
        result.outstandingBalance > result.totalAmount ||
        (status === "paid" && result.outstandingBalance !== 0) ||
        (status === "unpaid" && result.outstandingBalance !== result.totalAmount) ||
        (status === "partial" && (result.outstandingBalance === 0 || result.outstandingBalance === result.totalAmount))) {
      throw new Error("Inconsistent billing history response.");
    }
    ids.add(result.billId);
    months.add(result.billingMonth);
    return result;
  });
  return { tenant: { name: requiredString(tenant.name), boardingHouseName: optionalString(tenant.boardingHouseName), roomNumber: optionalString(tenant.roomNumber) }, bills };
}

export function chartScale(values: number[]) {
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  // Round the range to useful currency ticks, keeping constant/zero series visible.
  const range = Math.max(max - (values.length ? Math.min(...values) : min), max * 0.2, 20);
  const step = Math.max(10, Math.ceil(range / 2 / 50) * 50);
  const bottom = Math.max(0, Math.floor(Math.min(...values, max) / 50) * 50);
  const top = Math.max(bottom + step * 2, Math.ceil(max / step) * step);
  return { bottom, top, ticks: [top, (top + bottom) / 2, bottom] };
}
