import { api } from "./api";

export type Notice = {
  id: number;
  billId: string;
  kind: string;
  eventKey: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type Inbox = { items: Notice[]; unread: number; next: number | null };

export function loadInbox(signal?: AbortSignal, before?: number) {
  return api<Inbox>("/api/notifications" + (before ? `?before=${before}` : ""), { signal });
}
