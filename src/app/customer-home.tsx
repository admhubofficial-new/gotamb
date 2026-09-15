import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CustomerCoordinate,
  CustomerMapItem,
  CustomerMapSurface,
  CustomerMapVendor,
} from '@/components/customer-map-surface';
import { BottomNav, BrandMark, StatusChip, palette } from '@/components/gotamb-ui';
import { supabase } from '../../lib/supabase';

type VendorRow = {
  id: string;
  nama_perusahaan: string;
  logo_url: string | null;
  alamat: string | null;
  lokasi_lat: number | null;
  lokasi_lng: number | null;
};

const radiusOptions = [0, 10, 25, 50] as const;

function rupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)}`;
}

function vendorCoordinate(vendor: CustomerMapVendor): CustomerCoordinate | null {
  if (vendor.lokasi_lat !== null && vendor.lokasi_lng !== null) {
    return { latitude: vendor.lokasi_lat, longitude: vendor.lokasi_lng };
  }
  const item = vendor.items.find((entry) => entry.lokasi_lat !== null && entry.lokasi_lng !== null);
  if (!item || item.lokasi_lat === null || item.lokasi_lng === null) return null;
  return { latitude: item.lokasi_lat, longitude: item.lokasi_lng };
}

function distanceKm(a: CustomerCoordinate, b: CustomerCoordinate) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'GT';
}

export default function CustomerHome() {
  const insets = useSafeAreaInsets();
  const [vendors, setVendors] = useState<CustomerMapVendor[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const [radiusKm, setRadiusKm] = useState<number>(0);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<CustomerCoordinate | null>(null);
  const [focusUserRequest, setFocusUserRequest] = useState(0);

  function open(section: string) {
    router.push(`/explore?role=customer&section=${section}`);
  }

  const loadMarketplace = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id, nama_perusahaan, logo_url, alamat, lokasi_lat, lokasi_lng')
      .eq('status_verifikasi', 'terverifikasi')
      .order('created_at', { ascending: false });

    if (vendorError) {
      setLoading(false);
      setError(`Vendor belum dapat dimuat: ${vendorError.message}`);
      return;
    }

    const vendorRows = (vendorData ?? []) as VendorRow[];
    if (!vendorRows.length) {
      setVendors([]);
      setLoading(false);
      return;
    }

    const vendorIds = vendorRows.map((vendor) => vendor.id);
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .select('id, vendor_id, kategori, nama_item, harga, satuan, stok, lokasi_lat, lokasi_lng')
      .in('vendor_id', vendorIds)
      .gt('stok', 0)
      .order('created_at', { ascending: false });

    if (itemError) {
      setLoading(false);
      setError(`Material belum dapat dimuat: ${itemError.message}`);
      return;
    }

    const items = (itemData ?? []) as CustomerMapItem[];
    setVendors(
      vendorRows.map<CustomerMapVendor>((vendor) => ({
        ...vendor,
        items: items.filter((item) => item.vendor_id === vendor.id),
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  async function requestLocation(focus = true) {
    if (Platform.OS === 'web') {
      Alert.alert('Lokasi', 'Fitur lokasi perangkat digunakan pada aplikasi Android/iOS.');
      return;
    }

    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Izinkan lokasi goTamb',
          message: 'Lokasi digunakan untuk mencari vendor material terdekat dan menghitung radius pencarian.',
          buttonPositive: 'Izinkan',
          buttonNegative: 'Nanti',
        },
      );

      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Lokasi belum diizinkan', 'Anda tetap dapat mencari vendor secara manual dari peta.');
        return;
      }
    }

    setLocationEnabled(true);
    if (focus) setFocusUserRequest((value) => value + 1);
  }

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        vendors
          .flatMap((vendor) => vendor.items)
          .map((item) => item.kategori.trim())
          .filter(Boolean),
      ),
    );
    return ['Semua', ...unique];
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const hasItemFilter = Boolean(cleanQuery) || category !== 'Semua';

    return vendors
      .map((vendor) => {
        const matchingItems = hasItemFilter
          ? vendor.items.filter((item) => {
              const matchesCategory = category === 'Semua' || item.kategori === category;
              const matchesQuery =
                !cleanQuery ||
                item.nama_item.toLowerCase().includes(cleanQuery) ||
                item.kategori.toLowerCase().includes(cleanQuery) ||
                vendor.nama_perusahaan.toLowerCase().includes(cleanQuery);
              return matchesCategory && matchesQuery;
            })
          : vendor.items;
        return { ...vendor, items: matchingItems };
      })
      .filter((vendor) => !hasItemFilter || vendor.items.length > 0)
      .filter((vendor) => {
        if (!radiusKm || !userLocation) return true;
        const coordinate = vendorCoordinate(vendor);
        return coordinate ? distanceKm(userLocation, coordinate) <= radiusKm : false;
      });
  }, [category, query, radiusKm, userLocation, vendors]);

  useEffect(() => {
    if (selectedVendorId && !filteredVendors.some((vendor) => vendor.id === selectedVendorId)) {
      setSelectedVendorId(null);
    }
  }, [filteredVendors, selectedVendorId]);

  const selectedVendor = filteredVendors.find((vendor) => vendor.id === selectedVendorId) ?? null;
  const selectedItems = selectedVendor?.items.slice(0, 3) ?? [];
  const selectedCoordinate = selectedVendor ? vendorCoordinate(selectedVendor) : null;
  const selectedDistance =
    selectedCoordinate && userLocation ? distanceKm(userLocation, selectedCoordinate) : null;
  const activeFilterCount =
    (query.trim() ? 1 : 0) + (category !== 'Semua' ? 1 : 0) + (radiusKm > 0 ? 1 : 0);

  function resetMap() {
    setSelectedVendorId(null);
    setQuery('');
    setCategory('Semua');
    setRadiusKm(0);
  }

  async function chooseRadius(nextRadius: number) {
    setRadiusKm(nextRadius);
    setSelectedVendorId(null);
    if (nextRadius > 0 && !locationEnabled) {
      await requestLocation(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.mapStage}>
        <CustomerMapSurface
          vendors={filteredVendors}
          selectedVendorId={selectedVendorId}
          loading={loading}
          onSelectVendor={setSelectedVendorId}
          showUserLocation={locationEnabled}
          focusUserRequest={focusUserRequest}
          radiusKm={radiusKm}
          onUserLocationChange={setUserLocation}
        />

        <View style={[styles.topBar, { top: Math.max(insets.top + 9, 17) }]}>
          <View style={styles.brandPill}><BrandMark compact /></View>
          <Pressable
            accessibilityRole="button"
            onPress={() => requestLocation(true)}
            style={({ pressed }) => [styles.locationPill, locationEnabled && styles.locationPillActive, pressed && styles.pressed]}>
            <View style={styles.locationMark}><Text style={styles.locationMarkText}>⌖</Text></View>
            <View style={styles.locationCopy}>
              <Text style={styles.locationLabel}>{locationEnabled ? 'Lokasi perangkat' : 'Area pencarian'}</Text>
              <Text style={styles.locationValue}>{locationEnabled ? (userLocation ? 'Lokasi saya aktif' : 'Mencari posisi...') : 'Sumedang'}</Text>
            </View>
          </Pressable>
        </View>

        <View style={[styles.searchWrap, { top: Math.max(insets.top + 67, 75) }]}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              accessibilityLabel="Cari material"
              value={query}
              onChangeText={setQuery}
              placeholder="Cari pasir, batu split, tanah urug..."
              placeholderTextColor="#89939F"
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query ? (
              <Pressable accessibilityRole="button" onPress={() => setQuery('')} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>×</Text>
              </Pressable>
            ) : null}
            <View style={styles.filterButton}>
              <Text style={styles.filterSymbol}>≡</Text>
              {activeFilterCount ? <View style={styles.filterDot} /> : null}
            </View>
          </View>
        </View>

        <View style={[styles.categoryWrap, { top: Math.max(insets.top + 130, 138) }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalContent}>
            {categories.map((item) => {
              const active = category === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={({ pressed }) => [styles.categoryChip, active && styles.categoryChipActive, pressed && styles.pressed]}>
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.radiusWrap, { top: Math.max(insets.top + 171, 179) }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalContent}>
            {radiusOptions.map((option) => {
              const active = radiusKm === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => chooseRadius(option)}
                  style={({ pressed }) => [styles.radiusChip, active && styles.radiusChipActive, pressed && styles.pressed]}>
                  <Text style={[styles.radiusChipText, active && styles.radiusChipTextActive]}>
                    {option === 0 ? 'Semua jarak' : `${option} km`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.mapControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tampilkan posisi saya"
            onPress={() => requestLocation(true)}
            style={({ pressed }) => [styles.mapControlButton, locationEnabled && styles.mapControlButtonActive, pressed && styles.pressed]}>
            <Text style={styles.mapControlSymbol}>⌖</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Reset peta" onPress={resetMap} style={({ pressed }) => [styles.mapControlButton, pressed && styles.pressed]}>
            <Text style={styles.mapControlSymbol}>◎</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Muat ulang vendor" onPress={loadMarketplace} style={({ pressed }) => [styles.mapControlButton, pressed && styles.pressed]}>
            <Text style={styles.mapControlSymbol}>↻</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text selectable style={styles.errorText}>{error}</Text>
            <Pressable onPress={loadMarketplace}><Text style={styles.retryText}>Coba lagi</Text></Pressable>
          </View>
        ) : null}

        <View style={styles.bottomSheet}>
          {selectedVendor ? (
            <>
              <View style={styles.sheetHandle} />
              <View style={styles.vendorHeading}>
                <View style={styles.vendorAvatar}>
                  {selectedVendor.logo_url ? (
                    <Image source={{ uri: selectedVendor.logo_url }} style={styles.vendorLogo} contentFit="cover" />
                  ) : (
                    <Text style={styles.vendorAvatarText}>{initials(selectedVendor.nama_perusahaan)}</Text>
                  )}
                </View>
                <View style={styles.vendorHeadingCopy}>
                  <View style={styles.vendorTitleRow}>
                    <Text numberOfLines={1} style={styles.vendorName}>{selectedVendor.nama_perusahaan}</Text>
                    <StatusChip label="Terverifikasi" tone="green" />
                  </View>
                  <Text numberOfLines={1} style={styles.vendorAddress}>{selectedVendor.alamat || 'Lokasi vendor tersedia di peta'}</Text>
                  {selectedDistance !== null ? <Text style={styles.vendorDistance}>± {selectedDistance.toFixed(1)} km dari lokasi Anda</Text> : null}
                </View>
                <Pressable onPress={() => setSelectedVendorId(null)} hitSlop={8}><Text style={styles.closeSheet}>×</Text></Pressable>
              </View>

              <View style={styles.vendorStats}>
                <Text style={styles.vendorStatsText}>{selectedVendor.items.length} material sesuai pencarian</Text>
                <Text style={styles.vendorStatsDot}>•</Text>
                <Text style={styles.vendorStatsText}>Pilih material untuk checkout</Text>
              </View>

              {selectedItems.length ? (
                <View style={styles.itemList}>
                  {selectedItems.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => router.push(`/customer-order?item=${item.id}&vendor=${selectedVendor.id}`)}
                      style={({ pressed }) => [styles.itemRow, pressed && styles.pressed]}>
                      <View style={styles.itemMark}><Text style={styles.itemMarkText}>{item.kategori.slice(0, 2).toUpperCase()}</Text></View>
                      <View style={styles.itemCopy}>
                        <Text numberOfLines={1} style={styles.itemName}>{item.nama_item}</Text>
                        <Text style={styles.itemMeta}>Stok {item.stok} {item.satuan}</Text>
                      </View>
                      <Text style={styles.itemPrice}>{rupiah(item.harga)} / {item.satuan}</Text>
                      <Text style={styles.itemChevron}>›</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.noItemBox}><Text style={styles.noItemText}>Tidak ada material yang cocok dengan filter saat ini.</Text></View>
              )}

              <View style={styles.sheetActions}>
                <Pressable onPress={() => open('favorites')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                  <Text style={styles.secondaryButtonText}>♡ Simpan</Text>
                </Pressable>
                <Pressable onPress={() => router.push(`/customer-order?vendor=${selectedVendor.id}`)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <Text style={styles.primaryButtonText}>Semua material</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.sheetHandle} />
              <View style={styles.resultHeading}>
                <View style={styles.resultCopy}>
                  <Text style={styles.resultEyebrow}>VENDOR DI PETA</Text>
                  <Text selectable style={styles.resultTitle}>{loading ? 'Mencari vendor...' : `${filteredVendors.length} vendor ditemukan`}</Text>
                  <Text selectable style={styles.resultSubtitle}>
                    {radiusKm > 0 && !userLocation
                      ? 'Izinkan lokasi agar filter radius dapat diterapkan.'
                      : query || category !== 'Semua' || radiusKm > 0
                        ? 'Peta hanya menampilkan perusahaan yang sesuai pencarian dan radius.'
                        : 'Logo di peta mewakili perusahaan. Ketuk logo untuk melihat material yang tersedia.'}
                  </Text>
                </View>
                <View style={styles.companyLegend}><Text style={styles.companyLegendText}>LOGO</Text></View>
              </View>

              <View style={styles.quickActions}>
                <Pressable onPress={() => router.push('/customer-orders')} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
                  <Text style={styles.quickActionSymbol}>↗</Text>
                  <View style={styles.quickActionCopy}><Text style={styles.quickActionTitle}>Pesanan saya</Text><Text style={styles.quickActionText}>Lacak status pengiriman</Text></View>
                </Pressable>
                <Pressable onPress={() => router.push('/customer-order')} style={({ pressed }) => [styles.quickAction, styles.quickActionBrand, pressed && styles.pressed]}>
                  <Text style={styles.quickActionSymbol}>＋</Text>
                  <View style={styles.quickActionCopy}><Text style={styles.quickActionTitle}>Pesan material</Text><Text style={styles.quickActionText}>Buka semua material</Text></View>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>

      <BottomNav
        activeKey="home"
        items={[
          { key: 'home', symbol: '⌂', label: 'Beranda', onPress: () => {} },
          { key: 'orders', symbol: '≡', label: 'Pesanan', onPress: () => router.push('/customer-orders') },
          { key: 'favorites', symbol: '♡', label: 'Favorit', onPress: () => open('favorites') },
          { key: 'profile', symbol: '○', label: 'Akun', onPress: () => open('profile') },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  mapStage: { flex: 1, position: 'relative', backgroundColor: '#EEF1E8' },
  topBar: { position: 'absolute', left: 14, right: 14, zIndex: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  brandPill: { minHeight: 48, justifyContent: 'center', borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: '#E2E5E0', paddingHorizontal: 11, boxShadow: '0 7px 18px rgba(23, 32, 42, 0.09)' },
  locationPill: { minHeight: 48, maxWidth: 176, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: '#E2E5E0', paddingHorizontal: 9, boxShadow: '0 7px 18px rgba(23, 32, 42, 0.09)' },
  locationPillActive: { borderColor: '#BFE2D3' },
  locationMark: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft },
  locationMarkText: { color: palette.brandDark, fontSize: 16, fontWeight: '900' },
  locationCopy: { flex: 1 },
  locationLabel: { color: palette.muted, fontSize: 8, fontWeight: '700' },
  locationValue: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  searchWrap: { position: 'absolute', left: 14, right: 14, zIndex: 19 },
  searchBox: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: '#E0E4DE', paddingLeft: 14, paddingRight: 7, boxShadow: '0 9px 22px rgba(23, 32, 42, 0.11)' },
  searchIcon: { color: palette.ink, fontSize: 21, fontWeight: '900' },
  searchInput: { flex: 1, minHeight: 50, color: palette.ink, fontSize: 13 },
  clearButton: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F2F1' },
  clearButtonText: { color: palette.muted, fontSize: 18, lineHeight: 20, fontWeight: '700' },
  filterButton: { position: 'relative', width: 41, height: 41, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  filterSymbol: { color: palette.ink, fontSize: 18, fontWeight: '900' },
  filterDot: { position: 'absolute', right: 5, top: 5, width: 7, height: 7, borderRadius: 4, backgroundColor: palette.red, borderWidth: 1, borderColor: '#FFFFFF' },
  categoryWrap: { position: 'absolute', left: 0, right: 0, zIndex: 18 },
  radiusWrap: { position: 'absolute', left: 0, right: 0, zIndex: 18 },
  horizontalContent: { paddingHorizontal: 14, gap: 8 },
  categoryChip: { minHeight: 34, justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: '#E0E4DE', paddingHorizontal: 13 },
  categoryChipActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  categoryChipText: { color: '#556070', fontSize: 10, fontWeight: '800' },
  categoryChipTextActive: { color: '#FFFFFF' },
  radiusChip: { minHeight: 30, justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: '#E0E4DE', paddingHorizontal: 12 },
  radiusChipActive: { backgroundColor: palette.brandSoft, borderColor: '#E8BF69' },
  radiusChipText: { color: '#64707B', fontSize: 9, fontWeight: '800' },
  radiusChipTextActive: { color: palette.brandDark },
  mapControls: { position: 'absolute', zIndex: 17, right: 14, top: '42%', gap: 8 },
  mapControlButton: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: '#E0E4DE', boxShadow: '0 5px 14px rgba(23, 32, 42, 0.1)' },
  mapControlButtonActive: { backgroundColor: palette.brandSoft, borderColor: '#E8BF69' },
  mapControlSymbol: { color: palette.ink, fontSize: 19, fontWeight: '900' },
  errorBanner: { position: 'absolute', zIndex: 22, left: 14, right: 14, top: '28%', flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#F7CACA', padding: 11 },
  errorText: { flex: 1, color: '#A92020', fontSize: 10, lineHeight: 15 },
  retryText: { color: '#8C1717', fontSize: 10, fontWeight: '900' },
  bottomSheet: { position: 'absolute', zIndex: 25, left: 12, right: 12, bottom: 12, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: '#E3E6E1', padding: 14, gap: 10, borderCurve: 'continuous', boxShadow: '0 12px 28px rgba(23, 32, 42, 0.16)' },
  sheetHandle: { width: 37, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#D8DDE1' },
  resultHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultCopy: { flex: 1, gap: 3 },
  resultEyebrow: { color: palette.brandDark, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  resultTitle: { color: palette.ink, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  resultSubtitle: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  companyLegend: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft, borderWidth: 1, borderColor: '#F4D79B' },
  companyLegendText: { color: palette.brandDark, fontSize: 9, fontWeight: '900' },
  quickActions: { flexDirection: 'row', gap: 8 },
  quickAction: { flex: 1, minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, backgroundColor: '#F5F7F8', borderWidth: 1, borderColor: '#E7EAED', paddingHorizontal: 10 },
  quickActionBrand: { backgroundColor: palette.brandSoft, borderColor: '#F4D79B' },
  quickActionSymbol: { color: palette.ink, fontSize: 17, fontWeight: '900' },
  quickActionCopy: { flex: 1, gap: 2 },
  quickActionTitle: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  quickActionText: { color: palette.muted, fontSize: 8 },
  vendorHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vendorAvatar: { width: 47, height: 47, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.ink },
  vendorLogo: { width: '100%', height: '100%' },
  vendorAvatarText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  vendorHeadingCopy: { flex: 1, gap: 2 },
  vendorTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  vendorName: { flex: 1, color: palette.ink, fontSize: 14, fontWeight: '900' },
  vendorAddress: { color: palette.muted, fontSize: 9 },
  vendorDistance: { color: palette.green, fontSize: 8, fontWeight: '800' },
  closeSheet: { color: '#89939F', fontSize: 24, lineHeight: 24 },
  vendorStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vendorStatsText: { color: palette.muted, fontSize: 8, fontWeight: '700' },
  vendorStatsDot: { color: '#A4ACB5', fontSize: 9 },
  itemList: { gap: 7 },
  itemRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF', padding: 8 },
  itemMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft },
  itemMarkText: { color: palette.brandDark, fontSize: 9, fontWeight: '900' },
  itemCopy: { flex: 1, gap: 2 },
  itemName: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  itemMeta: { color: palette.muted, fontSize: 8 },
  itemPrice: { color: palette.green, fontSize: 9, fontWeight: '900', fontVariant: ['tabular-nums'] },
  itemChevron: { color: '#A0A8B3', fontSize: 20, fontWeight: '700' },
  noItemBox: { borderRadius: 14, backgroundColor: '#F7F8F8', padding: 11 },
  noItemText: { color: palette.muted, fontSize: 9, lineHeight: 14, textAlign: 'center' },
  sheetActions: { flexDirection: 'row', gap: 8 },
  secondaryButton: { minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#F5F7F8', borderWidth: 1, borderColor: '#E3E7EA', paddingHorizontal: 14 },
  secondaryButtonText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  primaryButton: { flex: 1, minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: palette.brand },
  primaryButtonText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  pressed: { opacity: 0.76 },
});
