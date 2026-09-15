import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, PermissionsAndroid, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DriverTripMap, type TripCoordinate } from '@/components/driver-trip-map';
import { BottomNav, BrandMark, SectionHeader, StatusChip, palette } from '@/components/gotamb-ui';
import { supabase } from '../../lib/supabase';

type FleetRow = {
  id: string;
  vendor_id: string;
  no_polisi: string;
  kapasitas: number | null;
  satuan_kapasitas: string;
  jenis_armada: string;
  status_ketersediaan: string;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
};

type OrderRow = {
  id: string;
  item_id: string;
  fleet_id: string | null;
  status: 'menunggu' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  kontrak_id: string | null;
  volume: number;
  shipping_cost: number;
  project_name: string | null;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  route_distance_m: number | null;
  route_duration_s: number | null;
  route_polyline: string | null;
  route_source: 'google_routes' | 'fallback' | null;
  created_at: string | null;
};

type ItemRow = { id: string; vendor_id: string; nama_item: string; satuan: string };
type VendorRow = { id: string; nama_perusahaan: string; alamat: string | null; lokasi_lat: number | null; lokasi_lng: number | null };

type OrderView = OrderRow & {
  materialName: string;
  unit: string;
  vendorName: string;
  vendorAddress: string | null;
  vendorCoordinate: TripCoordinate | null;
};

function rupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)}`;
}

function durationText(seconds: number | null) {
  if (!seconds) return '-';
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} menit`;
  return `${Math.floor(minutes / 60)} jam ${minutes % 60} menit`;
}

function decodePolyline(encoded: string | null): TripCoordinate[] {
  if (!encoded) return [];
  const result: TripCoordinate[] = [];
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

function nextStatus(status: OrderRow['status']) {
  if (status === 'menunggu') return { status: 'diproses' as const, label: 'Terima & proses' };
  if (status === 'diproses') return { status: 'dikirim' as const, label: 'Mulai pengiriman' };
  if (status === 'dikirim') return { status: 'selesai' as const, label: 'Selesaikan pengiriman' };
  return null;
}

export default function DriverHome() {
  const insets = useSafeAreaInsets();
  const [driverName, setDriverName] = useState('Driver');
  const [fleets, setFleets] = useState<FleetRow[]>([]);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const lastLocationPush = useRef(0);

  function open(section: string) {
    router.push(`/explore?role=driver&section=${section}`);
  }

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setLoading(false);
      setError('Sesi Driver tidak ditemukan. Silakan login kembali.');
      return;
    }

    const userId = authData.user.id;
    const [profileResult, fleetResult, orderResult] = await Promise.all([
      supabase.from('profiles').select('nama').eq('id', userId).single(),
      supabase.from('fleets').select('id, vendor_id, no_polisi, kapasitas, satuan_kapasitas, jenis_armada, status_ketersediaan, current_lat, current_lng, location_updated_at').eq('driver_id', userId),
      supabase.from('orders').select('id, item_id, fleet_id, status, kontrak_id, volume, shipping_cost, project_name, delivery_address, delivery_lat, delivery_lng, route_distance_m, route_duration_s, route_polyline, route_source, created_at').eq('driver_id', userId).order('created_at', { ascending: false }),
    ]);

    if (profileResult.data?.nama) setDriverName(profileResult.data.nama);
    if (fleetResult.error || orderResult.error) {
      setLoading(false);
      setError(fleetResult.error?.message || orderResult.error?.message || 'Data Driver belum dapat dimuat.');
      return;
    }

    const fleetRows = (fleetResult.data ?? []).map((fleet) => ({ ...fleet, kapasitas: fleet.kapasitas == null ? null : Number(fleet.kapasitas) })) as FleetRow[];
    const orderRows = (orderResult.data ?? []).map((order) => ({ ...order, volume: Number(order.volume), shipping_cost: Number(order.shipping_cost) })) as OrderRow[];
    setFleets(fleetRows);

    if (!orderRows.length) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const itemIds = Array.from(new Set(orderRows.map((order) => order.item_id)));
    const { data: itemData, error: itemError } = await supabase.from('items').select('id, vendor_id, nama_item, satuan').in('id', itemIds);
    if (itemError) {
      setLoading(false);
      setError(itemError.message);
      return;
    }

    const items = (itemData ?? []) as ItemRow[];
    const vendorIds = Array.from(new Set(items.map((item) => item.vendor_id)));
    const { data: vendorData, error: vendorError } = await supabase.from('vendors').select('id, nama_perusahaan, alamat, lokasi_lat, lokasi_lng').in('id', vendorIds);
    if (vendorError) {
      setLoading(false);
      setError(vendorError.message);
      return;
    }

    const itemMap = new Map(items.map((item) => [item.id, item]));
    const vendorMap = new Map(((vendorData ?? []) as VendorRow[]).map((vendor) => [vendor.id, vendor]));
    setOrders(orderRows.map<OrderView>((order) => {
      const item = itemMap.get(order.item_id);
      const vendor = item ? vendorMap.get(item.vendor_id) : undefined;
      return {
        ...order,
        materialName: item?.nama_item ?? 'Material goTamb',
        unit: item?.satuan ?? 'unit',
        vendorName: vendor?.nama_perusahaan ?? 'Vendor goTamb',
        vendorAddress: vendor?.alamat ?? null,
        vendorCoordinate: vendor?.lokasi_lat != null && vendor?.lokasi_lng != null ? { latitude: vendor.lokasi_lat, longitude: vendor.lokasi_lng } : null,
      };
    }));
    setLoading(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const activeOrder = orders.find((order) => ['menunggu', 'diproses', 'dikirim'].includes(order.status)) ?? null;
  const currentFleet = activeOrder?.fleet_id ? fleets.find((fleet) => fleet.id === activeOrder.fleet_id) ?? fleets[0] ?? null : fleets[0] ?? null;
  const driverCoordinate = currentFleet?.current_lat != null && currentFleet?.current_lng != null ? { latitude: currentFleet.current_lat, longitude: currentFleet.current_lng } : null;
  const deliveryCoordinate = activeOrder?.delivery_lat != null && activeOrder?.delivery_lng != null ? { latitude: activeOrder.delivery_lat, longitude: activeOrder.delivery_lng } : null;
  const routeCoordinates = useMemo(() => decodePolyline(activeOrder?.route_polyline ?? null), [activeOrder?.route_polyline]);
  const action = activeOrder ? nextStatus(activeOrder.status) : null;

  async function enableTracking() {
    if (process.env.EXPO_OS === 'android') {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
        title: 'Aktifkan GPS Driver',
        message: 'Lokasi digunakan agar Customer dan Vendor dapat memantau perjalanan pengiriman aktif.',
        buttonPositive: 'Aktifkan',
        buttonNegative: 'Nanti',
      });
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('GPS belum aktif', 'Tracking tetap dapat dilanjutkan nanti setelah izin lokasi diberikan.');
        return;
      }
    }
    setTrackingEnabled(true);
  }

  async function pushDriverLocation(coordinate: TripCoordinate) {
    const now = Date.now();
    setFleets((current) => current.map((fleet) => fleet.id === currentFleet?.id ? { ...fleet, current_lat: coordinate.latitude, current_lng: coordinate.longitude, location_updated_at: new Date().toISOString() } : fleet));
    if (now - lastLocationPush.current < 15000) return;
    lastLocationPush.current = now;
    await supabase.rpc('update_driver_location', { p_lat: coordinate.latitude, p_lng: coordinate.longitude });
  }

  async function advanceStatus() {
    if (!activeOrder || !action || updatingStatus) return;
    setUpdatingStatus(true);
    const { error: updateError } = await supabase.from('orders').update({ status: action.status }).eq('id', activeOrder.id);
    setUpdatingStatus(false);
    if (updateError) {
      Alert.alert('Status belum berubah', updateError.message);
      return;
    }
    await loadDashboard();
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 16, 28), paddingBottom: 32 }]}>
        <View style={styles.topBar}><BrandMark compact /><Pressable onPress={loadDashboard} style={styles.refreshButton}><Text style={styles.refreshText}>↻ Muat ulang</Text></Pressable></View>

        <View style={styles.heading}><Text style={styles.eyebrow}>DASHBOARD DRIVER</Text><Text selectable style={styles.title}>Halo, {driverName}</Text><Text style={styles.subtitle}>Tugas hanya muncul jika akun Driver sudah dipasangkan ke armada oleh Vendor.</Text></View>

        {loading ? <View style={styles.stateCard}><ActivityIndicator color={palette.brandDark} /><Text style={styles.stateText}>Memuat tugas Driver...</Text></View> : null}
        {!loading && error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Dashboard belum dapat dimuat</Text><Text selectable style={styles.errorText}>{error}</Text></View> : null}

        {!loading && !error ? (
          <>
            <View style={styles.statusCard}>
              <View style={styles.statusCopy}><Text style={styles.statusLabel}>Armada saya</Text><Text selectable style={styles.statusValue}>{currentFleet ? `${currentFleet.jenis_armada} · ${currentFleet.no_polisi}` : 'Belum dipasangkan ke armada'}</Text></View>
              <StatusChip label={currentFleet?.status_ketersediaan ?? 'Belum ada'} tone={currentFleet?.status_ketersediaan === 'bertugas' ? 'green' : 'neutral'} />
            </View>

            {activeOrder ? (
              <View style={styles.section}>
                <SectionHeader title="Pengiriman aktif" />
                <View style={styles.tripCard}>
                  <View style={styles.tripHeader}><View><Text style={styles.tripCode}>{activeOrder.kontrak_id || activeOrder.id.slice(0, 8)}</Text><Text selectable style={styles.tripTitle}>{activeOrder.materialName} · {activeOrder.volume} {activeOrder.unit}</Text></View><StatusChip label={activeOrder.status} tone={activeOrder.status === 'dikirim' ? 'green' : 'brand'} /></View>
                  <View style={styles.routeBlock}><Text style={styles.routeLabel}>AMBIL</Text><Text selectable style={styles.routeValue}>{activeOrder.vendorName}{activeOrder.vendorAddress ? ` · ${activeOrder.vendorAddress}` : ''}</Text><Text style={styles.routeLabel}>KIRIM</Text><Text selectable style={styles.routeValue}>{activeOrder.project_name || 'Proyek Customer'} · {activeOrder.delivery_address || '-'}</Text></View>
                  <View style={styles.tripMeta}><Text selectable style={styles.metaText}>{activeOrder.route_distance_m ? `${(activeOrder.route_distance_m / 1000).toFixed(1)} km` : '-'} · {durationText(activeOrder.route_duration_s)}</Text><Text selectable style={styles.payText}>{rupiah(activeOrder.shipping_cost)}</Text></View>
                </View>

                <DriverTripMap vendorCoordinate={activeOrder.vendorCoordinate} deliveryCoordinate={deliveryCoordinate} driverCoordinate={driverCoordinate} routeCoordinates={routeCoordinates} trackingEnabled={trackingEnabled} onDriverLocation={pushDriverLocation} />

                {!trackingEnabled ? <Pressable onPress={enableTracking} style={styles.gpsButton}><Text style={styles.gpsButtonText}>◎ Aktifkan GPS perjalanan</Text></Pressable> : null}
                {action ? <Pressable onPress={advanceStatus} disabled={updatingStatus} style={[styles.primaryButton, updatingStatus && styles.disabled]}>{updatingStatus ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{action.label}</Text>}</Pressable> : null}
              </View>
            ) : (
              <View style={styles.stateCard}><View style={styles.emptyIcon}><Text style={styles.emptyIconText}>TR</Text></View><Text style={styles.emptyTitle}>Belum ada tugas aktif</Text><Text style={styles.stateText}>{currentFleet ? 'Armada sudah terhubung. Tugas akan muncul ketika Vendor/Customer memakai armada ini.' : 'Minta Vendor memasangkan akun Driver ini ke salah satu armada terlebih dahulu.'}</Text></View>
            )}

            {orders.filter((order) => order.status === 'selesai').length ? (
              <View style={styles.section}><SectionHeader title="Riwayat selesai" />{orders.filter((order) => order.status === 'selesai').slice(0, 3).map((order) => <View key={order.id} style={styles.historyCard}><View><Text style={styles.historyTitle}>{order.materialName}</Text><Text style={styles.historyMeta}>{order.kontrak_id || order.id.slice(0, 8)}</Text></View><Text style={styles.historyPay}>{rupiah(order.shipping_cost)}</Text></View>)}</View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <BottomNav activeKey="home" items={[{ key: 'home', symbol: '⌂', label: 'Beranda', onPress: () => {} }, { key: 'trips', symbol: '↗', label: 'Perjalanan', onPress: () => open('trips') }, { key: 'wallet', symbol: '◈', label: 'Dompet', onPress: () => open('wallet') }, { key: 'profile', symbol: '○', label: 'Akun', onPress: () => open('profile') }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { paddingHorizontal: 18, gap: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refreshButton: { minHeight: 38, justifyContent: 'center', borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, paddingHorizontal: 12 },
  refreshText: { color: palette.ink, fontSize: 10, fontWeight: '800' },
  heading: { gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: palette.ink, fontSize: 28, lineHeight: 33, fontWeight: '900' },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 14 },
  statusCopy: { flex: 1, gap: 3 },
  statusLabel: { color: palette.muted, fontSize: 9, fontWeight: '700' },
  statusValue: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  section: { gap: 12 },
  tripCard: { gap: 14, borderRadius: 22, backgroundColor: palette.ink, padding: 17 },
  tripHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  tripCode: { color: '#AEB7C2', fontSize: 9, fontWeight: '700' },
  tripTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 3 },
  routeBlock: { gap: 4 },
  routeLabel: { color: '#82909D', fontSize: 8, fontWeight: '900', marginTop: 6 },
  routeValue: { color: '#E8ECF0', fontSize: 10, lineHeight: 15, fontWeight: '700' },
  tripMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: '#34404C', paddingTop: 11 },
  metaText: { color: '#AEB7C2', fontSize: 10 },
  payText: { color: '#FBCB6B', fontSize: 12, fontWeight: '900' },
  gpsButton: { minHeight: 49, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.brandSoft, borderWidth: 1, borderColor: '#F0D18D' },
  gpsButtonText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.ink },
  primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  stateCard: { alignItems: 'center', gap: 9, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 20 },
  stateText: { color: palette.muted, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft },
  emptyIconText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  emptyTitle: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  errorCard: { gap: 7, borderRadius: 18, backgroundColor: palette.redSoft, padding: 15 },
  errorTitle: { color: '#8C1717', fontSize: 12, fontWeight: '900' },
  errorText: { color: '#A92020', fontSize: 10, lineHeight: 15 },
  historyCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 13 },
  historyTitle: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  historyMeta: { color: palette.muted, fontSize: 9, marginTop: 2 },
  historyPay: { color: palette.green, fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.45 },
});
