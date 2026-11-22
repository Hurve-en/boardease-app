import { TenantTabBar } from "@/components/navigation/TenantTabBar";
import { fetchBillingHistory } from "@/features/billing-history/api";
import { HistoryIcon } from "@/features/billing-history/HistoryIcon";
import {
    billMonthLabel,
    formatMoney,
    type BillingHistory,
    type HistoryBill,
} from "@/features/billing-history/model";
import { submitPayment } from "@/lib/payments";
import {
    Inter_400Regular,
    Inter_700Bold,
    useFonts,
} from "@expo-google-fonts/inter";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const c = {
    background: "#F7F4EE",
    brown: "#583E30",
    text: "#27211D",
    muted: "#857B70",
    border: "#E6DDD2",
    beige: "#EDE2D5",
    white: "#FFFFFF",
    green: "#37704A",
    red: "#A53F32",
};

const PAYMENT_METHODS = ["GCash", "Maya", "Bank transfer", "Cash"] as const;

function todayInManila() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(
        new Date(),
    );
}

function displayDate(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00Z`));
}

export default function PaymentSubmissionScreen() {
    const { billId } = useLocalSearchParams<{ billId: string }>();
    const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
    const [bill, setBill] = useState<HistoryBill | null>(null);
    const [tenant, setTenant] = useState<BillingHistory["tenant"] | null>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(todayInManila());
    const [referenceNumber, setReferenceNumber] = useState("");
    const [paymentMethod, setPaymentMethod] =
        useState<(typeof PAYMENT_METHODS)[number]>("GCash");
    const [methodMenuOpen, setMethodMenuOpen] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [receipt, setReceipt] =
        useState<ImagePicker.ImagePickerAsset | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        fetchBillingHistory(controller.signal)
        .then((history) => {
            if (active) {
            setTenant(history.tenant);
            setBill(history.bills.find((item) => item.billId === billId) ?? null);
            }
        })
        .catch((cause) => {
            if (active) {
            setError(
                cause instanceof Error ? cause.message : "Could not load this bill.",
            );
            }
        })
        .finally(() => {
            if (active) setLoading(false);
        });

        return () => {
        active = false;
        controller.abort();
        };
    }, [billId]);

    async function chooseReceipt() {
        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        quality: 0.8,
        });

        if (!result.canceled) {
        setReceipt(result.assets[0]);
        setError("");
        }
    }

    function validateForm() {
        const amountCents = Math.round(Number(amount) * 100);
        const balanceCents = Math.round((bill?.outstandingBalance ?? 0) * 100);
        const parsedDate = Date.parse(`${paymentDate}T00:00:00Z`);
        const validDate =
        Number.isFinite(parsedDate) &&
        new Date(parsedDate).toISOString().slice(0, 10) === paymentDate;

        if (!bill) return "Bill not found.";
        if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(amount) || amountCents <= 0) {
        return "Enter an amount greater than zero, with up to two decimals.";
        }
        if (amountCents > balanceCents) {
        return "The amount cannot exceed the outstanding balance.";
        }
        if (!validDate) return "Enter the payment date as YYYY-MM-DD.";
        if (!referenceNumber.trim()) return "Enter the payment reference number.";
        if (!receipt?.base64) return "Choose a receipt image first.";
        if (!confirmed) return "Confirm that these payment details are correct.";

        return "";
    }

    async function sendSubmission() {
        const validationMessage = validateForm();
        if (validationMessage) {
        setError(validationMessage);
        return;
        }

        setSaving(true);
        setError("");

        try {
        await submitPayment(
            {
            billId: bill!.billId,
            amount: Number(amount),
            referenceNumber: referenceNumber.trim(),
            paymentDate,
            },
            receipt!,
        );
        setSuccess(true);
        } catch (cause) {
        setError(
            cause instanceof Error
            ? cause.message
            : "Could not submit payment proof.",
        );
        } finally {
        setSaving(false);
        }
    }

    if (!fontsLoaded || loading) {
        return (
        <SafeAreaView style={styles.loadingScreen}>
            <ActivityIndicator color={c.brown} accessibilityLabel="Loading payment form" />
        </SafeAreaView>
        );
    }

    if (!bill) {
        return (
        <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
            <View style={styles.brandHeader}>
            <View style={styles.brand}>
                <View style={styles.brandMark}><HistoryIcon name="brand" /></View>
                <Text style={styles.brandName}>BoardEase</Text>
            </View>
            </View>
            <View style={styles.errorState}>
            <Text style={styles.pageTitle}>Payments</Text>
            <Text style={styles.bodyText}>{error || "Bill not found."}</Text>
            <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
                <Text style={styles.secondaryButtonText}>Back to bill</Text>
            </Pressable>
            </View>
            <TenantTabBar active="history" />
        </SafeAreaView>
        );
    }

    const paid = bill.totalAmount - bill.outstandingBalance;
    const rent = bill.totalAmount - bill.electricCharge - bill.waterCharge;

    if (success) {
        return (
        <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
            <View style={styles.brandHeader}>
            <View style={styles.brand}>
                <View style={styles.brandMark}><HistoryIcon name="brand" /></View>
                <Text style={styles.brandName}>BoardEase</Text>
            </View>
            </View>
            <View style={styles.successState}>
            <View style={styles.successIcon}><Ionicons name="checkmark" size={28} color={c.green} /></View>
            <Text style={styles.successTitle}>Payment proof submitted</Text>
            <Text style={styles.bodyText}>
                Your payment is awaiting owner review. Your balance updates after approval.
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => router.back()}>
                <Text style={styles.primaryButtonText}>Back to bill</Text>
            </Pressable>
            </View>
            <TenantTabBar active="history" />
        </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <View style={styles.brandHeader}>
            <View style={styles.brand}>
            <View style={styles.brandMark}><HistoryIcon name="brand" /></View>
            <Text style={styles.brandName}>BoardEase</Text>
            </View>
            <View style={styles.avatar}>
            <Text style={styles.avatarText}>{tenant?.name.slice(0, 1).toUpperCase() ?? "—"}</Text>
            </View>
        </View>

        <View style={styles.headingWrap}>
            <Text accessibilityRole="header" style={styles.pageTitle}>Payments</Text>
        </View>

        <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.billContext}>
            {billMonthLabel(bill.billingMonth).toUpperCase()}
            {tenant?.roomNumber ? ` · ROOM ${tenant.roomNumber}` : ""}
            </Text>

            <View style={styles.billCard}>
            <MoneyRow label="Monthly rent" value={formatMoney(rent)} />
            <MoneyRow label="Electricity" value={formatMoney(bill.electricCharge)} />
            <MoneyRow label="Water" value={formatMoney(bill.waterCharge)} />
            <View style={styles.divider} />
            <MoneyRow label="Total bill" value={formatMoney(bill.totalAmount)} strong />
            <MoneyRow label="Payments recorded" value={formatMoney(paid)} />
            <View style={styles.balanceBox}>
                <Text style={styles.balanceLabel}>OUTSTANDING BALANCE</Text>
                <Text style={styles.balanceAmount}>{formatMoney(bill.outstandingBalance)}</Text>
                <Text style={styles.balanceDue}>Due {displayDate(bill.dueDate)}</Text>
            </View>
            </View>

            <Text accessibilityRole="header" style={styles.formTitle}>Submit proof of payment</Text>

            <Field label="Amount paid *" hint="Enter the amount shown on your receipt.">
            <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="₱0.00"
                placeholderTextColor={c.muted}
            />
            </Field>

            <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Payment method *</Text>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Payment method, ${paymentMethod}`}
                accessibilityState={{ expanded: methodMenuOpen }}
                style={styles.selectInput}
                onPress={() => setMethodMenuOpen((open) => !open)}
            >
                <Text style={styles.inputText}>{paymentMethod}</Text>
                <Ionicons name={methodMenuOpen ? "chevron-up" : "chevron-down"} size={16} color={c.text} />
            </Pressable>
            {methodMenuOpen ? (
                <View style={styles.methodMenu}>
                {PAYMENT_METHODS.map((method) => (
                    <Pressable
                    key={method}
                    style={styles.methodOption}
                    onPress={() => {
                        setPaymentMethod(method);
                        setMethodMenuOpen(false);
                    }}
                    >
                    <Text style={styles.inputText}>{method}</Text>
                    {method === paymentMethod ? <Ionicons name="checkmark" size={16} color={c.brown} /> : null}
                    </Pressable>
                ))}
                </View>
            ) : null}
            <Text style={styles.fieldHint}>Select how you sent your payment.</Text>
            </View>

            <Field label="Date paid *" hint="Use the transaction date on your receipt.">
            <TextInput
                style={styles.input}
                value={paymentDate}
                onChangeText={setPaymentDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={c.muted}
                autoCapitalize="none"
            />
            </Field>

            <Field label="Reference number *" hint="Copy the transaction reference from your receipt.">
            <TextInput
                style={styles.input}
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                placeholder="Enter the transaction reference"
                placeholderTextColor={c.muted}
                autoCapitalize="none"
            />
            </Field>

            <View style={styles.proofSection}>
            <Text style={styles.fieldLabel}>Proof of payment *</Text>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={receipt ? "Choose a different receipt image" : "Choose receipt image"}
                onPress={() => void chooseReceipt()}
                style={styles.uploadBox}
            >
                <Ionicons name="arrow-up" size={25} color={c.brown} />
                <Text style={styles.uploadTitle}>{receipt ? "Choose a different image" : "Choose receipt image"}</Text>
                <Text style={styles.uploadHint}>JPG or PNG · 1 image</Text>
            </Pressable>
            {receipt ? (
                <View style={styles.receiptCard}>
                <Image source={{ uri: receipt.uri }} style={styles.receiptThumbnail} resizeMode="cover" />
                <View style={styles.receiptDetails}>
                    <Text numberOfLines={1} style={styles.receiptName}>{receipt.fileName ?? "Payment receipt"}</Text>
                    <Text style={styles.receiptStatus}>
                    {receipt.fileSize ? `${(receipt.fileSize / (1024 * 1024)).toFixed(1)} MB` : "Image"} · Ready to submit
                    </Text>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove receipt image"
                    onPress={() => setReceipt(null)}
                    style={styles.removeReceipt}
                >
                    <Ionicons name="close" size={18} color={c.muted} />
                </Pressable>
                </View>
            ) : null}
            </View>

            {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}

            <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: confirmed }}
            onPress={() => setConfirmed((value) => !value)}
            style={styles.confirmRow}
            >
            <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
                {confirmed ? <Ionicons name="checkmark" size={14} color={c.white} /> : null}
            </View>
            <Text style={styles.confirmText}>I confirm these payment details are correct.</Text>
            </Pressable>

            <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: saving || !confirmed, busy: saving }}
            disabled={saving || !confirmed}
            onPress={() => void sendSubmission()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabledButton]}
            >
            {saving ? <ActivityIndicator color={c.white} /> : <Text style={styles.primaryButtonText}>Submit payment proof</Text>}
            </Pressable>

            <Text style={styles.footerNote}>
            Your payment will appear as awaiting review. Your balance updates after owner approval.
            </Text>
        </ScrollView>

        <TenantTabBar active="history" />
        </SafeAreaView>
    );
    }

    function Field({
    label,
    hint,
    children,
    }: {
    label: string;
    hint: string;
    children: React.ReactNode;
    }) {
    return (
        <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {children}
        <Text style={styles.fieldHint}>{hint}</Text>
        </View>
    );
    }

    function MoneyRow({
    label,
    value,
    strong = false,
    }: {
    label: string;
    value: string;
    strong?: boolean;
    }) {
    return (
        <View style={styles.moneyRow}>
        <Text style={[styles.moneyLabel, strong && styles.moneyStrong]}>{label}</Text>
        <Text style={[styles.moneyValue, strong && styles.moneyStrong]}>{value}</Text>
        </View>
    );
    }

    const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background },
    brandHeader: { minHeight: 66, marginHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: c.border },
    brand: { flexDirection: "row", alignItems: "center", gap: 10 },
    brandMark: { width: 36, height: 36, borderRadius: 9, backgroundColor: c.brown, alignItems: "center", justifyContent: "center" },
    brandName: { fontFamily: "Inter_700Bold", fontSize: 19, color: c.brown },
    avatar: { width: 38, height: 38, borderRadius: 20, backgroundColor: c.beige, alignItems: "center", justifyContent: "center" },
    avatarText: { fontFamily: "Inter_700Bold", color: c.brown, fontSize: 13 },
    headingWrap: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, backgroundColor: c.white },
    pageTitle: { fontFamily: "Inter_700Bold", fontSize: 23, color: c.text },
    content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, gap: 0 },
    billContext: { marginBottom: 16, fontFamily: "Inter_700Bold", fontSize: 11, color: c.brown, letterSpacing: 0.15 },
    billCard: { padding: 19, borderWidth: 1, borderColor: c.border, borderRadius: 16, backgroundColor: c.white },
    moneyRow: { minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    moneyLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.muted },
    moneyValue: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.text },
    moneyStrong: { fontFamily: "Inter_700Bold", fontSize: 15, color: c.text },
    divider: { height: 1, backgroundColor: c.border, marginVertical: 9 },
    balanceBox: { marginTop: 10, padding: 14, borderRadius: 12, backgroundColor: c.beige },
    balanceLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: c.brown },
    balanceAmount: { marginTop: 4, fontFamily: "Inter_700Bold", fontSize: 26, color: c.brown },
    balanceDue: { marginTop: 3, fontFamily: "Inter_400Regular", fontSize: 11, color: c.muted },
    formTitle: { marginTop: 27, marginBottom: 3, fontFamily: "Inter_700Bold", fontSize: 18, color: c.text },
    fieldWrap: { marginTop: 13 },
    fieldLabel: { marginBottom: 8, fontFamily: "Inter_700Bold", fontSize: 12, color: c.text },
    input: { height: 47, borderWidth: 1, borderColor: c.border, borderRadius: 9, paddingHorizontal: 14, backgroundColor: c.white, fontFamily: "Inter_400Regular", fontSize: 14, color: c.text },
    inputText: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.text },
    fieldHint: { marginTop: 8, fontFamily: "Inter_400Regular", fontSize: 11, color: c.muted },
    selectInput: { height: 47, borderWidth: 1, borderColor: c.border, borderRadius: 9, paddingHorizontal: 14, backgroundColor: c.white, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    methodMenu: { marginTop: 4, borderWidth: 1, borderColor: c.border, borderRadius: 9, backgroundColor: c.white, overflow: "hidden" },
    methodOption: { minHeight: 43, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: c.border },
    proofSection: { marginTop: 21 },
    uploadBox: { minHeight: 112, alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderStyle: "dashed", borderColor: c.border, borderRadius: 13, backgroundColor: c.white },
    uploadTitle: { fontFamily: "Inter_700Bold", fontSize: 13, color: c.brown },
    uploadHint: { fontFamily: "Inter_400Regular", fontSize: 10, color: c.muted },
    receiptCard: { minHeight: 72, marginTop: 10, padding: 9, flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderColor: c.border, borderRadius: 10, backgroundColor: c.white },
    receiptThumbnail: { width: 46, height: 52, borderRadius: 5, backgroundColor: c.background },
    receiptDetails: { flex: 1, gap: 5 },
    receiptName: { fontFamily: "Inter_700Bold", fontSize: 12, color: c.text },
    receiptStatus: { fontFamily: "Inter_400Regular", fontSize: 10, color: c.green },
    removeReceipt: { width: 32, height: 40, alignItems: "center", justifyContent: "center" },
    errorText: { marginTop: 14, fontFamily: "Inter_400Regular", fontSize: 12, color: c.red },
    confirmRow: { marginTop: 20, flexDirection: "row", alignItems: "center", gap: 10 },
    checkbox: { width: 19, height: 19, borderWidth: 1, borderColor: c.brown, borderRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: c.white },
    checkboxChecked: { backgroundColor: c.brown },
    confirmText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 11, color: c.text },
    primaryButton: { minHeight: 48, marginTop: 16, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: c.brown },
    primaryButtonText: { fontFamily: "Inter_700Bold", fontSize: 13, color: c.white },
    disabledButton: { opacity: 0.6 },
    pressed: { opacity: 0.75 },
    footerNote: { maxWidth: 320, alignSelf: "center", marginTop: 20, textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 17, color: c.muted },
    errorState: { flex: 1, padding: 22, justifyContent: "center", gap: 12 },
    bodyText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, color: c.muted },
    secondaryButton: { minHeight: 46, paddingHorizontal: 18, borderWidth: 1, borderColor: c.border, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: c.white },
    secondaryButtonText: { fontFamily: "Inter_700Bold", color: c.brown, fontSize: 13 },
    successState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 13 },
    successIcon: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: "#E3EDE3" },
    successTitle: { fontFamily: "Inter_700Bold", fontSize: 21, textAlign: "center", color: c.text },
    });
