import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";

const webAppUrl = process.env.EXPO_PUBLIC_WEB_APP_URL;

export default function WebAppScreen() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  if (!webAppUrl) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.title}>Web app URL is not configured</Text>
        <Text style={styles.body}>Set EXPO_PUBLIC_WEB_APP_URL before building the Android app.</Text>
      </SafeAreaView>
    );
  }

  if (hasError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.title}>Unable to load Talabat Betak</Text>
        <Text style={styles.body}>Check your internet connection and try again.</Text>
        <Pressable style={styles.button} onPress={() => setHasError(false)}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.title}>Talabat Betak</Text>
        <Text style={styles.body}>The native WebView wrapper runs on Android and iOS.</Text>
        <Pressable style={styles.button} onPress={() => void Linking.openURL(webAppUrl)}>
          <Text style={styles.buttonText}>Open web app</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <WebView
        ref={webViewRef}
        source={{ uri: webAppUrl }}
        style={styles.webView}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        onNavigationStateChange={(state: WebViewNavigation) => setCanGoBack(state.canGoBack)}
        onError={() => setHasError(true)}
        onShouldStartLoadWithRequest={(request) => {
          if (request.url.startsWith(webAppUrl)) return true;
          void Linking.openURL(request.url);
          return false;
        }}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#5E3C1A" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBF9F1" },
  webView: { flex: 1, backgroundColor: "#FBF9F1" },
  loading: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "#FBF9F1" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#FBF9F1" },
  title: { color: "#3D2B1F", fontSize: 20, fontWeight: "700", textAlign: "center" },
  body: { color: "#6D5B4D", fontSize: 15, marginTop: 10, textAlign: "center" },
  button: { backgroundColor: "#FFD502", borderRadius: 12, marginTop: 20, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: "#3D2B1F", fontSize: 15, fontWeight: "700" },
});