import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav, BrandMark, SectionHeader, StatusChip, palette } from '@/components/gotamb-ui';
import { supabase } from '../../lib/supabase';

type OrderRow = {
  id: string;
  item_id: string;
  volume: number;
  status: 'menunggu' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  kontrak_id: string | null;
  total_harga: number;
  created_at: string | null;
  project_name: string | null;
  receiver_name: string | null;
  delivery_address: string | null;
  vehicle_type: string | null;
};

type ItemRow = {
  id: string;
  vendor_id: string;
  nama_item: string;
  satuan: string;
};

type VendorRow = {
  id: string;
  nama_perusahaan: string;
};

type OrderView = OrderRow & {
  materialName: string;
  unit: string;
  vendorName: string;
};

type Filter = 'active' | 'done' | 'cancelled';

function rupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)}`;
}

function formatDate(value: string | null) {
  if (!value) return 'Waktu tidak tersedia';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusMeta(status: OrderRow['status']) {
  if (status === 'menunggu') return { label: 'Menunggu vendor', tone: 'brand' as const, step: 1 };
  if (status === 'diproses') return { label: 'Diproses', tone: 'blue' as const, step: 2 };
  if (status === 'dikirim') return { label: 'Dalam perjalanan', tone: 'green' as const, step: 3 };
  if (status === 'selesai') return { label: 'Selesai', tone: 'neutral' as const, step: 4 };
  return { label: 'Dibatalkan', tone: 'red' as const, step: 0 };
}

export default function CustomerOrders() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ created?: string }>();
  const created = typeof params.created === 'string' ? params.created : '';
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('active');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setLoading(false);
      setError('Sesi Customer tidak ditemukan. Silakan login kembali.');
      return;
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, item_id, volume, status, kontrak_id, total_harga, created_at, project_name, receiver_name, delivery_address, vehicle_type')
      .eq('customer_id', authData.user.id)
      .order('created_at', { ascending: false });

    if (orderError) {
      setLoading(false);
      setError(orderError.message);
      return;
    }

    const orderRows = (orderData ?? []) as OrderRow[];
    if (!orderRows.length) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const itemIds = Array.from(new Set(orderRows.map((order) => order.item_id)));
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .select('id, vendor_id, nama_item, satuan')
      .in('id', itemIds);

    if (itemError) {
      setLoading(false);
      setError(itemError.message);
      return;
    }

    const items = (itemData ?? []) as ItemRow[];
    const vendorIds = Array.from(new Set(items.map((item) => item.vendor_id)));
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id, nama_perusahaan')
      .in('id', vendorIds);

    if (vendorError) {
      setLoading(false);
      setError(vendorError.message);
      return;
    }

    const itemMap = new Map(items.map((item) => [item.id, item]));
    const vendorMap = new Map(((vendorData ?? []) as VendorRow[]).map((vendor) => [vendor.id, vendor.nama_perusahaan]));
    setOrders(
      orderRows.map<OrderView>((order) => {
        const item = itemMap.get(order.item_id);
        return {
          ...order,
          materialName: item?.nama_item ?? 'Material goTamb',
          unit: item?.satuan ?? 'unit',
          vendorName: item ? vendorMap.get(item.vendor_id) ?? 'Vendor goTamb' : 'Vendor goTamb',
        };
      }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    if (filter === 'done') return orders.filter((order) => order.status === 'selesai');
    if (filter === 'cancelled') return orders.filter((order) => order.status === 'dibatalkan');
    return orders.filter((order) => ['menunggu', 'diproses', 'dikirim'].includes(order.status));
  }, [filter, orders]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 14, 26), paddingBottom: 30 }]}>
        <View style={styles.topBar}>
          <BrandMark compact />
          <Pressable onPress={() => router.push('/customer-order')} style={styles.newButton}><Text style={styles.newButtonText}>＋ Pesan baru</Text></Pressable>
        </View>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>AKTIVITAS CUSTOMER</Text>
          <Text style={styles.title}>Pesanan saya</Text>
          <Text style={styles.subtitle}>Pesanan di layar ini dibaca langsung dari Supabase dan mengikuti status vendor/pengiriman.</Text>
        </View>

        {created ? (
          <View style={styles.createdBanner}>
            <View style={styles.createdIcon}><Text style={styles.createdIconText}>✓</Text></View>
            <View style={styles.createdCopy}>
              <Text style={styles.createdTitle}>Pesanan {created} berhasil dibuat</Text>
              <Text style={styles.createdText}>Pesanan sudah tersimpan dan menunggu konfirmasi vendor.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.filterRow}>
          <FilterChip label="Aktif" active={filter === 'active'} onPress={() => setFilter('active')} />
          <FilterChip label="Selesai" active={filter === 'done'} onPress={() => setFilter('done')} />
          <FilterChip label="Dibatalkan" active={filter === 'cancelled'} onPress={() => setFilter('cancelled')} />
          <Pressable onPress={loadOrders} style={styles.refreshChip}><Text style={styles.refreshText}>↻</Text></Pressable>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Pesanan terbaru" />

          {loading ? (
            <View style={styles.stateCard}><ActivityIndicator color={palette.brandDark} /><Text style={styles.stateText}>Memuat pesanan...</Text></View>
          ) : null}

          {!loading && error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Pesanan belum dapat dimuat</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={loadOrders}><Text style={styles.retryText}>Coba lagi</Text></Pressable>
            </View>
          ) : null}

          {!loading && !error && !filteredOrders.length ? (
            <View style={styles.stateCard}>
              <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>≡</Text></View>
              <Text style={styles.emptyTitle}>Belum ada pesanan di bagian ini</Text>
              <Text style={styles.stateText}>Cari vendor di peta lalu pilih material untuk membuat pesanan baru.</Text>
              <Pressable onPress={() => router.replace('/customer-home')} style={styles.mapButton}><Text style={styles.mapButtonText}>Buka peta vendor</Text></Pressable>
            </View>
          ) : null}

          {filteredOrders.map((order) => {
            const meta = statusMeta(order.status);
            const isCreated = created && order.kontrak_id === created;
            return (
              <View key={order.id} style={[styles.orderCard, isCreated && styles.orderCardHighlighted]}>
                <View style={styles.orderTop}>
                  <View style={styles.orderCodeWrap}>
                    <Text style={styles.orderCode}>{order.kontrak_id || `GT-${order.id.slice(0, 8).toUpperCase()}`}</Text>
                    <Text style={styles.orderMaterial}>{order.materialName} · {order.volume} {order.unit}</Text>
                  </View>
                  <StatusChip label={meta.label} tone={meta.tone} />
                </View>

                <Text style={styles.vendorText}>{order.vendorName}</Text>

                {order.status !== 'dibatalkan' ? <Timeline step={meta.step} /> : null}

                <View style={styles.detailBox}>
                  {order.project_name ? <DetailRow label="Proyek" value={order.project_name} /> : null}
                  {order.delivery_address ? <DetailRow label="Alamat" value={order.delivery_address} /> : null}
                  {order.vehicle_type ? <DetailRow label="Armada" value={order.vehicle_type} /> : null}
                </View>

                <View style={styles.orderBottom}>
                  <Text style={styles.orderMeta}>{formatDate(order.created_at)}</Text>
                  <Text style={styles.orderTotal}>{rupiah(Number(order.total_harga))}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <BottomNav
        activeKey="orders"
        items={[
          { key: 'home', symbol: '⌂', label: 'Beranda', onPress: () => router.replace('/customer-home') },
          { key: 'orders', symbol: '≡', label: 'Pesanan', onPress: () => {} },
          { key: 'favorites', symbol: '♡', label: 'Favorit', onPress: () => router.push('/explore?role=customer&section=favorites') },
          { key: 'profile', symbol: '○', label: 'Akun', onPress: () => router.push('/explore?role=customer&section=profile') },
        ]}
      />
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Timeline({ step }: { step: number }) {
  return (
    <View style={styles.timelineStrip}>
      {[1, 2, 3, 4].map((value) => (
        <View key={value} style={styles.timelinePart}>
          <View style={[styles.timelineStep, value <= step && styles.timelineStepActive]}><Text style={[styles.timelineStepText, value <= step && styles.timelineStepTextActive]}>{value}</Text></View>
          {value < 4 ? <View style={[styles.timelineLine, value < step && styles.timelineLineActive]} /> : null}
        </View>
      ))}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text numberOfLines={2} style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { paddingHorizontal: 18, gap: 20, paddingBottom: 110 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  newButton: { minHeight: 39, justifyContent: 'center', borderRadius: 14, backgroundColor: palette.brand, paddingHorizontal: 12 },
  newButtonText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  heading: { gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: palette.ink, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  createdBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 17, backgroundColor: palette.greenSoft, borderWidth: 1, borderColor: '#C7E8D9', padding: 13 },
  createdIcon: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  createdIconText: { color: palette.green, fontSize: 18, fontWeight: '900' },
  createdCopy: { flex: 1, gap: 2 },
  createdTitle: { color: '#125E46', fontSize: 11, fontWeight: '900' },
  createdText: { color: '#467565', fontSize: 9, lineHeight: 14 },
  filterRow: { flexDirection: 'row', gap: 7 },
  filterChip: { minHeight: 34, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', paddingHorizontal: 12 },
  filterChipActive: { borderColor: '#E9BA55', backgroundColor: palette.brandSoft },
  filterText: { color: palette.muted, fontSize: 9, fontWeight: '800' },
  filterTextActive: { color: palette.brandDark, fontWeight: '900' },
  refreshChip: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  refreshText: { color: palette.ink, fontSize: 16, fontWeight: '900' },
  section: { gap: 10 },
  stateCard: { alignItems: 'center', gap: 9, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 22 },
  stateText: { color: palette.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft },
  emptyIconText: { color: palette.brandDark, fontSize: 18, fontWeight: '900' },
  emptyTitle: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  mapButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: palette.ink, paddingHorizontal: 14 },
  mapButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  errorCard: { gap: 6, borderRadius: 18, backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#F3CACA', padding: 14 },
  errorTitle: { color: '#971C1C', fontSize: 11, fontWeight: '900' },
  errorText: { color: '#A84A4A', fontSize: 9, lineHeight: 14 },
  retryText: { color: '#8C1717', fontSize: 10, fontWeight: '900' },
  orderCard: { gap: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 14, borderCurve: 'continuous' },
  orderCardHighlighted: { borderColor: '#E2B348', backgroundColor: '#FFFCF5' },
  orderTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 9 },
  orderCodeWrap: { flex: 1, gap: 3 },
  orderCode: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  orderMaterial: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  vendorText: { color: palette.ink, fontSize: 10, fontWeight: '800' },
  timelineStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3 },
  timelinePart: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  timelineStep: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9ECF0' },
  timelineStepActive: { backgroundColor: palette.brand },
  timelineStepText: { color: '#8A94A2', fontSize: 8, fontWeight: '900' },
  timelineStepTextActive: { color: palette.ink },
  timelineLine: { flex: 1, height: 2, backgroundColor: '#E4E7EB' },
  timelineLineActive: { backgroundColor: palette.brand },
  detailBox: { gap: 5, borderRadius: 14, backgroundColor: '#F7F8F9', padding: 10 },
  detailRow: { flexDirection: 'row', gap: 10 },
  detailLabel: { width: 54, color: palette.muted, fontSize: 8, fontWeight: '700' },
  detailValue: { flex: 1, color: palette.ink, fontSize: 8, lineHeight: 12, fontWeight: '700' },
  orderBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: '#EEF0F3', paddingTop: 10 },
  orderMeta: { flex: 1, color: palette.muted, fontSize: 9, lineHeight: 14 },
  orderTotal: { color: palette.green, fontSize: 11, fontWeight: '900' },
});
