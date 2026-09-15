import { View, Text, StyleSheet } from 'react-native';

export default function CustomerHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🛒 Selamat datang, Customer!</Text>
      <Text style={styles.sub}>Halaman cari item & order akan dibangun di sini.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { fontSize: 20, fontWeight: 'bold' },
  sub: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
});