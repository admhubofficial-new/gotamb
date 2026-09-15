import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark, palette } from '@/components/gotamb-ui';
import { supabase } from '../../lib/supabase';

type RegisterRole = 'customer' | 'vendor' | 'driver';

const roleOptions: Array<{ role: RegisterRole; code: string; title: string; description: string }> = [
  { role: 'customer', code: 'CU', title: 'Customer', description: 'Cari material, pesan, dan pantau pengiriman.' },
  { role: 'vendor', code: 'VT', title: 'Vendor', description: 'Jual material, kelola stok, armada, dan pesanan.' },
  { role: 'driver', code: 'DR', title: 'Driver', description: 'Terima penugasan armada dan kirim material ke proyek.' },
];

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
      showError('Alamat email belum valid.');
      return;
    }
    if (password.length < 8) {
      showError('Gunakan password minimal 8 karakter.');
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
      router.replace(role === 'vendor' ? '/vendor-home' : role === 'driver' ? '/driver-home' : '/customer-home');
      return;
    }

    setMessageType('success');
    setMessage('Pendaftaran berhasil. Silakan verifikasi email lalu masuk.');
  }

  const roleLabel = role === 'vendor' ? 'Vendor' : role === 'driver' ? 'Driver' : 'Customer';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 18, 32), paddingBottom: Math.max(insets.bottom + 24, 36) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backSymbol}>‹</Text></Pressable>
          <BrandMark compact />
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>BUAT AKUN</Text>
          <Text selectable style={styles.title}>Pilih peran di ekosistem goTamb.</Text>
          <Text selectable style={styles.subtitle}>Customer membeli material, Vendor mengelola usaha dan armada, Driver menjalankan pengiriman.</Text>
        </View>

        <View style={styles.roleGrid}>
          {roleOptions.map((option) => {
            const selected = role === option.role;
            return (
              <Pressable key={option.role} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => setRole(option.role)} style={[styles.roleCard, selected && styles.roleCardSelected]}>
                <View style={[styles.roleIcon, selected && styles.roleIconSelected]}><Text style={styles.roleIconText}>{option.code}</Text></View>
                <View style={styles.roleCopy}><Text style={styles.roleTitle}>{option.title}</Text><Text style={styles.roleDescription}>{option.description}</Text></View>
                <View style={[styles.radio, selected && styles.radioSelected]} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.formCard}>
          <Text selectable style={styles.formTitle}>Data akun {roleLabel}</Text>
          <Text selectable style={styles.formSubtitle}>{role === 'driver' ? 'Setelah terdaftar, Vendor dapat memasangkan akun Driver ke unit armada.' : 'Isi data utama untuk membuat akun goTamb.'}</Text>

          <Field label="Nama lengkap" value={nama} onChangeText={setNama} placeholder="Nama sesuai identitas" />
          <Field label="Nomor HP" value={noHp} onChangeText={setNoHp} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" />
          {role === 'vendor' ? <Field label="Nama perusahaan / usaha" value={namaPerusahaan} onChangeText={setNamaPerusahaan} placeholder="Contoh: CV Tambang Makmur" /> : null}
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="nama@email.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Minimal 8 karakter" secureTextEntry />
          <Field label="Konfirmasi password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Ulangi password" secureTextEntry />

          {message ? <Text selectable accessibilityRole="alert" style={[styles.message, messageType === 'success' ? styles.successMessage : styles.errorMessage]}>{message}</Text> : null}

          <Pressable onPress={handleRegister} disabled={loading} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]}>
            {loading ? <ActivityIndicator color="#17202A" /> : <Text style={styles.primaryButtonText}>Buat akun {roleLabel}</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => router.replace('/login')} disabled={loading}><Text style={styles.loginLink}>Sudah punya akun? <Text style={styles.loginStrong}>Masuk</Text></Text></Pressable>
      </View>
    </ScrollView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, autoCapitalize = 'words' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'phone-pad' | 'email-address'; secureTextEntry?: boolean; autoCapitalize?: 'none' | 'words' }) {
  return <View style={styles.fieldGroup}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9AA2AE" keyboardType={keyboardType} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} autoCorrect={false} /></View>;
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
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', padding: 13 },
  roleCardSelected: { borderColor: '#F1C76D', backgroundColor: palette.brandSoft },
  roleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F2F5' },
  roleIconSelected: { backgroundColor: palette.brand },
  roleIconText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  roleCopy: { flex: 1, gap: 3 },
  roleTitle: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  roleDescription: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#C6CCD4', backgroundColor: '#FFFFFF' },
  radioSelected: { borderWidth: 5, borderColor: palette.brandDark },
  formCard: { gap: 13, borderRadius: 24, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', padding: 19 },
  formTitle: { color: palette.ink, fontSize: 19, fontWeight: '900' },
  formSubtitle: { color: palette.muted, fontSize: 11, lineHeight: 17 },
  fieldGroup: { gap: 6 },
  label: { color: '#3C4755', fontSize: 11, fontWeight: '800' },
  input: { minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: '#DDE2E8', backgroundColor: '#FAFBFC', color: palette.ink, paddingHorizontal: 14, fontSize: 14 },
  message: { borderRadius: 13, padding: 12, fontSize: 11, lineHeight: 17 },
  errorMessage: { color: '#A92020', backgroundColor: palette.redSoft },
  successMessage: { color: '#0C6B48', backgroundColor: palette.greenSoft },
  primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.brand, marginTop: 2 },
  primaryButtonText: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  loginLink: { color: palette.muted, fontSize: 12, textAlign: 'center' },
  loginStrong: { color: palette.ink, fontWeight: '900' },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.5 },
});
