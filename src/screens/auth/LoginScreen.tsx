import {fonts, palette} from "@/constants/theme";
import Notice from "@/components/ui/Notice";
import {getUserRole, signIn} from "@/lib/auth";
import {useRouter} from "expo-router";
import {useState} from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Image} from "expo-image";
import {StatusBar} from "expo-status-bar";
import LogoMark from "@/components/auth/LogoMark";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TextField from "@/components/ui/TextField";

export default function LoginScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [problem, setProblem] = useState("");
	const [notice, setNotice] = useState("");
	const [busy, setBusy] = useState(false);

	async function handleSignIn() {
		if (busy) return;
		setProblem("");
		setNotice("");

		if (!email.trim()) {
			setProblem("Please enter your email address.");
			return;
		}
		if (!password) {
			setProblem("Please enter your password.");
			return;
		}
		if (password.length < 8) {
			setProblem("Password must be at least 8 characters.");
			return;
		}

		setBusy(true);

		try {
			const error = await signIn(email, password);

			if (error) {
				setProblem(error);
				return;
			}

			const role = await getUserRole();
			router.replace(role === "admin" ? "/admin" : "/history");
		} catch {
			setProblem("Failed to sign in. Please check your credentials.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<View style={styles.root}>
			<StatusBar style="light" />
			<Image source={require("@/assets/brand/login-hero.jpg")} style={styles.hero} contentFit="cover" contentPosition="top" accessible={false} />
			<View style={[styles.brand, {top: insets.top + 16}]}>
				<LogoMark size={28} />
				<Text style={styles.brandName}>BoardEase</Text>
			</View>
			<KeyboardAvoidingView
				style={{flex: 1}}
				behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
					bounces={false}
					alwaysBounceVertical={false}
					overScrollMode="never"
					showsVerticalScrollIndicator={false}>
					<View style={[styles.sheet, {paddingBottom: insets.bottom + 32}]}>
					<View style={styles.container}>
					<Text style={styles.title}>Sign in to BoardEase</Text>
					<Text style={styles.subtitle}>See your bills, payments and room details.</Text>

					<View style={{marginTop: 20}}>
						<TextField
							label="Email"
							hideLabel
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							autoComplete="email"
						/>
						<TextField
							label="Password"
							hideLabel
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							autoComplete="password"
						/>
					</View>

					<Pressable onPress={() => {}} style={styles.forgotWrap} hitSlop={8}>
						<Text style={styles.forgot}>Forgot password?</Text>
					</Pressable>

					<View style={styles.actions}>
						{problem ? <Notice tone="error" message={problem} /> : null}
						{notice ? <Notice tone="success" message={notice} /> : null}
						<PrimaryButton
							title={busy ? "Signing in…" : "Sign in"}
							disabled={busy}
							busy={busy}
							onPress={handleSignIn}
						/>
					</View>

					<Text style={styles.switch}>
						New tenant?{" "}
						<Text style={styles.switchLink} onPress={() => router.push("/register")} accessibilityRole="link">
							Create an account
						</Text>
					</Text>
					</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {flex: 1, backgroundColor: palette.brandDeep},
	hero: {position: "absolute", top: 0, left: 0, right: 0, height: "62%"},
	brand: {position: "absolute", left: 24, flexDirection: "row", alignItems: "center", gap: 10, zIndex: 1},
	brandName: {fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.4, color: palette.inverse},
	scroll: {flexGrow: 1, justifyContent: "flex-end"},
	sheet: {marginTop: 220, backgroundColor: palette.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 8},
	container: {padding: 24, paddingBottom: 0, width: "100%", maxWidth: 420, alignSelf: "center"},
	title: {marginTop: 8, textAlign: "center", fontSize: 24, letterSpacing: -0.5, fontFamily: fonts.semibold, color: palette.text},
	subtitle: {marginTop: 6, textAlign: "center", fontSize: 14, lineHeight: 20, fontFamily: fonts.regular, color: palette.muted},
	forgotWrap: {alignSelf: "flex-end", marginTop: 12, marginRight: 4},
	forgot: {fontSize: 13, fontFamily: fonts.medium, color: palette.textSecondary, textDecorationLine: "underline"},
	actions: {marginTop: 18, gap: 12},
	switch: {marginTop: 28, textAlign: "center", fontSize: 14, fontFamily: fonts.regular, color: palette.muted},
	switchLink: {fontFamily: fonts.semibold, color: palette.primary},
});
