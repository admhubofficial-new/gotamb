import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomerTripTrackingMap, type TrackingCoordinate } from '@/components/customer-trip-tracking-map';
import { BottomNav, BrandMark, SectionHeader, StatusChip, palette } from '@/components/gotamb-ui';
import { supabase } from '../../lib/supabase';

type OrderRow = {
  id: string;
  item_id: string;
  fleet_id: string | null;
  volume: number;
  status: 'menunggu' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  kontrak_id: string | null;
  total_harga: number;
  created_at: string | null;
  project_name: string | null;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  route_distance_m: number | null;
  route_duration_s: number | null;
  route_polyline: string | null;
  route_source: 'google_routes' | 'fallback' | null;
  vehicle_type: string | null;
};

type ItemRow = { id: string; vendor_id: string; nama_item: string; satuan: string };
type VendorRow = { id: string; nama_perusahaan: string; lokasi_lat: number | null; lokasi_lng: number | null };
type FleetRow = {
  id: string;
  no_polisi: string;
  jenis_armada: string;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
};

type OrderView = OrderRow & {
  materialName: string;
  unit: string;
  vendorName: string;
  vendorCoordinate: TrackingCoordinate | null;
  fleet: FleetRow | null;
};

type Filter = 'active' | 'done' | 'cancelled';

function rupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)}`;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function durationText(seconds: number | null) {
  if (!seconds) return '-';
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} menit`;
  return `${Math.floor(minutes / 60)} jam ${minutes % 60} menit`;
}

function statusMeta(status: OrderRow['status']) {
  if (status === 'menunggu') return { label: 'Menunggu vendor/driver', tone: 'brand' as const, step: 1 };
  if (status === 'diproses') return { label: 'Diproses', tone: 'blue' as const, step: 2 };
  if (status === 'dikirim') return { label: 'Dalam perjalanan', tone: 'green' as const, step: 3 };
  if (status === 'selesai') return { label: 'Selesai', tone: 'neutral' as const, step: 4 };
  return { label: 'Dibatalkan', tone: 'red' as const, step: 0 };
}

function decodePolyline(encoded: string | null): TrackingCoordinate[] {
  if (!encoded) return [];
  const result: TrackingCoordinate[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  while (index < encoded.length) {
    let shift = 0;
    let value = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      value |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    latitude += value & 1 ? ~(value >> 1) : value >> 1;
    shift = 0;
    value = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      value |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    longitude += value & 1 ? ~(value >> 1) : value >> 1;
    result.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }
  return result;
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
      .select('id, item_id, fleet_id, volume, status, kontrak_id, total_harga, created_at, project_name, delivery_address, delivery_lat, delivery_lng, route_distance_m, route_duration_s, route_polyline, route_source, vehicle_type')
      .eq('customer_id', authData.user.id)
      .order('created_at', { ascending: false });
    if (orderError) {
      setLoading(false);
      setError(orderError.message);
      return;
    }

    const orderRows = (orderData ?? []).map((order) => ({ ...order, volume: Number(order.volume), total_harga: Number(order.total_harga) })) as OrderRow[];
    if (!orderRows.length) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const itemIds = Array.from(new Set(orderRows.map((order) => order.item_id)));
    const fleetIds = Array.from(new Set(orderRows.map((order) => order.fleet_id).filter((id): id is string => Boolean(id))));
    const [itemResult, fleetResult] = await Promise.all([
      supabase.from('items').select('id, vendor_id, nama_item, satuan').in('id', itemIds),
      fleetIds.length
        ? supabase.from('fleets').select('id, no_polisi, jenis_armada, current_lat, current_lng, location_updated_at').in('id', fleetIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (itemResult.error || fleetResult.error) {
      setLoading(false);
      setError(itemResult.error?.message || fleetResult.error?.message || 'Data pesanan belum lengkap.');
      return;
    }

    const items = (itemResult.data ?? []) as ItemRow[];
    const vendorIds = Array.from(new Set(items.map((item) => item.vendor_id)));
    const { data: vendorData, error: vendorError } = await supabase.from('vendors').select('id, nama_perusahaan, lokasi_lat, lokasi_lng').in('id', vendorIds);
    if (vendorError) {
      setLoading(false);
      setError(vendorError.message);
      return;
    }

    const itemMap = new Map(items.map((item) => [item.id, item]));
    const vendorMap = new Map(((vendorData ?? []) as VendorRow[]).map((vendor) => [vendor.id, vendor]));
    const fleetMap = new Map(((fleetResult.data ?? []) as FleetRow[]).map((fleet) => [fleet.id, fleet]));

    setOrders(orderRows.map<OrderView>((order) => {
      const item = itemMap.get(order.item_id);
      const vendor = item ? vendorMap.get(item.vendor_id) : undefined;
      return {
        ...order,
        materialName: item?.nama_item ?? 'Material goTamb',
        unit: item?.satuan ?? 'unit',
        vendorName: vendor?.nama_perusahaan ?? 'Vendor goTamb',
        vendorCoordinate: vendor?.lokasi_lat != null && vendor?.lokasi_lng != null ? { latitude: vendor.lokasi_lat, longitude: vendor.lokasi_lng } : null,
        fleet: order.fleet_id ? fleetMap.get(order.fleet_id) ?? null : null,
      };
    }));
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    if (filter === 'done') return orders.filter((order) => order.status === 'selesai');
    if (filter === 'cancelled') return orders.filter((order) => order.status === 'dibatalkan');
    return orders.filter((order) => ['menunggu', 'diproses', 'dikirim'].includes(order.status));
  }, [filter, orders]);

  const trackingOrder = orders.find((order) => order.status === 'dikirim') ?? orders.find((order) => ['menunggu', 'diproses'].includes(order.status)) ?? null;
  const deliveryCoordinate = trackingOrder?.delivery_lat != null && trackingOrder?.delivery_lng != null ? { latitude: trackingOrder.delivery_lat, longitude: trackingOrder.delivery_lng } : null;
  const driverCoordinate = trackingOrder?.fleet?.current_lat != null && trackingOrder?.fleet?.current_lng != null ? { latitude: trackingOrder.fleet.current_lat, longitude: trackingOrder.fleet.current_lng } : null;
  const trackingRoute = useMemo(() => decodePolyline(trackingOrder?.route_polyline ?? null), [trackingOrder?.route_polyline]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 14, 26), paddingBottom: 30 }]}>
        <View style={styles.topBar}><BrandMark compact /><Pressable onPress={() => router.push('/customer-order')} style={styles.newButton}><Text style={styles.newButtonText}>＋ Pesan baru</Text></Pressable></View>
        <View style={styles.heading}><Text style={styles.eyebrow}>AKTIVITAS CUSTOMER</Text><Text selectable style={styles.title}>Pesanan saya</Text><Text style={styles.subtitle}>Pantau status, armada, rute, dan posisi Driver dari satu halaman.</Text></View>

        {created ? <View style={styles.createdBanner}><Text style={styles.createdIcon}>✓</Text><View style={styles.createdCopy}><Text selectable style={styles.createdTitle}>Pesanan {created} berhasil dibuat</Text><Text style={styles.createdText}>Armada sudah direservasi dan menunggu proses berikutnya.</Text></View></View> : null}

        {trackingOrder ? (
          <View style={styles.section}>
            <SectionHeader title="Tracking aktif" action="Perbarui" onAction={loadOrders} />
            <CustomerTripTrackingMap
              vendorCoordinate={trackingOrder.vendorCoordinate}
              deliveryCoordinate={deliveryCoordinate}
              driverCoordinate={driverCoordinate}
              routeCoordinates={trackingRoute}
              locationUpdatedAt={trackingOrder.fleet?.location_updated_at ?? null}
            />
            <View style={styles.trackingMeta}>
              <View><Text style={styles.metaLabel}>Armada</Text><Text selectable style={styles.metaValue}>{trackingOrder.fleet ? `${trackingOrder.fleet.jenis_armada} · ${trackingOrder.fleet.no_polisi}` : trackingOrder.vehicle_type || 'Menunggu armada'}</Text></View>
              <View><Text style={styles.metaLabel}>Rute</Text><Text selectable style={styles.metaValue}>{trackingOrder.route_distance_m ? `${(trackingOrder.route_distance_m / 1000).toFixed(1)} km · ${durationText(trackingOrder.route_duration_s)}` : 'Belum dihitung'}</Text></View>
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
          {loading ? <View style={styles.stateCard}><ActivityIndicator color={palette.brandDark} /><Text style={styles.stateText}>Memuat pesanan...</Text></View> : null}
          {!loading && error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Pesanan belum dapat dimuat</Text><Text selectable style={styles.errorText}>{error}</Text></View> : null}
          {!loading && !error && !filteredOrders.length ? <View style={styles.stateCard}><Text style={styles.emptyTitle}>Belum ada pesanan di bagian ini</Text><Text style={styles.stateText}>Cari vendor di peta lalu pilih material untuk membuat pesanan baru.</Text></View> : null}

          {filteredOrders.map((order) => {
            const meta = statusMeta(order.status);
            return (
              <View key={order.id} style={[styles.orderCard, created === order.kontrak_id && styles.orderCardHighlighted]}>
                <View style={styles.orderTop}><View style={styles.orderCopy}><Text selectable style={styles.orderCode}>{order.kontrak_id || `GT-${order.id.slice(0, 8).toUpperCase()}`}</Text><Text selectable style={styles.orderMaterial}>{order.materialName} · {order.volume} {order.unit}</Text></View><StatusChip label={meta.label} tone={meta.tone} /></View>
                <View style={styles.orderDetails}><Detail label="Vendor" value={order.vendorName} /><Detail label="Proyek" value={order.project_name || order.delivery_address || '-'} /><Detail label="Armada" value={order.fleet ? `${order.fleet.jenis_armada} · ${order.fleet.no_polisi}` : order.vehicle_type || 'Menunggu'} /></View>
                <View style={styles.timeline}>{[1, 2, 3, 4].map((step) => <View key={step} style={[styles.timelineDot, meta.step >= step && styles.timelineDotActive]} />)}</View>
                <View style={styles.orderFooter}><Text selectable style={styles.orderDate}>{formatDate(order.created_at)} · {order.route_source === 'google_routes' ? 'Google Routes' : 'Estimasi rute'}</Text><Text selectable style={styles.orderTotal}>{rupiah(order.total_harga)}</Text></View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <BottomNav activeKey="orders" items={[{ key: 'home', symbol: '⌂', label: 'Beranda', onPress: () => router.replace('/customer-home') }, { key: 'orders', symbol: '≡', label: 'Pesanan', onPress: () => {} }, { key: 'favorites', symbol: '♡', label: 'Favorit', onPress: () => router.push('/explore?role=customer&section=favorites') }, { key: 'profile', symbol: '○', label: 'Akun', onPress: () => router.push('/explore?role=customer&section=profile') }]} />
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text></Pressable>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text selectable numberOfLines={1} style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { paddingHorizontal: 18, gap: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  newButton: { minHeight: 40, justifyContent: 'center', borderRadius: 13, backgroundColor: palette.brand, paddingHorizontal: 12 },
  newButtonText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  heading: { gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: palette.ink, fontSize: 28, fontWeight: '900' },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  createdBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 17, backgroundColor: palette.greenSoft, borderWidth: 1, borderColor: '#BFE5D3', padding: 12 },
  createdIcon: { color: palette.green, fontSize: 18, fontWeight: '900' },
  createdCopy: { flex: 1, gap: 2 },
  createdTitle: { color: '#0C6B48', fontSize: 11, fontWeight: '900' },
  createdText: { color: '#477463', fontSize: 9 },
  section: { gap: 11 },
  trackingMeta: { flexDirection: 'row', gap: 10 },
  metaLabel: { color: palette.muted, fontSize: 8, fontWeight: '700' },
  metaValue: { color: palette.ink, fontSize: 10, fontWeight: '900', marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  filterChip: { borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, paddingHorizontal: 11, paddingVertical: 8 },
  filterChipActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  filterText: { color: palette.muted, fontSize: 9, fontWeight: '800' },
  filterTextActive: { color: '#FFFFFF' },
  refreshChip: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  refreshText: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  stateCard: { alignItems: 'center', gap: 8, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 18 },
  stateText: { color: palette.muted, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  emptyTitle: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  errorCard: { gap: 6, borderRadius: 18, backgroundColor: palette.redSoft, padding: 14 },
  errorTitle: { color: '#8C1717', fontSize: 11, fontWeight: '900' },
  errorText: { color: '#A92020', fontSize: 9, lineHeight: 14 },
  orderCard: { gap: 12, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 14 },
  orderCardHighlighted: { borderColor: '#E7B64C', backgroundColor: '#FFFCF5' },
  orderTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  orderCopy: { flex: 1, gap: 3 },
  orderCode: { color: palette.brandDark, fontSize: 9, fontWeight: '900' },
  orderMaterial: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  orderDetails: { gap: 5 },
  detailRow: { flexDirection: 'row', gap: 10 },
  detailLabel: { width: 52, color: palette.muted, fontSize: 8 },
  detailValue: { flex: 1, color: palette.ink, fontSize: 9, fontWeight: '700' },
  timeline: { flexDirection: 'row', gap: 5 },
  timelineDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E6E9ED' },
  timelineDotActive: { backgroundColor: palette.brand },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: '#EEF0F3', paddingTop: 10 },
  orderDate: { flex: 1, color: palette.muted, fontSize: 8 },
  orderTotal: { color: palette.green, fontSize: 11, fontWeight: '900' },
});
