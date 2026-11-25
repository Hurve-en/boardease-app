import {AdminTabBar} from "@/components/navigation/AdminTabBar";
import { palette, radius } from "@/constants/theme";
import {AdminScreenHeader} from "@/components/navigation/AdminScreenHeader";
import {
  approvePaymentSubmission,
  fetchAdminPayments,
  recordManualPayment,
  updatePaymentSubmission,
  type AdminBill,
  type PaymentSubmission,
} from "@/features/admin-payments/api";
import {historyColors as c, historyFonts as f} from "@/features/billing-history/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import {Inter_400Regular, Inter_700Bold, useFonts} from "@expo-google-fonts/inter";
import {useEffect, useMemo, useState} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";

type BillStatusFilter = "all" | AdminBill["status"];

const currency = new Intl.NumberFormat("en-PH", {style: "currency", currency: "PHP"});

function currentMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}

function monthLabel(value: string) {
  const date = new Date(`${value.slice(0, 7)}-01T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {month: "long", year: "numeric"});
}

function today() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

function money(value: string | number) {
  const amount = Number(value);
  return currency.format(Number.isFinite(amount) ? amount : 0);
}

function shiftMonth(value: string, by: number) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + by, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(date);
}

function submissionStatusLabel(status: PaymentSubmission["status"]) {
  return status === "needs_update" ? "Needs update" : status;
}

function statusStyle(status: AdminBill["status"] | PaymentSubmission["status"]) {
  if (status === "paid" || status === "approved") return styles.statusPaid;
  if (status === "partial" || status === "pending") return styles.statusPending;
  if (status === "needs_update") return styles.statusNeedsUpdate;
  return styles.statusUnpaid;
}

export default function AdminPaymentsScreen() {
  const [fontsLoaded, fontError] = useFonts({Inter_400Regular, Inter_700Bold});
  const [month, setMonth] = useState(currentMonth);
  const [filter, setFilter] = useState<BillStatusFilter>("all");
  const [bills, setBills] = useState<AdminBill[]>([]);
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selectedBill, setSelectedBill] = useState<AdminBill | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<PaymentSubmission | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [manualAmount, setManualAmount] = useState("");
  const [manualDate, setManualDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchAdminPayments(month, controller.signal)
      .then((result) => {
        setBills(result.bills);
        setSubmissions(result.submissions);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Couldn’t load payments.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [month, attempt]);

  const filteredBills = useMemo(
    () => filter === "all" ? bills : bills.filter((bill) => bill.status === filter),
    [bills, filter],
  );

  const selectedBillSubmissions = selectedBill
    ? submissions.filter((submission) => submission.billId === selectedBill.billId)
    : [];

  function changeMonth(next: string) {
    setLoading(true);
    setError("");
    setSelectedBill(null);
    setSelectedSubmission(null);
    setMonth(next);
  }

  function retry() {
    setLoading(true);
    setError("");
    setAttempt((value) => value + 1);
  }

  function openSubmission(submission: PaymentSubmission) {
    setSelectedSubmission(submission);
    setReviewNote(submission.reviewNote ?? "");
    setPaymentDate(submission.paymentDate ?? submission.submittedAt?.slice(0, 10) ?? today());
    setActionError("");
  }

  function closeSubmission() {
    setSelectedSubmission(null);
    setActionError("");
  }

  async function markSubmission(status: "pending" | "needs_update") {
    if (!selectedSubmission || saving) return;
    setSaving(true);
    setActionError("");
    try {
      await updatePaymentSubmission(selectedSubmission.submissionId, status, reviewNote.trim());
      setSelectedSubmission(null);
      setSelectedBill(null);
      retry();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn’t update the receipt status.");
    } finally {
      setSaving(false);
    }
  }

  async function approveSubmission() {
    if (!selectedSubmission || selectedSubmission.status !== "pending" || saving) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) || Number.isNaN(new Date(`${paymentDate}T00:00:00Z`).getTime())) {
      setActionError("Enter a valid payment date in YYYY-MM-DD format.");
      return;
    }
    setSaving(true);
    setActionError("");
    try {
      await approvePaymentSubmission(selectedSubmission, paymentDate);
      setSelectedSubmission(null);
      setSelectedBill(null);
      retry();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn’t approve this receipt.");
    } finally {
      setSaving(false);
    }
  }

  async function submitManualPayment() {
    if (!selectedBill || saving) return;
    const amount = Number(manualAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Enter a payment amount greater than zero.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(manualDate) || Number.isNaN(new Date(`${manualDate}T00:00:00Z`).getTime())) {
      setActionError("Enter a valid payment date in YYYY-MM-DD format.");
      return;
    }
    setSaving(true);
    setActionError("");
    try {
      await recordManualPayment(selectedBill.billId, amount, manualDate);
      setManualAmount("");
      setSelectedBill(null);
      retry();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn’t record this payment.");
    } finally {
      setSaving(false);
    }
  }

  if (!fontsLoaded && !fontError) {
    return <View style={styles.loading}><ActivityIndicator accessibilityLabel="Loading payments" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdminScreenHeader title="Payments" onRefresh={retry} refreshing={loading} />

        <View style={styles.monthRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(shiftMonth(month, -1))} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={18} color={c.brown} />
          </Pressable>
          <Text style={styles.month}>{monthLabel(month)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(shiftMonth(month, 1))} style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={18} color={c.brown} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filters}>
          {(["all", "unpaid", "partial", "paid"] as const).map((value) => (
            <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.filterSelected]}>
              <Text style={[styles.filterLabel, filter === value && styles.filterLabelSelected]}>
                {value === "all" ? `All (${bills.length})` : `${value[0].toUpperCase()}${value.slice(1)} (${bills.filter((bill) => bill.status === value).length})`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.state}><ActivityIndicator color={c.brown} /><Text style={styles.body}>Loading tenant bills…</Text></View>
        ) : error ? (
          <View style={styles.state}>
            <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
            <Pressable onPress={retry} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
          </View>
        ) : filteredBills.length ? (
          <View style={styles.list}>
            {filteredBills.map((bill) => {
              const receipts = submissions.filter((submission) => submission.billId === bill.billId);
              const pendingCount = receipts.filter((submission) => submission.status === "pending").length;
              return (
                <Pressable key={bill.billId} onPress={() => {setSelectedBill(bill); setManualAmount(""); setManualDate(today()); setActionError("");}} style={({pressed}) => [styles.billCard, pressed && styles.pressed]}>
                  <View style={styles.billTop}>
                    <View style={styles.billCopy}>
                      <Text style={styles.tenantName}>{bill.tenantName}</Text>
                      <Text style={styles.billSubtitle}>Room {bill.roomNumber ?? "—"}, {monthLabel(bill.billingMonth)}</Text>
                    </View>
                    <View style={[styles.statusPill, statusStyle(bill.status)]}><Text style={styles.statusText}>{bill.status}</Text></View>
                  </View>
                  <View style={styles.billBottom}>
                    <View>
                      <Text style={styles.billMeta}>Outstanding</Text>
                      <Text style={styles.outstanding}>{money(bill.outstandingBalance)}</Text>
                    </View>
                    <View style={styles.receiptSummary}>
                      <Ionicons name="receipt-outline" size={16} color={pendingCount ? palette.warning : c.muted} />
                      <Text style={styles.receiptSummaryText}>{pendingCount ? `${pendingCount} pending` : `${receipts.length} receipt${receipts.length === 1 ? "" : "s"}`}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color={c.muted} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.state}><Text style={styles.body}>{bills.length ? "No bills match this filter." : "No bills for this month."}</Text></View>
        )}
      </ScrollView>

      <AdminTabBar active="payments" />

      <Modal visible={!!selectedBill} animationType="slide" onRequestClose={() => setSelectedBill(null)}>
        <SafeAreaView style={styles.modalSafe}>
          {selectedBill ? (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.billCopy}>
                  <Text style={styles.modalTitle}>{selectedBill.tenantName}</Text>
                  <Text style={styles.billSubtitle}>Room {selectedBill.roomNumber ?? "—"}, {monthLabel(selectedBill.billingMonth)}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Close payment details" onPress={() => setSelectedBill(null)} style={styles.closeButton}>
                  <Ionicons name="close" size={22} color={c.brown} />
                </Pressable>
              </View>

              <View style={styles.detailCard}>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Bill total</Text><Text style={styles.detailValue}>{money(selectedBill.totalAmount)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Outstanding</Text><Text style={styles.detailValue}>{money(selectedBill.outstandingBalance)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Bill status</Text><View style={[styles.statusPill, statusStyle(selectedBill.status)]}><Text style={styles.statusText}>{selectedBill.status}</Text></View></View>
              </View>

              <Text style={styles.sectionTitle}>Submitted receipts</Text>
              {selectedBillSubmissions.length ? selectedBillSubmissions.map((submission) => (
                <Pressable key={submission.submissionId} onPress={() => openSubmission(submission)} style={({pressed}) => [styles.receiptCard, pressed && styles.pressed]}>
                  <View style={styles.receiptIcon}><Ionicons name="image-outline" size={20} color={c.brown} /></View>
                  <View style={styles.receiptCopy}>
                    <Text style={styles.receiptAmount}>{money(submission.amount)}</Text>
                    <Text style={styles.receiptMeta}>{submission.referenceNumber || "No reference"}, {formatDate(submission.submittedAt)}</Text>
                  </View>
                  <View style={[styles.statusPill, statusStyle(submission.status)]}><Text style={styles.statusText}>{submissionStatusLabel(submission.status)}</Text></View>
                </Pressable>
              )) : <Text style={styles.body}>No receipt images have been submitted for this bill.</Text>}

              {Number(selectedBill.outstandingBalance) > 0 ? (
                <View style={styles.detailCard}>
                  <Text style={styles.sectionTitle}>Record received payment</Text>
                  <Text style={styles.body}>This adds the payment to the bill and updates its paid or partial status.</Text>
                  <TextInput accessibilityLabel="Amount received" keyboardType="decimal-pad" value={manualAmount} onChangeText={setManualAmount} placeholder="Amount in PHP" style={styles.input} />
                  <TextInput accessibilityLabel="Payment date" value={manualDate} onChangeText={setManualDate} placeholder="YYYY-MM-DD" style={styles.input} />
                  <Pressable disabled={saving} onPress={() => void submitManualPayment()} style={({pressed}) => [styles.primaryButton, (pressed || saving) && styles.pressed]}>
                    <Text style={styles.primaryButtonLabel}>{saving ? "Saving…" : "Record payment"}</Text>
                  </Pressable>
                </View>
              ) : null}
              {actionError ? <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text> : null}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>

      <Modal visible={!!selectedSubmission} animationType="slide" onRequestClose={closeSubmission}>
        <SafeAreaView style={styles.modalSafe}>
          {selectedSubmission ? (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.billCopy}>
                  <Text style={styles.modalTitle}>{selectedSubmission.tenantFirstName} {selectedSubmission.tenantLastName}</Text>
                  <Text style={styles.billSubtitle}>{monthLabel(selectedSubmission.billingMonth)}, reference {selectedSubmission.referenceNumber || "—"}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Close receipt review" onPress={closeSubmission} style={styles.closeButton}>
                  <Ionicons name="close" size={22} color={c.brown} />
                </Pressable>
              </View>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Submitted amount</Text><Text style={styles.detailValue}>{money(selectedSubmission.amount)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Submitted</Text><Text style={styles.detailValue}>{formatDate(selectedSubmission.submittedAt)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Status</Text><View style={[styles.statusPill, statusStyle(selectedSubmission.status)]}><Text style={styles.statusText}>{submissionStatusLabel(selectedSubmission.status)}</Text></View></View>
                {selectedSubmission.reviewNote ? <Text style={styles.reviewNote}>Review note: {selectedSubmission.reviewNote}</Text> : null}
              </View>

              {selectedSubmission.receiptUrl ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Open receipt image" onPress={() => setReceiptPreview(selectedSubmission.receiptUrl)} style={styles.receiptImageButton}>
                  <Image source={{uri: selectedSubmission.receiptUrl}} resizeMode="contain" style={styles.receiptImage} />
                  <Text style={styles.imageHint}>Tap image to enlarge</Text>
                </Pressable>
              ) : <Text style={styles.body}>Receipt image unavailable.</Text>}

              {selectedSubmission.status !== "approved" ? (
                <View style={styles.detailCard}>
                  <Text style={styles.sectionTitle}>Review this receipt</Text>
                  <TextInput accessibilityLabel="Review note" value={reviewNote} onChangeText={setReviewNote} placeholder="Note for the tenant (optional)" multiline style={[styles.input, styles.noteInput]} />
                  <TextInput accessibilityLabel="Payment date" value={paymentDate} onChangeText={setPaymentDate} placeholder="YYYY-MM-DD" style={styles.input} />
                  {selectedSubmission.status === "pending" ? (
                    <Pressable disabled={saving} onPress={() => void approveSubmission()} style={({pressed}) => [styles.primaryButton, (pressed || saving) && styles.pressed]}>
                      <Text style={styles.primaryButtonLabel}>{saving ? "Approving…" : "Approve & record payment"}</Text>
                    </Pressable>
                  ) : (
                    <Pressable disabled={saving} onPress={() => void markSubmission("pending")} style={({pressed}) => [styles.secondaryButton, (pressed || saving) && styles.pressed]}>
                      <Text style={styles.secondaryButtonLabel}>{saving ? "Updating…" : "Set back to pending"}</Text>
                    </Pressable>
                  )}
                  {selectedSubmission.status === "pending" ? (
                    <Pressable disabled={saving} onPress={() => void markSubmission("needs_update")} style={({pressed}) => [styles.secondaryButton, (pressed || saving) && styles.pressed]}>
                      <Text style={styles.secondaryButtonLabel}>Request an update</Text>
                    </Pressable>
                  ) : null}
                  {actionError ? <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text> : null}
                </View>
              ) : null}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>

      <Modal visible={!!receiptPreview} transparent animationType="fade" onRequestClose={() => setReceiptPreview(null)}>
        <View style={styles.previewBackdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close receipt image" onPress={() => setReceiptPreview(null)} style={styles.previewClose}>
            <Ionicons name="close" size={24} color={c.white} />
          </Pressable>
          {receiptPreview ? <Image source={{uri: receiptPreview}} resizeMode="contain" style={styles.previewImage} /> : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: c.background},
  loading: {flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background},
  content: {flexGrow: 1, width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24},
  pressed: {opacity: 0.68},
  monthRow: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14},
  monthButton: {width: 36, height: 36, borderRadius: radius.control, alignItems: "center", justifyContent: "center", backgroundColor: c.white, borderWidth: 1, borderColor: c.border},
  month: {fontFamily: f.bold, fontSize: 15, color: c.text},
  filterScroll: {height: 40, flexGrow: 0, marginBottom: 10},
  filters: {alignItems: "center", gap: 8},
  filter: {paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: c.white, borderWidth: 1, borderColor: c.border},
  filterSelected: {backgroundColor: palette.surfaceSelected, borderColor: palette.borderStrong},
  filterLabel: {fontFamily: f.regular, fontSize: 12, color: c.muted, textTransform: "capitalize"},
  filterLabelSelected: {fontFamily: f.bold, color: c.text},
  list: {gap: 8},
  billCard: {padding: 12, borderRadius: radius.card, borderWidth: 1, borderColor: c.border, backgroundColor: c.white},
  billTop: {flexDirection: "row", alignItems: "flex-start", gap: 10},
  billCopy: {flex: 1},
  tenantName: {fontFamily: f.bold, fontSize: 14, color: c.text},
  billSubtitle: {fontFamily: f.regular, fontSize: 12, color: c.muted, marginTop: 4},
  statusPill: {alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill},
  statusText: {fontFamily: f.bold, fontSize: 12, color: c.text, textTransform: "capitalize"},
  statusPaid: {backgroundColor: c.paid},
  statusPending: {backgroundColor: c.partial},
  statusUnpaid: {backgroundColor: palette.dangerSurface},
  statusNeedsUpdate: {backgroundColor: palette.dangerSurface},
  billBottom: {flexDirection: "row", alignItems: "flex-end", gap: 9, marginTop: 10},
  billMeta: {fontFamily: f.regular, fontSize: 12, color: c.muted},
  outstanding: {fontFamily: f.bold, fontSize: 16, color: c.text, marginTop: 2, fontVariant: ["tabular-nums"]},
  receiptSummary: {flexDirection: "row", alignItems: "center", gap: 5, marginLeft: "auto", paddingBottom: 2},
  receiptSummaryText: {fontFamily: f.regular, fontSize: 12, color: c.muted},
  state: {flex: 1, minHeight: 220, alignItems: "center", justifyContent: "center", gap: 12, padding: 20},
  body: {fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.muted},
  error: {fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: palette.danger},
  retry: {paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: c.brown},
  retryText: {fontFamily: f.bold, fontSize: 13, color: c.white},
  modalSafe: {flex: 1, backgroundColor: c.background},
  modalContent: {width: "100%", maxWidth: 600, alignSelf: "center", padding: 16, paddingBottom: 28, gap: 10},
  modalHeader: {flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8},
  modalTitle: {fontFamily: f.bold, fontSize: 20, color: c.text},
  closeButton: {width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: c.beige},
  detailCard: {padding: 14, gap: 10, borderRadius: radius.card, borderWidth: 1, borderColor: c.border, backgroundColor: c.white},
  detailRow: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12},
  detailLabel: {fontFamily: f.regular, fontSize: 12, color: c.muted},
  detailValue: {fontFamily: f.bold, fontSize: 13, color: c.text},
  sectionTitle: {fontFamily: f.bold, fontSize: 15, color: c.text},
  receiptCard: {minHeight: 56, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.card, borderWidth: 1, borderColor: c.border, backgroundColor: c.white},
  receiptIcon: {width: 32, height: 32, borderRadius: radius.control, alignItems: "center", justifyContent: "center", backgroundColor: c.beige},
  receiptCopy: {flex: 1},
  receiptAmount: {fontFamily: f.bold, fontSize: 13, color: c.text},
  receiptMeta: {fontFamily: f.regular, fontSize: 12, color: c.muted, marginTop: 3},
  reviewNote: {fontFamily: f.regular, fontSize: 12, lineHeight: 18, color: c.muted, paddingTop: 6},
  receiptImageButton: {height: 260, alignItems: "center", justifyContent: "center", padding: 8, borderRadius: radius.card, backgroundColor: palette.brandDeep},
  receiptImage: {width: "100%", height: 220},
  imageHint: {fontFamily: f.regular, fontSize: 12, color: c.white, marginTop: 4},
  input: {minHeight: 44, borderRadius: radius.control, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12, fontFamily: f.regular, fontSize: 13, color: c.text, backgroundColor: c.white},
  noteInput: {minHeight: 76, textAlignVertical: "top", paddingTop: 12},
  primaryButton: {minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: c.brown, paddingHorizontal: 14},
  primaryButtonLabel: {fontFamily: f.bold, fontSize: 13, color: c.white},
  secondaryButton: {minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.white, paddingHorizontal: 14},
  secondaryButtonLabel: {fontFamily: f.bold, fontSize: 13, color: c.text},
  previewBackdrop: {flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.94)"},
  previewImage: {width: "100%", height: "85%"},
  previewClose: {position: "absolute", top: 48, right: 18, zIndex: 1, width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "rgba(255,255,255,0.16)"},
});
