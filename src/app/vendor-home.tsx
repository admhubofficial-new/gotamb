import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function VendorHome() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text selectable style={styles.text}>🏗️ Selamat datang, Vendor!</Text>
        <Text selectable style={styles.sub}>Kelola katalog material tambang yang akan ditampilkan di goTamb.</Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push('/vendor-items')}>
          <Text style={styles.buttonText}>Kelola Item</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fb', padding: 24 },
  card: { width: '100%', maxWidth: 560, alignItems: 'center', gap: 12, borderRadius: 16, backgroundColor: '#fff', padding: 28, boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' },
  text: { color: '#0f172a', fontSize: 23, fontWeight: '700', textAlign: 'center' },
  sub: { color: '#64748b', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  button: { width: '100%', alignItems: 'center', borderRadius: 10, backgroundColor: '#2563eb', padding: 14, marginTop: 6 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
