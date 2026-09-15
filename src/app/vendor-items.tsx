import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

type Item = {
  id: string;
  vendor_id: string;
  kategori: string;
  nama_item: string;
  harga: number;
  satuan: string;
  stok: number;
  lokasi_lat: number | null;
  lokasi_lng: number | null;
};

type FormState = {
  kategori: string;
  namaItem: string;
  harga: string;
  satuan: string;
  stok: string;
  lokasiLat: string;
  lokasiLng: string;
};

const emptyForm: FormState = {
  kategori: '',
  namaItem: '',
  harga: '',
  satuan: '',
  stok: '',
  lokasiLat: '',
  lokasiLng: '',
};

function parseNumber(value: string) {
  return Number(value.trim().replace(',', '.'));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value);
}

export default function VendorItems() {
  const [vendorId, setVendorId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  function showMessage(text: string, type: 'error' | 'success' = 'error') {
    setMessageType(type);
    setMessage(text);
  }

  const loadItems = useCallback(async () => {
    setLoading(true);
    setMessage('');

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (vendorError || !vendor) {
      setLoading(false);
      showMessage('Data vendor tidak ditemukan. Pastikan akun ini terdaftar sebagai vendor.');
      return;
    }

    setVendorId(vendor.id);

    const { data, error } = await supabase
      .from('items')
      .select('id, vendor_id, kategori, nama_item, harga, satuan, stok, lokasi_lat, lokasi_lng')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      showMessage(`Item belum dapat dimuat: ${error.message}`);
      return;
    }

    setItems((data ?? []) as Item[]);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function updateForm(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage('');
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setDeleteId(null);
    setForm({
      kategori: item.kategori,
      namaItem: item.nama_item,
      harga: String(item.harga),
      satuan: item.satuan,
      stok: String(item.stok),
      lokasiLat: item.lokasi_lat === null ? '' : String(item.lokasi_lat),
      lokasiLng: item.lokasi_lng === null ? '' : String(item.lokasi_lng),
    });
    setMessage('Mode ubah aktif. Form di atas berisi data item yang dipilih.');
    setMessageType('success');
  }

  async function saveItem() {
    const kategori = form.kategori.trim();
    const namaItem = form.namaItem.trim();
    const satuan = form.satuan.trim();
    const harga = parseNumber(form.harga);
    const stok = parseNumber(form.stok);
    const hasLat = form.lokasiLat.trim() !== '';
    const hasLng = form.lokasiLng.trim() !== '';
    const lokasiLat = hasLat ? parseNumber(form.lokasiLat) : null;
    const lokasiLng = hasLng ? parseNumber(form.lokasiLng) : null;

    if (!vendorId) {
      showMessage('Data vendor belum siap. Muat ulang halaman lalu coba lagi.');
      return;
    }

    if (!kategori || !namaItem || !satuan || !form.harga.trim() || !form.stok.trim()) {
      showMessage('Nama item, kategori, harga, satuan, dan stok wajib diisi.');
      return;
    }

    if (!Number.isFinite(harga) || harga < 0 || !Number.isFinite(stok) || stok < 0) {
      showMessage('Harga dan stok harus berupa angka nol atau lebih besar.');
      return;
    }

    if (hasLat !== hasLng) {
      showMessage('Latitude dan longitude harus diisi berpasangan, atau dikosongkan keduanya.');
      return;
    }

    if (
      (lokasiLat !== null && (!Number.isFinite(lokasiLat) || lokasiLat < -90 || lokasiLat > 90)) ||
      (lokasiLng !== null && (!Number.isFinite(lokasiLng) || lokasiLng < -180 || lokasiLng > 180))
    ) {
      showMessage('Koordinat tidak valid. Latitude -90 sampai 90, longitude -180 sampai 180.');
      return;
    }

    setSaving(true);
    setMessage('');

    const payload = {
      vendor_id: vendorId,
      kategori,
      nama_item: namaItem,
      harga,
      satuan,
      stok,
      lokasi_lat: lokasiLat,
      lokasi_lng: lokasiLng,
    };

    const result = editingId
      ? await supabase.from('items').update(payload).eq('id', editingId).eq('vendor_id', vendorId)
      : await supabase.from('items').insert(payload);

    setSaving(false);

    if (result.error) {
      showMessage(`Item gagal disimpan: ${result.error.message}`);
      return;
    }

    const successText = editingId ? 'Item berhasil diperbarui.' : 'Item berhasil ditambahkan.';
    setForm(emptyForm);
    setEditingId(null);
    await loadItems();
    showMessage(successText, 'success');
  }

  async function deleteItem(itemId: string) {
    if (!vendorId) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('vendor_id', vendorId);

    setSaving(false);
    setDeleteId(null);

    if (error) {
      showMessage(`Item gagal dihapus: ${error.message}`);
      return;
    }

    if (editingId === itemId) resetForm();
    await loadItems();
    showMessage('Item berhasil dihapus.', 'success');
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Kelola Item' }} />

      <View style={styles.formCard}>
        <Text selectable style={styles.title}>{editingId ? 'Ubah item' : 'Tambah item baru'}</Text>
        <Text selectable style={styles.helper}>Kolom bertanda wajib harus diisi. Lokasi boleh dikosongkan untuk sekarang.</Text>

        <Text selectable style={styles.label}>Nama item *</Text>
        <TextInput accessibilityLabel="Nama item" style={styles.input} placeholder="Contoh: Pasir Beton" value={form.namaItem} onChangeText={(value) => updateForm('namaItem', value)} />

        <Text selectable style={styles.label}>Kategori *</Text>
        <TextInput accessibilityLabel="Kategori" style={styles.input} placeholder="Contoh: Pasir" value={form.kategori} onChangeText={(value) => updateForm('kategori', value)} />

        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text selectable style={styles.label}>Harga *</Text>
            <TextInput accessibilityLabel="Harga" style={styles.input} placeholder="150000" value={form.harga} onChangeText={(value) => updateForm('harga', value)} keyboardType="decimal-pad" />
          </View>
          <View style={styles.column}>
            <Text selectable style={styles.label}>Satuan *</Text>
            <TextInput accessibilityLabel="Satuan" style={styles.input} placeholder="m³ / ton / truk" value={form.satuan} onChangeText={(value) => updateForm('satuan', value)} />
          </View>
        </View>

        <Text selectable style={styles.label}>Stok *</Text>
        <TextInput accessibilityLabel="Stok" style={styles.input} placeholder="100" value={form.stok} onChangeText={(value) => updateForm('stok', value)} keyboardType="decimal-pad" />

        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text selectable style={styles.label}>Latitude</Text>
            <TextInput accessibilityLabel="Latitude" style={styles.input} placeholder="-6.200000" value={form.lokasiLat} onChangeText={(value) => updateForm('lokasiLat', value)} keyboardType="numbers-and-punctuation" />
          </View>
          <View style={styles.column}>
            <Text selectable style={styles.label}>Longitude</Text>
            <TextInput accessibilityLabel="Longitude" style={styles.input} placeholder="106.816666" value={form.lokasiLng} onChangeText={(value) => updateForm('lokasiLng', value)} keyboardType="numbers-and-punctuation" />
          </View>
        </View>

        {message ? (
          <Text selectable accessibilityRole="alert" style={[styles.message, messageType === 'success' ? styles.successMessage : styles.errorMessage]}>
            {message}
          </Text>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={saveItem} disabled={saving || loading}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{editingId ? 'Simpan perubahan' : 'Tambah item'}</Text>}
          </Pressable>
          {editingId ? (
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={resetForm} disabled={saving}>
              <Text style={styles.secondaryButtonText}>Batal mengubah</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.listHeader}>
        <View>
          <Text selectable style={styles.title}>Daftar item</Text>
          <Text selectable style={styles.helper}>{items.length} item tersimpan</Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.refreshButton} onPress={loadItems} disabled={loading || saving}>
          <Text style={styles.refreshText}>Muat ulang</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text selectable style={styles.emptyTitle}>Belum ada item</Text>
          <Text selectable style={styles.helper}>Isi formulir di atas untuk menambahkan item pertama.</Text>
        </View>
      ) : (
        <View style={styles.itemList}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <View style={styles.itemInfo}>
                  <Text selectable style={styles.itemName}>{item.nama_item}</Text>
                  <Text selectable style={styles.category}>{item.kategori}</Text>
                </View>
                <Text selectable style={styles.price}>Rp {formatNumber(item.harga)}/{item.satuan}</Text>
              </View>
              <Text selectable style={styles.stock}>Stok: {formatNumber(item.stok)} {item.satuan}</Text>
              <Text selectable style={styles.location}>
                {item.lokasi_lat === null ? 'Lokasi belum diisi' : `Lokasi: ${item.lokasi_lat}, ${item.lokasi_lng}`}
              </Text>

              {deleteId === item.id ? (
                <View style={styles.confirmBox}>
                  <Text selectable style={styles.confirmText}>Hapus item ini? Tindakan ini tidak dapat dibatalkan.</Text>
                  <View style={styles.actionRow}>
                    <Pressable accessibilityRole="button" style={styles.dangerButton} onPress={() => deleteItem(item.id)} disabled={saving}>
                      <Text style={styles.dangerButtonText}>Ya, hapus</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={() => setDeleteId(null)} disabled={saving}>
                      <Text style={styles.secondaryButtonText}>Batal</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.actionRow}>
                  <Pressable accessibilityRole="button" style={styles.editButton} onPress={() => startEdit(item)} disabled={saving}>
                    <Text style={styles.editButtonText}>Ubah</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" style={styles.deleteOutlineButton} onPress={() => setDeleteId(item.id)} disabled={saving}>
                    <Text style={styles.deleteOutlineText}>Hapus</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f4f7fb', padding: 20, paddingBottom: 48, gap: 20 },
  formCard: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 10, borderRadius: 16, backgroundColor: '#fff', padding: 20, boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' },
  title: { color: '#0f172a', fontSize: 22, fontWeight: '700' },
  helper: { color: '#64748b', fontSize: 13, lineHeight: 19 },
  label: { color: '#334155', fontSize: 13, fontWeight: '600', paddingTop: 4 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 13, paddingVertical: 12, fontSize: 15 },
  twoColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  column: { flex: 1, minWidth: 180, gap: 6 },
  message: { borderRadius: 8, padding: 12, fontSize: 14 },
  errorMessage: { color: '#b91c1c', backgroundColor: '#fef2f2' },
  successMessage: { color: '#166534', backgroundColor: '#f0fdf4' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primaryButton: { flexGrow: 1, alignItems: 'center', borderRadius: 10, backgroundColor: '#2563eb', padding: 13 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 },
  secondaryButtonText: { color: '#334155', fontWeight: '600' },
  buttonPressed: { opacity: 0.82 },
  listHeader: { width: '100%', maxWidth: 760, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  refreshButton: { borderRadius: 9, backgroundColor: '#e0e7ff', paddingHorizontal: 13, paddingVertical: 9 },
  refreshText: { color: '#3730a3', fontWeight: '600' },
  emptyCard: { width: '100%', maxWidth: 760, alignSelf: 'center', alignItems: 'center', gap: 6, borderRadius: 14, backgroundColor: '#fff', padding: 28 },
  emptyTitle: { color: '#334155', fontSize: 17, fontWeight: '700' },
  itemList: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 12 },
  itemCard: { gap: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, backgroundColor: '#fff', padding: 17 },
  itemTopRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  itemInfo: { flex: 1, minWidth: 180, gap: 3 },
  itemName: { color: '#0f172a', fontSize: 17, fontWeight: '700' },
  category: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  price: { color: '#166534', fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  stock: { color: '#334155', fontSize: 14, fontVariant: ['tabular-nums'] },
  location: { color: '#64748b', fontSize: 13 },
  editButton: { borderRadius: 9, backgroundColor: '#eff6ff', paddingHorizontal: 18, paddingVertical: 10 },
  editButtonText: { color: '#1d4ed8', fontWeight: '700' },
  deleteOutlineButton: { borderWidth: 1, borderColor: '#fecaca', borderRadius: 9, paddingHorizontal: 18, paddingVertical: 10 },
  deleteOutlineText: { color: '#b91c1c', fontWeight: '700' },
  confirmBox: { gap: 10, borderRadius: 10, backgroundColor: '#fef2f2', padding: 12 },
  confirmText: { color: '#991b1b', fontSize: 14 },
  dangerButton: { alignItems: 'center', borderRadius: 10, backgroundColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 12 },
  dangerButtonText: { color: '#fff', fontWeight: '700' },
});
