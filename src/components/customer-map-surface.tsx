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

type Coordinate = { latitude: number; longitude: number };

type PositionedVendor = {
  vendor: CustomerMapVendor;
  coordinate: Coordinate;
  left: `${number}%`;
  top: `${number}%`;
};

function getVendorCoordinate(vendor: CustomerMapVendor): Coordinate | null {
  if (vendor.lokasi_lat !== null && vendor.lokasi_lng !== null) {
    return { latitude: vendor.lokasi_lat, longitude: vendor.lokasi_lng };
  }

  const itemWithLocation = vendor.items.find(
    (item) => item.lokasi_lat !== null && item.lokasi_lng !== null,
  );

  if (!itemWithLocation || itemWithLocation.lokasi_lat === null || itemWithLocation.lokasi_lng === null) {
    return null;
  }

  return {
    latitude: itemWithLocation.lokasi_lat,
    longitude: itemWithLocation.lokasi_lng,
  };
}

function initials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'GT';
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function positionVendors(vendors: CustomerMapVendor[]): PositionedVendor[] {
  const located = vendors
    .map((vendor) => ({ vendor, coordinate: getVendorCoordinate(vendor) }))
    .filter((entry): entry is { vendor: CustomerMapVendor; coordinate: Coordinate } => Boolean(entry.coordinate));

  if (!located.length) return [];

  const lats = located.map((entry) => entry.coordinate.latitude);
  const lngs = located.map((entry) => entry.coordinate.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.02);
  const lngSpan = Math.max(maxLng - minLng, 0.02);
  const latCenter = (maxLat + minLat) / 2;
  const lngCenter = (maxLng + minLng) / 2;

  return located.map(({ vendor, coordinate }, index) => {
    const x = 50 + ((coordinate.longitude - lngCenter) / lngSpan) * 62;
    const y = 50 - ((coordinate.latitude - latCenter) / latSpan) * 58;
    const nudgeX = located.length === 1 ? 0 : ((index % 3) - 1) * 1.2;
    const nudgeY = located.length === 1 ? 0 : ((index % 2) - 0.5) * 1.4;

    return {
      vendor,
      coordinate,
      left: `${clamp(x + nudgeX, 12, 88)}%`,
      top: `${clamp(y + nudgeY, 20, 79)}%`,
    };
  });
}

export function CustomerMapSurface({
  vendors,
  selectedVendorId,
  loading,
  onSelectVendor,
}: {
  vendors: CustomerMapVendor[];
  selectedVendorId: string | null;
  loading: boolean;
  onSelectVendor: (vendorId: string) => void;
}) {
  const positioned = positionVendors(vendors);
  const missingLocationCount = vendors.length - positioned.length;

  return (
    <View style={styles.map}>
      <View style={styles.waterTop} />
      <View style={styles.parkOne} />
      <View style={styles.parkTwo} />
      <View style={[styles.road, styles.roadOne]} />
      <View style={[styles.road, styles.roadTwo]} />
      <View style={[styles.road, styles.roadThree]} />
      <View style={[styles.roadMinor, styles.roadMinorOne]} />
      <View style={[styles.roadMinor, styles.roadMinorTwo]} />
      <View style={[styles.roadMinor, styles.roadMinorThree]} />

      <View style={styles.mapLabel}>
        <View style={styles.mapLabelDot} />
        <Text style={styles.mapLabelText}>Peta vendor</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={palette.brandDark} />
          <Text style={styles.centerStateText}>Memuat vendor...</Text>
        </View>
      ) : null}

      {!loading && positioned.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.emptyPin}><Text style={styles.emptyPinText}>⌖</Text></View>
          <Text style={styles.emptyTitle}>Belum ada titik vendor</Text>
          <Text style={styles.centerStateText}>Vendor akan muncul setelah lokasi perusahaan atau lokasi material diisi.</Text>
        </View>
      ) : null}

      {positioned.map(({ vendor, left, top }) => {
        const selected = vendor.id === selectedVendorId;
        return (
          <Pressable
            key={vendor.id}
            accessibilityRole="button"
            accessibilityLabel={`Vendor ${vendor.nama_perusahaan}`}
            onPress={() => onSelectVendor(vendor.id)}
            style={({ pressed }) => [
              styles.pinWrap,
              { left, top },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.pin, selected && styles.pinSelected]}>
              {vendor.logo_url ? (
                <Image source={{ uri: vendor.logo_url }} style={styles.logo} contentFit="cover" transition={120} />
              ) : (
                <Text style={styles.pinInitials}>{initials(vendor.nama_perusahaan)}</Text>
              )}
            </View>
            <View style={[styles.pinTail, selected && styles.pinTailSelected]} />
            {selected ? (
              <View style={styles.pinNameBubble}>
                <Text numberOfLines={1} style={styles.pinName}>{vendor.nama_perusahaan}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}

      {missingLocationCount > 0 ? (
        <View style={styles.missingBadge}>
          <Text style={styles.missingBadgeText}>{missingLocationCount} vendor belum punya titik lokasi</Text>
        </View>
      ) : null}

      <View style={styles.attribution}>
        <Text style={styles.attributionText}>Tampilan peta awal · logo = lokasi vendor</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#EEF1E8' },
  waterTop: { position: 'absolute', width: '56%', height: '25%', right: '-13%', top: '-7%', borderRadius: 140, backgroundColor: '#D8EAF0', transform: [{ rotate: '-10deg' }] },
  parkOne: { position: 'absolute', width: 120, height: 170, left: -30, top: '22%', borderRadius: 42, backgroundColor: '#DDEBD5', transform: [{ rotate: '13deg' }] },
  parkTwo: { position: 'absolute', width: 170, height: 105, right: -48, bottom: '23%', borderRadius: 45, backgroundColor: '#D7E8D4', transform: [{ rotate: '-16deg' }] },
  road: { position: 'absolute', height: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E3DE', borderRadius: 10 },
  roadOne: { width: '130%', left: '-15%', top: '37%', transform: [{ rotate: '-15deg' }] },
  roadTwo: { width: '120%', left: '-10%', top: '57%', transform: [{ rotate: '20deg' }] },
  roadThree: { width: '108%', left: '-4%', top: '70%', transform: [{ rotate: '-5deg' }] },
  roadMinor: { position: 'absolute', height: 7, backgroundColor: '#F8F8F5', borderRadius: 8 },
  roadMinorOne: { width: '90%', left: '4%', top: '27%', transform: [{ rotate: '26deg' }] },
  roadMinorTwo: { width: '92%', left: '3%', top: '48%', transform: [{ rotate: '-28deg' }] },
  roadMinorThree: { width: '88%', left: '6%', top: '80%', transform: [{ rotate: '13deg' }] },
  mapLabel: { position: 'absolute', left: 14, top: 14, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(213,217,210,0.9)', paddingHorizontal: 10, paddingVertical: 7 },
  mapLabelDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.brandDark },
  mapLabelText: { color: '#4E5A4E', fontSize: 10, fontWeight: '800' },
  centerState: { position: 'absolute', left: 30, right: 30, top: '39%', alignItems: 'center', gap: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#E0E4DC', padding: 18 },
  centerStateText: { color: palette.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  emptyPin: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft },
  emptyPinText: { color: palette.brandDark, fontSize: 20, fontWeight: '900' },
  emptyTitle: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  pinWrap: { position: 'absolute', width: 58, height: 76, marginLeft: -29, marginTop: -38, alignItems: 'center', zIndex: 4 },
  pin: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#FFFFFF', boxShadow: '0 5px 12px rgba(23, 32, 42, 0.18)' },
  pinSelected: { borderColor: palette.brand, transform: [{ scale: 1.08 }] },
  logo: { width: '100%', height: '100%' },
  pinInitials: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  pinTail: { width: 12, height: 12, marginTop: -6, backgroundColor: '#FFFFFF', transform: [{ rotate: '45deg' }], borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#D9DDD7' },
  pinTailSelected: { backgroundColor: palette.brand },
  pinNameBubble: { position: 'absolute', top: 61, minWidth: 95, maxWidth: 145, borderRadius: 10, backgroundColor: palette.ink, paddingHorizontal: 9, paddingVertical: 6, boxShadow: '0 4px 10px rgba(23, 32, 42, 0.16)' },
  pinName: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  missingBadge: { position: 'absolute', left: 14, bottom: 39, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 9, paddingVertical: 6 },
  missingBadgeText: { color: palette.muted, fontSize: 8, fontWeight: '700' },
  attribution: { position: 'absolute', right: 12, bottom: 11, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.82)', paddingHorizontal: 7, paddingVertical: 5 },
  attributionText: { color: '#7A8279', fontSize: 7, fontWeight: '700' },
  pressed: { opacity: 0.76 },
});
