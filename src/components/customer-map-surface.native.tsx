import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

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

type LocatedVendor = {
  vendor: CustomerMapVendor;
  coordinate: Coordinate;
};

const SUMEDANG_REGION: Region = {
  latitude: -6.8586,
  longitude: 107.9164,
  latitudeDelta: 0.42,
  longitudeDelta: 0.42,
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

function getRegion(located: LocatedVendor[]): Region {
  if (!located.length) return SUMEDANG_REGION;
  if (located.length === 1) {
    return {
      ...located[0].coordinate,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  const lats = located.map((entry) => entry.coordinate.latitude);
  const lngs = located.map((entry) => entry.coordinate.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = Math.max((maxLat - minLat) * 1.55, 0.08);
  const lngDelta = Math.max((maxLng - minLng) * 1.55, 0.08);

  return {
    latitude: (maxLat + minLat) / 2,
    longitude: (maxLng + minLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
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
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const located = useMemo<LocatedVendor[]>(
    () => vendors
      .map((vendor) => ({ vendor, coordinate: getVendorCoordinate(vendor) }))
      .filter((entry): entry is LocatedVendor => Boolean(entry.coordinate)),
    [vendors],
  );

  const initialRegion = useMemo(() => getRegion(located), []);
  const missingLocationCount = vendors.length - located.length;

  useEffect(() => {
    if (!mapReady || !mapRef.current || !located.length) return;

    const coordinates = located.map((entry) => entry.coordinate);
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        animated: true,
        edgePadding: { top: 190, right: 64, bottom: 250, left: 64 },
      });
    }, 180);

    return () => clearTimeout(timer);
  }, [located, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedVendorId) return;
    const selected = located.find((entry) => entry.vendor.id === selectedVendorId);
    if (!selected) return;

    mapRef.current.animateToRegion(
      {
        ...selected.coordinate,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      },
      320,
    );
  }, [located, mapReady, selectedVendorId]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsCompass={false}
        showsBuildings
        showsPointsOfInterests={false}
        mapPadding={{ top: 150, right: 0, bottom: 180, left: 0 }}>
        {located.map(({ vendor, coordinate }) => {
          const selected = vendor.id === selectedVendorId;
          return (
            <Marker
              key={vendor.id}
              coordinate={coordinate}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => onSelectVendor(vendor.id)}
              tracksViewChanges>
              <View style={styles.markerWrap}>
                {selected ? (
                  <View style={styles.markerNameBubble}>
                    <Text numberOfLines={1} style={styles.markerName}>{vendor.nama_perusahaan}</Text>
                  </View>
                ) : null}
                <View style={[styles.marker, selected && styles.markerSelected]}>
                  {vendor.logo_url ? (
                    <Image source={{ uri: vendor.logo_url }} style={styles.logo} contentFit="cover" transition={100} />
                  ) : (
                    <View style={styles.fallbackLogo}>
                      <Text style={styles.markerInitials}>{initials(vendor.nama_perusahaan)}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.markerTail, selected && styles.markerTailSelected]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View pointerEvents="none" style={styles.mapBadge}>
        <View style={styles.mapBadgeDot} />
        <Text style={styles.mapBadgeText}>Vendor terverifikasi</Text>
      </View>

      {loading ? (
        <View pointerEvents="none" style={styles.loadingCard}>
          <ActivityIndicator color={palette.brandDark} />
          <Text style={styles.loadingText}>Memuat vendor...</Text>
        </View>
      ) : null}

      {!loading && !located.length ? (
        <View pointerEvents="none" style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>⌖</Text></View>
          <Text style={styles.emptyTitle}>Belum ada titik vendor</Text>
          <Text style={styles.emptyText}>Vendor akan muncul setelah lokasi perusahaan atau lokasi material tersedia.</Text>
        </View>
      ) : null}

      {missingLocationCount > 0 ? (
        <View pointerEvents="none" style={styles.missingBadge}>
          <Text style={styles.missingBadgeText}>{missingLocationCount} vendor belum punya titik lokasi</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9EEE8' },
  mapBadge: { position: 'absolute', left: 14, top: 14, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: 'rgba(220,224,219,0.96)', paddingHorizontal: 10, paddingVertical: 7 },
  mapBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.green },
  mapBadgeText: { color: '#4E5A4E', fontSize: 10, fontWeight: '800' },
  markerWrap: { alignItems: 'center' },
  marker: { width: 52, height: 52, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#FFFFFF', boxShadow: '0 5px 12px rgba(23, 32, 42, 0.2)' },
  markerSelected: { borderColor: palette.brand, transform: [{ scale: 1.08 }] },
  markerTail: { width: 13, height: 13, marginTop: -7, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#D5DAD4', transform: [{ rotate: '45deg' }] },
  markerTailSelected: { backgroundColor: palette.brand, borderColor: palette.brand },
  logo: { width: '100%', height: '100%' },
  fallbackLogo: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3D8' },
  markerInitials: { color: '#8B5A08', fontSize: 12, fontWeight: '900' },
  markerNameBubble: { maxWidth: 150, marginBottom: 7, borderRadius: 10, backgroundColor: palette.ink, paddingHorizontal: 9, paddingVertical: 6 },
  markerName: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  loadingCard: { position: 'absolute', left: 42, right: 42, top: '42%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.94)', padding: 16, borderWidth: 1, borderColor: '#E0E4DF' },
  loadingText: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  emptyCard: { position: 'absolute', left: 34, right: 34, top: '38%', alignItems: 'center', gap: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.95)', padding: 18, borderWidth: 1, borderColor: '#E0E4DF' },
  emptyIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft },
  emptyIconText: { color: palette.brandDark, fontSize: 20, fontWeight: '900' },
  emptyTitle: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  emptyText: { color: palette.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  missingBadge: { position: 'absolute', left: 14, bottom: 16, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 9, paddingVertical: 6 },
  missingBadgeText: { color: palette.muted, fontSize: 8, fontWeight: '700' },
});
