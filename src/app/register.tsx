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

import { supabase } from '../../lib/supabase';

type RegisterRole = 'customer' | 'vendor';

export default function Register() {
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
    setMessage('Pendaftaran berhasil. Silakan periksa email kamu untuk melakukan verifikasi sebelum masuk.');
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text selectable style={styles.title}>Buat akun goTamb</Text>
        <Text selectable style={styles.subtitle}>Daftar sebagai Customer atau Partner Tambang</Text>

        <Text selectable style={styles.label}>Jenis akun</Text>
        <View style={styles.roleRow}>
          {(['customer', 'vendor'] as const).map((item) => {
            const selected = role === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={[styles.roleButton, selected && styles.roleButtonSelected]}
                onPress={() => setRole(item)}>
                <Text style={[styles.roleText, selected && styles.roleTextSelected]}>
                  {item === 'customer' ? 'Customer' : 'Vendor'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput style={styles.input} placeholder="Nama lengkap" value={nama} onChangeText={setNama} autoCapitalize="words" />
        <TextInput style={styles.input} placeholder="Nomor HP" value={noHp} onChangeText={setNoHp} keyboardType="phone-pad" />

        {role === 'vendor' && (
          <TextInput style={styles.input} placeholder="Nama perusahaan" value={namaPerusahaan} onChangeText={setNamaPerusahaan} autoCapitalize="words" />
        )}

        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password (minimal 8 karakter)" value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Konfirmasi password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        {message ? (
          <Text selectable accessibilityRole="alert" style={[styles.message, messageType === 'success' ? styles.successMessage : styles.errorMessage]}>
            {message}
          </Text>
        ) : null}

        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Daftar</Text>}
        </Pressable>

        <Pressable onPress={() => router.replace('/login')} disabled={loading}>
          <Text style={styles.loginLink}>Sudah punya akun? Masuk</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', backgroundColor: '#f4f7fb', padding: 24 },
  card: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 12, borderRadius: 16, backgroundColor: '#fff', padding: 24, boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', paddingBottom: 10 },
  label: { color: '#334155', fontSize: 14, fontWeight: '600' },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleButton: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12 },
  roleButtonSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  roleText: { color: '#475569', fontWeight: '600' },
  roleTextSelected: { color: '#1d4ed8' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  primaryButton: { alignItems: 'center', borderRadius: 10, backgroundColor: '#2563eb', padding: 14, marginTop: 4 },
  buttonPressed: { opacity: 0.85 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  message: { borderRadius: 8, padding: 12, fontSize: 14 },
  errorMessage: { color: '#b91c1c', backgroundColor: '#fef2f2' },
  successMessage: { color: '#166534', backgroundColor: '#f0fdf4' },
  loginLink: { color: '#2563eb', fontSize: 14, fontWeight: '600', textAlign: 'center', padding: 8 },
});
