import Head from "expo-router/head";
import BillingHistoryScreen from "@/screens/BillingHistoryScreen";

export default function HistoryRoute() {
  return <>
    <Head><title>Billing history · BoardEase</title></Head>
    <BillingHistoryScreen />
  </>;
}
