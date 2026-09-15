import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { BottomNav, BrandMark, StatusChip, palette } from '@/components/gotamb-ui';
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
  const insets = useSafeAreaInsets();
  const [vendorId, setVendorId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');

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

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.kategori).filter(Boolean)));
    return ['Semua', ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === 'Semua' || item.kategori === category;
      const matchesQuery = !cleanQuery || item.nama_item.toLowerCase().includes(cleanQuery) || item.kategori.toLowerCase().includes(cleanQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, items, query]);

  const lowStockCount = items.filter((item) => item.stok <= 10).length;
  const totalStock = items.reduce((sum, item) => sum + Number(item.stok || 0), 0);

  function updateForm(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setDeleteId(null);
    setMessage('');
    setShowForm(false);
  }

  function startAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setDeleteId(null);
    setMessage('');
    setShowForm(true);
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
    setMessage('Mode ubah aktif. Perbarui data lalu simpan perubahan.');
    setMessageType('success');
    setShowForm(true);
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
    setShowForm(false);
    await loadItems();
    showMessage(successText, 'success');
  }

  async function deleteItem(itemId: string) {
    if (!vendorId) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase.from('items').delete().eq('id', itemId).eq('vendor_id', vendorId);

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

  function openVendorSection(section: string) {
    router.push(`/explore?role=vendor&section=${section}`);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top + 14, 26), paddingBottom: 32 },
        ]}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backSymbol}>‹</Text>
          </Pressable>
          <BrandMark compact />
          <Pressable accessibilityRole="button" onPress={() => router.replace('/vendor-home')} style={styles.homeButton}>
            <Text style={styles.homeButtonText}>Beranda</Text>
          </Pressable>
        </View>

        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>KATALOG VENDOR</Text>
            <Text selectable style={styles.title}>Kelola material</Text>
            <Text selectable style={styles.subtitle}>Atur produk, harga, stok, satuan, dan titik material yang tampil di goTamb.</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={startAdd} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addButtonPlus}>＋</Text>
            <Text style={styles.addButtonText}>Tambah</Text>
          </Pressable>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Item aktif</Text>
            <Text selectable style={styles.metricValue}>{items.length}</Text>
            <Text style={styles.metricMeta}>material tersimpan</Text>
          </View>
          <View style={[styles.metricCard, styles.metricWarn]}>
            <Text style={styles.metricLabel}>Stok menipis</Text>
            <Text selectable style={[styles.metricValue, { color: palette.brandDark }]}>{lowStockCount}</Text>
            <Text style={styles.metricMeta}>stok ≤ 10</Text>
          </View>
          <View style={[styles.metricCard, styles.metricGreen]}>
            <Text style={styles.metricLabel}>Total stok</Text>
            <Text selectable style={[styles.metricValue, { color: palette.green }]}>{formatNumber(totalStock)}</Text>
            <Text style={styles.metricMeta}>lintas satuan</Text>
          </View>
        </View>

        {message ? (
          <Text
            selectable
            accessibilityRole="alert"
            style={[styles.message, messageType === 'success' ? styles.successMessage : styles.errorMessage]}>
            {message}
          </Text>
        ) : null}

        {showForm ? (
          <View style={styles.formCard}>
            <View style={styles.formHeading}>
              <View style={styles.formHeadingCopy}>
                <Text selectable style={styles.formTitle}>{editingId ? 'Ubah material' : 'Tambah material baru'}</Text>
                <Text selectable style={styles.helper}>Isi data utama. Koordinat lokasi boleh dikosongkan sementara.</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={resetForm} hitSlop={8}>
                <Text style={styles.closeText}>Tutup</Text>
              </Pressable>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nama material *</Text>
              <TextInput
                accessibilityLabel="Nama item"
                style={styles.input}
                placeholder="Contoh: Pasir Beton Premium"
                placeholderTextColor="#9AA2AE"
                value={form.namaItem}
                onChangeText={(value) => updateForm('namaItem', value)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Kategori *</Text>
              <TextInput
                accessibilityLabel="Kategori"
                style={styles.input}
                placeholder="Pasir / Batu Split / Tanah Urug"
                placeholderTextColor="#9AA2AE"
                value={form.kategori}
                onChangeText={(value) => updateForm('kategori', value)}
              />
            </View>

            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Text style={styles.label}>Harga *</Text>
                <TextInput
                  accessibilityLabel="Harga"
                  style={styles.input}
                  placeholder="190000"
                  placeholderTextColor="#9AA2AE"
                  value={form.harga}
                  onChangeText={(value) => updateForm('harga', value)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Satuan *</Text>
                <TextInput
                  accessibilityLabel="Satuan"
                  style={styles.input}
                  placeholder="m³ / ton / truk"
                  placeholderTextColor="#9AA2AE"
                  value={form.satuan}
                  onChangeText={(value) => updateForm('satuan', value)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Stok *</Text>
              <TextInput
                accessibilityLabel="Stok"
                style={styles.input}
                placeholder="100"
                placeholderTextColor="#9AA2AE"
                value={form.stok}
                onChangeText={(value) => updateForm('stok', value)}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.locationBox}>
              <View style={styles.locationHeading}>
                <View style={styles.locationMark}><Text style={styles.locationMarkText}>⌖</Text></View>
                <View style={styles.locationHeadingCopy}>
                  <Text style={styles.locationTitle}>Titik lokasi material</Text>
                  <Text style={styles.helper}>Digunakan untuk estimasi jarak dan pengiriman.</Text>
                </View>
              </View>
              <View style={styles.twoColumns}>
                <View style={styles.column}>
                  <Text style={styles.label}>Latitude</Text>
                  <TextInput
                    accessibilityLabel="Latitude"
                    style={styles.input}
                    placeholder="-6.200000"
                    placeholderTextColor="#9AA2AE"
                    value={form.lokasiLat}
                    onChangeText={(value) => updateForm('lokasiLat', value)}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Longitude</Text>
                  <TextInput
                    accessibilityLabel="Longitude"
                    style={styles.input}
                    placeholder="106.816666"
                    placeholderTextColor="#9AA2AE"
                    value={form.lokasiLng}
                    onChangeText={(value) => updateForm('lokasiLng', value)}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, (saving || loading) && styles.disabled]}
                onPress={saveItem}
                disabled={saving || loading}>
                {saving ? <ActivityIndicator color="#17202A" /> : <Text style={styles.primaryButtonText}>{editingId ? 'Simpan perubahan' : 'Tambahkan ke katalog'}</Text>}
              </Pressable>
              {editingId ? (
                <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={resetForm} disabled={saving}>
                  <Text style={styles.secondaryButtonText}>Batal</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.toolsCard}>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama atau kategori material"
              placeholderTextColor="#9AA2AE"
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {categories.map((item) => {
              const selected = category === item;
              return (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.filterChip, selected && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.listHeading}>
          <View>
            <Text selectable style={styles.listTitle}>Daftar material</Text>
            <Text selectable style={styles.helper}>{filteredItems.length} dari {items.length} item ditampilkan</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={loadItems} disabled={loading || saving} style={styles.refreshButton}>
            <Text style={styles.refreshText}>{loading ? 'Memuat...' : 'Muat ulang'}</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={palette.brandDark} />
            <Text style={styles.helper}>Memuat katalog vendor...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>▦</Text></View>
            <Text selectable style={styles.emptyTitle}>{items.length === 0 ? 'Belum ada material' : 'Material tidak ditemukan'}</Text>
            <Text selectable style={styles.emptyText}>{items.length === 0 ? 'Tambahkan material pertama agar dapat tampil di marketplace goTamb.' : 'Coba kata pencarian atau kategori lainnya.'}</Text>
            {items.length === 0 ? (
              <Pressable onPress={startAdd} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Tambah material</Text></Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.itemList}>
            {filteredItems.map((item, index) => {
              const lowStock = item.stok <= 10;
              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTopRow}>
                    <View style={[styles.itemMark, index % 3 === 0 ? styles.itemMarkBrand : index % 3 === 1 ? styles.itemMarkBlue : styles.itemMarkGreen]}>
                      <Text style={styles.itemMarkText}>{item.nama_item.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text selectable style={styles.itemName}>{item.nama_item}</Text>
                      <Text selectable style={styles.categoryText}>{item.kategori}</Text>
                    </View>
                    <StatusChip label={lowStock ? 'Stok menipis' : 'Aktif'} tone={lowStock ? 'brand' : 'green'} />
                  </View>

                  <View style={styles.itemStats}>
                    <View style={styles.itemStat}>
                      <Text style={styles.itemStatLabel}>Harga</Text>
                      <Text selectable style={styles.itemStatValue}>Rp {formatNumber(item.harga)}</Text>
                    </View>
                    <View style={styles.itemStatDivider} />
                    <View style={styles.itemStat}>
                      <Text style={styles.itemStatLabel}>Stok</Text>
                      <Text selectable style={styles.itemStatValue}>{formatNumber(item.stok)} {item.satuan}</Text>
                    </View>
                    <View style={styles.itemStatDivider} />
                    <View style={styles.itemStat}>
                      <Text style={styles.itemStatLabel}>Lokasi</Text>
                      <Text selectable numberOfLines={1} style={styles.itemStatValue}>{item.lokasi_lat === null ? 'Belum diisi' : 'Tersimpan'}</Text>
                    </View>
                  </View>

                  {deleteId === item.id ? (
                    <View style={styles.confirmBox}>
                      <View style={styles.confirmCopy}>
                        <Text selectable style={styles.confirmTitle}>Hapus {item.nama_item}?</Text>
                        <Text selectable style={styles.confirmText}>Material akan hilang dari katalog vendor dan tindakan ini tidak dapat dibatalkan.</Text>
                      </View>
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
                    <View style={styles.cardActions}>
                      <Pressable accessibilityRole="button" style={styles.editButton} onPress={() => startEdit(item)} disabled={saving}>
                        <Text style={styles.editButtonText}>Ubah material</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" style={styles.deleteButton} onPress={() => setDeleteId(item.id)} disabled={saving}>
                        <Text style={styles.deleteButtonText}>Hapus</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNav
        activeKey="catalog"
        items={[
          { key: 'home', symbol: '⌂', label: 'Beranda', onPress: () => router.replace('/vendor-home') },
          { key: 'orders', symbol: '≡', label: 'Pesanan', onPress: () => openVendorSection('orders') },
          { key: 'catalog', symbol: '▦', label: 'Katalog', onPress: () => {} },
          { key: 'profile', symbol: '○', label: 'Akun', onPress: () => openVendorSection('profile') },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { paddingHorizontal: 18, gap: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  backButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  backSymbol: { color: palette.ink, fontSize: 29, lineHeight: 31 },
  homeButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, paddingHorizontal: 12 },
  homeButtonText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  headingCopy: { flex: 1, gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: palette.ink, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  addButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 15, backgroundColor: palette.brand, paddingHorizontal: 13, borderCurve: 'continuous' },
  addButtonPlus: { color: palette.ink, fontSize: 17, fontWeight: '900' },
  addButtonText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metricCard: { flex: 1, minWidth: 100, minHeight: 104, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 13, gap: 5, borderCurve: 'continuous' },
  metricWarn: { backgroundColor: palette.brandSoft, borderColor: '#F7DA9B' },
  metricGreen: { backgroundColor: palette.greenSoft, borderColor: '#C8E9DB' },
  metricLabel: { color: palette.muted, fontSize: 9, fontWeight: '800' },
  metricValue: { color: palette.ink, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  metricMeta: { color: palette.muted, fontSize: 9 },
  message: { borderRadius: 14, padding: 12, fontSize: 12, lineHeight: 18 },
  errorMessage: { color: '#B42318', backgroundColor: palette.redSoft },
  successMessage: { color: '#116149', backgroundColor: palette.greenSoft },
  formCard: { gap: 13, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 18, borderCurve: 'continuous', boxShadow: '0 10px 28px rgba(23, 32, 42, 0.05)' },
  formHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  formHeadingCopy: { flex: 1, gap: 4 },
  formTitle: { color: palette.ink, fontSize: 19, fontWeight: '900' },
  helper: { color: palette.muted, fontSize: 10, lineHeight: 16 },
  closeText: { color: palette.brandDark, fontSize: 11, fontWeight: '900' },
  fieldGroup: { gap: 7 },
  label: { color: '#394554', fontSize: 11, fontWeight: '800' },
  input: { minHeight: 49, borderWidth: 1, borderColor: '#DCE1E7', borderRadius: 15, backgroundColor: '#FAFBFC', color: palette.ink, paddingHorizontal: 13, fontSize: 14, borderCurve: 'continuous' },
  twoColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  column: { flex: 1, minWidth: 145, gap: 7 },
  locationBox: { gap: 12, borderRadius: 18, backgroundColor: '#F7F8FA', borderWidth: 1, borderColor: palette.line, padding: 13 },
  locationHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.blueSoft },
  locationMarkText: { color: palette.blue, fontSize: 18, fontWeight: '900' },
  locationHeadingCopy: { flex: 1, gap: 2 },
  locationTitle: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  primaryButton: { flex: 1, minWidth: 180, minHeight: 49, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.brand, paddingHorizontal: 14 },
  primaryButtonText: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  secondaryButton: { minHeight: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', paddingHorizontal: 15 },
  secondaryButtonText: { color: palette.ink, fontSize: 11, fontWeight: '800' },
  toolsCard: { gap: 11 },
  searchWrap: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, paddingHorizontal: 13 },
  searchIcon: { color: palette.ink, fontSize: 20, fontWeight: '900' },
  searchInput: { flex: 1, minHeight: 48, color: palette.ink, fontSize: 13 },
  chipRow: { gap: 8, paddingRight: 18 },
  filterChip: { minHeight: 34, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', paddingHorizontal: 13 },
  filterChipActive: { borderColor: '#E9BA55', backgroundColor: palette.brandSoft },
  filterChipText: { color: palette.muted, fontSize: 10, fontWeight: '800' },
  filterChipTextActive: { color: palette.brandDark },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  listTitle: { color: palette.ink, fontSize: 18, fontWeight: '900' },
  refreshButton: { borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', paddingHorizontal: 11, paddingVertical: 8 },
  refreshText: { color: palette.ink, fontSize: 10, fontWeight: '800' },
  loadingCard: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  emptyCard: { alignItems: 'center', gap: 8, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 26 },
  emptyIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft },
  emptyIconText: { color: palette.brandDark, fontSize: 21, fontWeight: '900' },
  emptyTitle: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  emptyText: { maxWidth: 290, color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  emptyButton: { borderRadius: 13, backgroundColor: palette.brand, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  emptyButtonText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  itemList: { gap: 10 },
  itemCard: { gap: 13, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 14, borderCurve: 'continuous' },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemMark: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemMarkBrand: { backgroundColor: '#F7CD77' },
  itemMarkBlue: { backgroundColor: '#C9D8FB' },
  itemMarkGreen: { backgroundColor: '#C6E7D9' },
  itemMarkText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  categoryText: { color: palette.muted, fontSize: 10 },
  itemStats: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 15, backgroundColor: '#F8F9FA', padding: 10 },
  itemStat: { flex: 1, gap: 3 },
  itemStatDivider: { width: 1, backgroundColor: '#E4E7EB', marginHorizontal: 8 },
  itemStatLabel: { color: palette.muted, fontSize: 8, fontWeight: '800' },
  itemStatValue: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  cardActions: { flexDirection: 'row', gap: 8 },
  editButton: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: palette.ink },
  editButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  deleteButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: '#F0C8C8', backgroundColor: palette.redSoft, paddingHorizontal: 15 },
  deleteButtonText: { color: palette.red, fontSize: 10, fontWeight: '900' },
  confirmBox: { gap: 12, borderRadius: 16, backgroundColor: palette.redSoft, borderWidth: 1, borderColor: '#F1CCCC', padding: 12 },
  confirmCopy: { gap: 3 },
  confirmTitle: { color: '#9C1C1C', fontSize: 12, fontWeight: '900' },
  confirmText: { color: '#9C4242', fontSize: 10, lineHeight: 16 },
  dangerButton: { flex: 1, minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: palette.red, paddingHorizontal: 14 },
  dangerButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  pressed: { opacity: 0.77 },
  disabled: { opacity: 0.5 },
});
