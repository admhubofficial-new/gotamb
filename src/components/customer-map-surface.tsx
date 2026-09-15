import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/components/gotamb-ui';

export type CustomerMapItem = {
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

export type CustomerMapVendor = {
  id: string;
  nama_perusahaan: string;
  logo_url: string | null;
  alamat: string | null;
  lokasi_lat: number | null;
  lokasi_lng: number | null;
  items: CustomerMapItem[];
};

export type CustomerCoordinate = {
  latitude: number;
  longitude: number;
};

export type CustomerMapSurfaceProps = {
  vendors: CustomerMapVendor[];
  selectedVendorId: string | null;
  loading: boolean;
  onSelectVendor: (vendorId: string) => void;
  showUserLocation?: boolean;
  focusUserRequest?: number;
  radiusKm?: number;
  onUserLocationChange?: (coordinate: CustomerCoordinate) => void;
};

function initials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'GT';
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
}

export function CustomerMapSurface({
  vendors,
  selectedVendorId,
  loading,
  onSelectVendor,
  radiusKm = 0,
}: CustomerMapSurfaceProps) {
  return (
    <View style={styles.map}>
      <View style={styles.mapGrid} />
      <View style={styles.label}>
        <Text style={styles.labelText}>Peta vendor</Text>
      </View>

      {loading ? (
        <View style={styles.centerCard}>
          <ActivityIndicator color={palette.brandDark} />
          <Text style={styles.helper}>Memuat vendor...</Text>
        </View>
      ) : null}

      {!loading && !vendors.length ? (
        <View style={styles.centerCard}>
          <Text style={styles.emptyTitle}>Belum ada vendor</Text>
          <Text style={styles.helper}>Vendor terverifikasi dengan titik lokasi akan tampil di sini.</Text>
        </View>
      ) : null}

      <View style={styles.vendorGrid}>
        {vendors.slice(0, 8).map((vendor) => {
          const selected = vendor.id === selectedVendorId;
          return (
            <Pressable
              key={vendor.id}
              onPress={() => onSelectVendor(vendor.id)}
              style={({ pressed }) => [styles.vendorPin, selected && styles.vendorPinSelected, pressed && styles.pressed]}>
              <View style={styles.logoWrap}>
                {vendor.logo_url ? (
                  <Image source={{ uri: vendor.logo_url }} style={styles.logo} contentFit="cover" />
                ) : (
                  <Text style={styles.initials}>{initials(vendor.nama_perusahaan)}</Text>
                )}
              </View>
              <Text numberOfLines={1} style={styles.vendorName}>{vendor.nama_perusahaan}</Text>
            </Pressable>
          );
        })}
      </View>

      {radiusKm > 0 ? (
        <View style={styles.radiusBadge}>
          <Text style={styles.radiusText}>Radius {radiusKm} km</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#E9EEE8' },
  mapGrid: { position: 'absolute', inset: 0, opacity: 0.4, backgroundColor: '#EEF3EC' },
  label: { position: 'absolute', left: 14, top: 14, zIndex: 2, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: '#DEE3DC', paddingHorizontal: 10, paddingVertical: 7 },
  labelText: { color: '#536056', fontSize: 10, fontWeight: '800' },
  centerCard: { position: 'absolute', left: 38, right: 38, top: '40%', alignItems: 'center', gap: 7, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.94)', padding: 16, borderWidth: 1, borderColor: '#DEE3DC' },
  emptyTitle: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  helper: { color: palette.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  vendorGrid: { position: 'absolute', left: 18, right: 18, top: 76, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vendorPin: { width: '23%', minWidth: 110, alignItems: 'center', gap: 5, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#E0E4DE', padding: 8 },
  vendorPinSelected: { borderColor: palette.brand, backgroundColor: '#FFF9ED' },
  logoWrap: { width: 48, height: 48, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft },
  logo: { width: '100%', height: '100%' },
  initials: { color: palette.brandDark, fontSize: 11, fontWeight: '900' },
  vendorName: { width: '100%', color: palette.ink, fontSize: 9, fontWeight: '800', textAlign: 'center' },
  radiusBadge: { position: 'absolute', right: 14, bottom: 14, borderRadius: 999, backgroundColor: 'rgba(23,32,42,0.88)', paddingHorizontal: 10, paddingVertical: 7 },
  radiusText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});
