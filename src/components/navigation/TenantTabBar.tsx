import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabItem, tabBarStyles } from "./TabItem";

const tabs = [
  { key: "home", label: "Home", href: "/home", icon: "home-outline", activeIcon: "home" },
  { key: "history", label: "History", href: "/history", icon: "receipt-outline", activeIcon: "receipt" },
  { key: "account", label: "Account", href: "/account", icon: "person-outline", activeIcon: "person" },
] as const;

export function TenantTabBar({
  active,
  hidden = false,
}: {
  active: "home" | "history" | "account";
  hidden?: boolean;
}) {
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={tabBarStyles.bar}
      aria-hidden={hidden}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
    >
      <View style={tabBarStyles.tabs} accessibilityRole="tablist" accessibilityLabel="Main navigation">
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            label={tab.label}
            icon={tab.icon}
            activeIcon={tab.activeIcon}
            selected={active === tab.key}
            onPress={() => {
              if (active !== tab.key) router.replace(tab.href);
            }}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}
