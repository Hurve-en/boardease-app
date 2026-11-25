import { useRef, type ComponentRef } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { historyColors as c, historyFonts as f } from "./theme";

type Props = {
  title: string;
  visible: boolean;
  selected: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  onClose: () => void;
};

export function FilterMenu({
  title,
  visible,
  selected,
  options,
  onSelect,
  onClose,
}: Props) {
  const close = useRef<ComponentRef<typeof View>>(null);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      onShow={() => close.current?.focus()}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessible={false}
        />
        <SafeAreaView
          edges={["bottom", "left", "right"]}
          style={styles.sheet}
          accessibilityViewIsModal
          aria-modal
          accessibilityLabel={title}
          role="dialog"
        >
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Pressable
              ref={close}
              accessibilityRole="button"
              onPress={onClose}
              style={styles.close}
            >
              <Text style={styles.label}>Done</Text>
            </Pressable>
          </View>
          <FlatList
            role="radiogroup"
            accessibilityLabel={title}
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected === item.value }}
                aria-checked={selected === item.value}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.option,
                  selected === item.value && styles.selected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.label}>{item.label}</Text>
                {selected === item.value ? (
                  <Text style={styles.label} accessible={false}>
                    ✓
                  </Text>
                ) : null}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: c.scrim },
  sheet: {
    width: "100%",
    maxWidth: 600,
    maxHeight: "75%",
    alignSelf: "center",
    backgroundColor: c.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { fontFamily: f.bold, fontSize: 16, color: c.text, flexShrink: 1 },
  close: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontFamily: f.regular, fontSize: 14, color: c.text },
  option: {
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    marginVertical: 3,
    borderRadius: 8,
  },
  selected: { backgroundColor: c.beige },
  pressed: { opacity: 0.7 },
});
