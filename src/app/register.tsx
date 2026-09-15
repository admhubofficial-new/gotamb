import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

type RegisterRole = 'customer' | 'vendor';

export default function Register() {
  const insets = useSafeAreaInsets();
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RegisterRole>('customer');
  const [namaPerusahaan, setNamaPerusahaan] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  function showError(text: string) {
    setMessageType('error');
    setMessage(text);
  }

  async function handleRegister() {
    const cleanNama = nama.trim();
    const cleanNoHp = noHp.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanNamaPerusahaan = namaPerusahaan.trim();

    if (!cleanNama || !cleanNoHp || !cleanEmail || !password || !confirmPassword) {
      showError('Semua data wajib diisi.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      showError('Alamat email belum valid. Periksa kembali email kamu.');
      return;
    }

    if (password.length < 8) {
      showError('Password terlalu pendek. Gunakan minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      showError('Konfirmasi password harus sama dengan password.');
      return;
    }

    if (role === 'vendor' && !cleanNamaPerusahaan) {
      showError('Nama perusahaan wajib diisi untuk akun Vendor.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          role,
          nama: cleanNama,
          no_hp: cleanNoHp,
          nama_perusahaan: role === 'vendor' ? cleanNamaPerusahaan : null,
        },
      },
    });

    setLoading(false);

    if (error) {
      showError(`Pendaftaran gagal: ${error.message}`);
      return;
    }

    if (data.session) {
      router.replace(role === 'vendor' ? '/vendor-home' : '/customer-home');
      return;
    }

    setMessageType('success');
    setMessage('Pendaftaran berhasil. Silakan periksa email untuk melakukan verifikasi sebelum masuk.');
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.container,
        { paddingTop: Math.max(insets.top + 18, 32), paddingBottom: Math.max(insets.bottom + 24, 36) },
      ]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backSymbol}>‹</Text>
          </Pressable>
          <BrandMark compact />
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>BUAT AKUN</Text>
          <Text selectable style={styles.title}>Mulai menggunakan goTamb.</Text>
          <Text selectable style={styles.subtitle}>Pilih kebutuhan Anda. Customer untuk membeli material, Vendor untuk menjual material tambang.</Text>
        </View>

        <View style={styles.roleGrid}>
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: role === 'customer' }}
            onPress={() => setRole('customer')}
            style={[styles.roleCard, role === 'customer' && styles.roleCardSelected]}>
            <View style={[styles.roleIcon, role === 'customer' && styles.roleIconSelected]}><Text style={styles.roleIconText}>CU</Text></View>
            <View style={styles.roleCopy}>
              <Text style={styles.roleTitle}>Customer</Text>
              <Text style={styles.roleDescription}>Cari material, pesan, dan pantau pengiriman.</Text>
            </View>
            <View style={[styles.radio, role === 'customer' && styles.radioSelected]} />
          </Pressable>

          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: role === 'vendor' }}
            onPress={() => setRole('vendor')}
            style={[styles.roleCard, role === 'vendor' && styles.roleCardSelected]}>
            <View style={[styles.roleIcon, role === 'vendor' && styles.roleIconSelected]}><Text style={styles.roleIconText}>VT</Text></View>
            <View style={styles.roleCopy}>
              <Text style={styles.roleTitle}>Vendor</Text>
              <Text style={styles.roleDescription}>Jual material, kelola stok dan pesanan.</Text>
            </View>
            <View style={[styles.radio, role === 'vendor' && styles.radioSelected]} />
          </Pressable>
        </View>

        <View style={styles.formCard}>
          <View style={styles.stepRow}>
            <View style={styles.stepActive}><Text style={styles.stepActiveText}>1</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.stepIdle}><Text style={styles.stepIdleText}>2</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.stepIdle}><Text style={styles.stepIdleText}>3</Text></View>
          </View>
          <Text selectable style={styles.formTitle}>Data akun</Text>
          <Text selectable style={styles.formSubtitle}>Isi data utama untuk membuat akun goTamb.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nama lengkap</Text>
            <TextInput style={styles.input} placeholder="Nama sesuai identitas" placeholderTextColor="#9AA2AE" value={nama} onChangeText={setNama} autoCapitalize="words" />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nomor HP</Text>
            <TextInput style={styles.input} placeholder="08xxxxxxxxxx" placeholderTextColor="#9AA2AE" value={noHp} onChangeText={setNoHp} keyboardType="phone-pad" />
          </View>

          {role === 'vendor' ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nama perusahaan / usaha</Text>
              <TextInput style={styles.input} placeholder="Contoh: CV Tambang Makmur" placeholderTextColor="#9AA2AE" value={namaPerusahaan} onChangeText={setNamaPerusahaan} autoCapitalize="words" />
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="nama@email.com" placeholderTextColor="#9AA2AE" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="Minimal 8 karakter" placeholderTextColor="#9AA2AE" value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Konfirmasi password</Text>
            <TextInput style={styles.input} placeholder="Ulangi password" placeholderTextColor="#9AA2AE" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          </View>

          {message ? (
            <Text selectable accessibilityRole="alert" style={[styles.message, messageType === 'success' ? styles.successMessage : styles.errorMessage]}>
              {message}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]}
            onPress={handleRegister}
            disabled={loading}>
            {loading ? <ActivityIndicator color="#17202A" /> : <Text style={styles.primaryButtonText}>Buat akun {role === 'vendor' ? 'Vendor' : 'Customer'}</Text>}
          </Pressable>

          <Text selectable style={styles.terms}>Dengan mendaftar, Anda menyetujui penggunaan data akun untuk proses layanan goTamb.</Text>
        </View>

        <Pressable onPress={() => router.replace('/login')} disabled={loading}>
          <Text style={styles.loginLink}>Sudah punya akun? <Text style={styles.loginStrong}>Masuk</Text></Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: palette.background, paddingHorizontal: 18 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  backSymbol: { color: palette.ink, fontSize: 29, lineHeight: 31 },
  topSpacer: { width: 38 },
  heading: { gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: palette.ink, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  roleGrid: { gap: 10 },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', padding: 13, borderCurve: 'continuous' },
  roleCardSelected: { borderColor: '#F1C76D', backgroundColor: palette.brandSoft },
  roleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F2F5' },
  roleIconSelected: { backgroundColor: palette.brand },
  roleIconText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  roleCopy: { flex: 1, gap: 3 },
  roleTitle: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  roleDescription: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#C6CCD4', backgroundColor: '#FFFFFF' },
  radioSelected: { borderWidth: 5, borderColor: palette.brandDark },
  formCard: { gap: 13, borderRadius: 24, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', padding: 19, borderCurve: 'continuous', boxShadow: '0 10px 30px rgba(23, 32, 42, 0.05)' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 3 },
  stepActive: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  stepActiveText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  stepIdle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F2F5' },
  stepIdleText: { color: '#8A94A2', fontSize: 11, fontWeight: '800' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E9ECF0' },
  formTitle: { color: palette.ink, fontSize: 19, fontWeight: '900' },
  formSubtitle: { color: palette.muted, fontSize: 11, marginTop: -8 },
  fieldGroup: { gap: 6 },
  label: { color: '#3C4755', fontSize: 11, fontWeight: '800' },
  input: { minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: '#DDE2E8', backgroundColor: '#FAFBFC', color: palette.ink, paddingHorizontal: 14, fontSize: 14, borderCurve: 'continuous' },
  message: { borderRadius: 13, padding: 12, fontSize: 11, lineHeight: 17 },
  errorMessage: { color: '#A92020', backgroundColor: palette.redSoft },
  successMessage: { color: '#0C6B48', backgroundColor: palette.greenSoft },
  primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.brand, marginTop: 2, borderCurve: 'continuous' },
  primaryButtonText: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  terms: { color: '#8A94A2', fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 8 },
  loginLink: { color: palette.muted, fontSize: 12, textAlign: 'center' },
  loginStrong: { color: palette.ink, fontWeight: '900' },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.5 },
});
