import { useState } from "react";
import { palette } from "@/constants/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { chartRange, chartScale, chartX, formatChartMoney, monthName, type HistoryBill, type Utility } from "./model";
import { historyColors as c, historyFonts as f } from "./theme";

export function UtilityChart({ bills }: { bills: HistoryBill[] }) {
  const [utility, setUtility] = useState<Utility>("electricity");
  const [width, setWidth] = useState(0);
  const values = bills.map(bill => utility === "electricity" ? bill.electricCharge : bill.waterCharge);
  const { bottom, top, ticks } = chartScale(values);
  const points = values.map((value, index) => ({
    x: chartX(index, values.length, width),
    y: 58 - (value - bottom) / (top - bottom) * 54,
  }));
  const last = bills[bills.length - 1];
  const range = chartRange(bills);
  const summary = bills.map((bill, index) => `${monthName(bill.billingMonth)} ${bill.billingMonth.slice(0, 4)}: ${formatChartMoney(values[index])}`).join(", ");

  return <View style={styles.card}>
    <View style={styles.heading}>
      <Text style={styles.title}>Utility charges</Text>
      <Text style={styles.range}>{range}</Text>
    </View>
    <View style={styles.segments} accessibilityRole="tablist">
      {(["electricity", "water"] as const).map(value => <Pressable key={value}
        accessibilityRole="tab" accessibilityState={{ selected: utility === value }} aria-selected={utility === value}
        onPress={() => setUtility(value)} style={({ pressed }) => [styles.segment, utility === value && styles.selected, pressed && styles.pressed]}>
        <Text style={[styles.segmentText, utility === value && styles.selectedText]}>{value === "electricity" ? "Electricity" : "Water"}</Text>
      </Pressable>)}
    </View>
    {bills.length === 0 ? <Text style={styles.empty}>Utility charges will appear when you have bills.</Text> : <>
      <View accessible accessibilityRole="image" accessibilityLabel={`${utility === "electricity" ? "Electricity" : "Water"} charges. ${summary}`} style={styles.chart}>
        <View style={styles.axis} importantForAccessibility="no-hide-descendants" aria-hidden>
          {ticks.map((tick, index) => <Text key={index} style={styles.tick}>{formatChartMoney(tick)}</Text>)}
        </View>
        <View style={styles.plotArea} onLayout={event => setWidth(event.nativeEvent.layout.width)} importantForAccessibility="no-hide-descendants" aria-hidden>
          <View style={styles.plot}>
            {[4, 31, 58].map(y => <View key={y} style={[styles.grid, { top: y }]} />)}
            {width > 0 ? points.slice(1).map((point, index) => {
              const previous = points[index];
              const dx = point.x - previous.x;
              const dy = point.y - previous.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              return <View key={index} style={[styles.line, {
                width: length, left: (point.x + previous.x - length) / 2,
                top: (point.y + previous.y) / 2 - 1,
                transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
              }]} />;
            }) : null}
            {width > 0 ? points.map((point, index) => <View key={index} style={[styles.dot, { left: point.x - 4, top: point.y - 4 }]} />) : null}
          </View>
          <View style={styles.months}>{width > 0 ? bills.map((bill, index) => <View key={bill.billId} style={[styles.monthAnchor, { left: points[index].x - 24 }]}><Text style={styles.month}>{monthName(bill.billingMonth).slice(0, 3)}</Text></View>) : null}</View>
        </View>
      </View>
      <Text style={styles.caption}>{last ? `${monthName(last.billingMonth)}: ${formatChartMoney(values[values.length - 1])}` : ""}</Text>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: c.white, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginTop: 14 },
  heading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontFamily: f.bold, fontSize: 15, color: c.text },
  range: { fontFamily: f.regular, fontSize: 12, color: c.muted },
  segments: { flexDirection: "row", backgroundColor: palette.surfaceSubtle, padding: 2, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: c.border },
  segment: { flex: 1, minHeight: 36, padding: 8, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  selected: { backgroundColor: c.white, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontFamily: f.regular, fontSize: 13, color: c.muted },
  selectedText: { fontFamily: f.bold, color: c.text },
  pressed: { opacity: 0.7 },
  chart: { flexDirection: "row", marginTop: 14, minHeight: 84 },
  axis: { width: 54, height: 66, justifyContent: "space-between" },
  tick: { fontFamily: f.regular, fontSize: 12, color: c.muted },
  plotArea: { flex: 1 },
  plot: { height: 66 },
  grid: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: c.border },
  line: { position: "absolute", height: 2, backgroundColor: c.brown },
  dot: { position: "absolute", width: 8, height: 8, borderWidth: 1.5, borderRadius: 4, borderColor: c.brown, backgroundColor: c.white },
  months: { minHeight: 18 },
  monthAnchor: { position: "absolute", top: 0, width: 48, alignItems: "center" },
  month: { fontFamily: f.regular, fontSize: 12, color: c.muted },
  caption: { textAlign: "right", fontFamily: f.bold, fontSize: 12, color: c.brown, marginTop: 4 },
  empty: { paddingVertical: 24, fontFamily: f.regular, fontSize: 13, color: c.muted, lineHeight: 20 },
});
