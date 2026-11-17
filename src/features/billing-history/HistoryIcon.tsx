import { Image } from "expo-image";

const icons = {
  brand: { source: require("@/assets/billing-history/brand-home.svg"), width: 17.7, height: 17.204 },
  home: { source: require("@/assets/billing-history/home.svg"), width: 17.7, height: 17.204 },
  history: { source: require("@/assets/billing-history/history.svg"), width: 15.7, height: 17.204 },
  account: { source: require("@/assets/billing-history/account.svg"), width: 15.7, height: 17.204 },
  down: { source: require("@/assets/billing-history/chevron-down.svg"), width: 9.7, height: 5.57601 },
  right: { source: require("@/assets/billing-history/chevron-right.svg"), width: 6.7, height: 11.39 },
};

export function HistoryIcon({ name }: { name: keyof typeof icons }) {
  const icon = icons[name];
  return <Image source={icon.source} alt="" aria-hidden style={{ width: icon.width, height: icon.height }} contentFit="contain" accessible={false} />;
}
