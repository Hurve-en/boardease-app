export class BillingHistorySessionError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
    this.name = "BillingHistorySessionError";
  }
}
