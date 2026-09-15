import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark, palette } from '@/components/gotamb-ui';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Lengkapi dulu', 'Email dan password wajib diisi.');
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      setLoading(false);
      Alert.alert('Login gagal', authError.message);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    setLoading(false);

    if (profileError || !profile) {
      Alert.alert('Gagal memuat data akun', 'Profile tidak ditemukan. Hubungi admin.');
      return;
    }

    switch (profile.role) {
      case 'vendor':
        router.replace('/vendor-home');
        break;
      case 'customer':
        router.replace('/customer-home');
        break;
      case 'driver':
        router.replace('/driver-home');
        break;
      case 'cs':
      case 'admin':
        Alert.alert('Info', 'Halaman CS/Admin belum tersedia.');
        break;
      default:
        Alert.alert('Error', 'Role akun tidak dikenali.');
    }
  }

  function fillDemoVendor() {
    setEmail('vendor@gmail.com');
    setPassword('12345');
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.container,
        { paddingTop: Math.max(insets.top + 22, 36), paddingBottom: Math.max(insets.bottom + 24, 36) },
      ]}>
      <View style={styles.content}>
        <View style={styles.brandBlock}>
          <BrandMark />
          <Text selectable style={styles.tagline}>Material tambang dan pengiriman dalam satu aplikasi.</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>MARKETPLACE + LOGISTIK</Text>
          </View>
          <Text selectable style={styles.heroTitle}>Masuk dan kelola kebutuhan tambang lebih praktis.</Text>
          <Text selectable style={styles.heroBody}>
            Cari material, kelola pesanan, pantau pengiriman, dan lihat transaksi dari satu tempat.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeading}>
            <View>
              <Text selectable style={styles.formTitle}>Masuk ke goTamb</Text>
              <Text selectable style={styles.formSubtitle}>Gunakan akun yang sudah terdaftar.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={fillDemoVendor} hitSlop={8}>
              <Text style={styles.demoFill}>Isi akun demo</Text>
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              style={styles.input}
              placeholder="nama@email.com"
              placeholderTextColor="#9AA2AE"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                accessibilityLabel="Password"
                style={styles.passwordInput}
                placeholder="Masukkan password"
                placeholderTextColor="#9AA2AE"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable accessibilityRole="button" onPress={() => setShowPassword((value) => !value)} hitSlop={8}>
                <Text style={styles.showPassword}>{showPassword ? 'Sembunyikan' : 'Lihat'}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.loginButton, pressed && styles.pressed, loading && styles.disabled]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? <ActivityIndicator color="#17202A" /> : <Text style={styles.loginButtonText}>Masuk</Text>}
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => router.push('/vendor-home?preview=1')} disabled={loading}>
            <View style={styles.previewButton}>
              <Text style={styles.previewButtonText}>Jelajahi tampilan demo</Text>
              <Text style={styles.previewArrow}>→</Text>
            </View>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => router.push('/register')} disabled={loading}>
            <Text style={styles.registerLink}>Belum punya akun? <Text style={styles.registerStrong}>Daftar sekarang</Text></Text>
          </Pressable>
        </View>

        <Text selectable style={styles.securityText}>Data akun dan transaksi terhubung melalui Supabase goTamb.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: palette.background, paddingHorizontal: 20 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 18 },
  brandBlock: { gap: 8 },
  tagline: { color: palette.muted, fontSize: 13, lineHeight: 19, maxWidth: 330 },
  heroCard: { backgroundColor: palette.ink, borderRadius: 24, padding: 22, gap: 10, borderCurve: 'continuous' },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#2A3542', paddingHorizontal: 10, paddingVertical: 6 },
  heroBadgeText: { color: '#FBCB6B', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontWeight: '900', letterSpacing: -0.7 },
  heroBody: { color: '#C7CED8', fontSize: 13, lineHeight: 20 },
  formCard: { backgroundColor: palette.surface, borderRadius: 24, padding: 20, gap: 15, borderWidth: 1, borderColor: palette.line, borderCurve: 'continuous', boxShadow: '0 10px 30px rgba(23, 32, 42, 0.06)' },
  formHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  formTitle: { color: palette.ink, fontSize: 21, fontWeight: '900', letterSpacing: -0.4 },
  formSubtitle: { color: palette.muted, fontSize: 12, marginTop: 3 },
  demoFill: { color: palette.brandDark, fontSize: 12, fontWeight: '800' },
  fieldGroup: { gap: 7 },
  label: { color: '#394554', fontSize: 12, fontWeight: '800' },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#DCE1E7', borderRadius: 15, backgroundColor: '#FAFBFC', color: palette.ink, paddingHorizontal: 14, fontSize: 15, borderCurve: 'continuous' },
  passwordWrap: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DCE1E7', borderRadius: 15, backgroundColor: '#FAFBFC', paddingRight: 12, borderCurve: 'continuous' },
  passwordInput: { flex: 1, minHeight: 48, color: palette.ink, paddingHorizontal: 14, fontSize: 15 },
  showPassword: { color: palette.brandDark, fontSize: 12, fontWeight: '800' },
  loginButton: { minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand, marginTop: 2, borderCurve: 'continuous' },
  loginButtonText: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  previewButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 15, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', borderCurve: 'continuous' },
  previewButtonText: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  previewArrow: { color: palette.brandDark, fontSize: 18, fontWeight: '900' },
  registerLink: { color: palette.muted, fontSize: 13, textAlign: 'center', paddingVertical: 2 },
  registerStrong: { color: palette.ink, fontWeight: '900' },
  securityText: { color: '#8A94A2', fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 20 },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.5 },
});
