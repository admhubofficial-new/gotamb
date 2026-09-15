import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function TestSupabase() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);

      if (error) {
        setStatus('error');
        setMessage(error.message);
      } else {
        setStatus('success');
        setMessage('Koneksi ke Supabase berhasil! Tabel "profiles" bisa diakses.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message ?? 'Terjadi kesalahan tidak diketahui');
    }
  }

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" />
          <Text style={styles.text}>Mengecek koneksi ke Supabase...</Text>
        </>
      )}

      {status === 'success' && (
        <>
          <Text style={styles.emoji}>✅</Text>
          <Text style={[styles.text, styles.success]}>{message}</Text>
        </>
      )}

      {status === 'error' && (
        <>
          <Text style={styles.emoji}>❌</Text>
          <Text style={[styles.text, styles.error]}>Koneksi gagal:</Text>
          <Text style={styles.errorDetail}>{message}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  success: {
    color: 'green',
    fontWeight: '600',
  },
  error: {
    color: 'red',
    fontWeight: '600',
  },
  errorDetail: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
});