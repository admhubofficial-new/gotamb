import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import { palette } from '@/components/gotamb-ui';

export type TrackingCoordinate = { latitude: number; longitude: number };

const DEFAULT_REGION: Region = {
  latitude: -6.8586,
  longitude: 107.9164,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

export function CustomerTripTrackingMap({
  vendorCoordinate,
  deliveryCoordinate,
  driverCoordinate,
  routeCoordinates = [],
  locationUpdatedAt,
}: {
  vendorCoordinate: TrackingCoordinate | null;
  deliveryCoordinate: TrackingCoordinate | null;
  driverCoordinate: TrackingCoordinate | null;
  routeCoordinates?: TrackingCoordinate[];
  locationUpdatedAt: string | null;
}) {
  const mapRef = useRef<MapView | null>(null);
  const initialRegion = useMemo<Region>(() => {
    const center = driverCoordinate ?? deliveryCoordinate ?? vendorCoordinate;
    return center ? { ...center, latitudeDelta: 0.13, longitudeDelta: 0.13 } : DEFAULT_REGION;
  }, []);
  const visible = useMemo(
    () => [vendorCoordinate, deliveryCoordinate, driverCoordinate].filter((value): value is TrackingCoordinate => Boolean(value)),
    [deliveryCoordinate, driverCoordinate, vendorCoordinate],
  );

  useEffect(() => {
    if (visible.length < 2) return;
    const timer = setTimeout(() => mapRef.current?.fitToCoordinates(visible, { animated: true, edgePadding: { top: 42, right: 42, bottom: 42, left: 42 } }), 180);
    return () => clearTimeout(timer);
  }, [visible]);

  const line = routeCoordinates.length > 1 ? routeCoordinates : vendorCoordinate && deliveryCoordinate ? [vendorCoordinate, deliveryCoordinate] : [];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Lacak pengiriman</Text><Text style={styles.helper}>{driverCoordinate ? 'Posisi armada terakhir tersedia.' : 'Menunggu GPS Driver aktif.'}</Text></View>
        <View style={[styles.liveBadge, driverCoordinate ? styles.liveOn : styles.liveOff]}><Text style={styles.liveText}>{driverCoordinate ? 'LIVE' : 'WAIT'}</Text></View>
      </View>
      <View style={styles.mapWrap}>
        <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={initialRegion} rotateEnabled={false} pitchEnabled={false} toolbarEnabled={false} showsPointsOfInterests={false}>
          {vendorCoordinate ? <Marker coordinate={vendorCoordinate} title="Vendor" pinColor="#223142" /> : null}
          {deliveryCoordinate ? <Marker coordinate={deliveryCoordinate} title="Proyek" pinColor="#D69B1F" /> : null}
          {driverCoordinate ? <Marker coordinate={driverCoordinate} title="Armada" pinColor="#198754" /> : null}
          {line.length > 1 ? <Polyline coordinates={line} strokeWidth={4} strokeColor="#D69B1F" /> : null}
        </MapView>
      </View>
      <Text selectable style={styles.updatedText}>{locationUpdatedAt ? `Posisi diperbarui ${new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(locationUpdatedAt))}` : 'Belum ada pembaruan lokasi Driver.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  helper: { color: palette.muted, fontSize: 9, marginTop: 2 },
  liveBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  liveOn: { backgroundColor: palette.greenSoft },
  liveOff: { backgroundColor: '#EDF0F3' },
  liveText: { color: palette.ink, fontSize: 8, fontWeight: '900' },
  mapWrap: { height: 235, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E9EEE8' },
  updatedText: { color: palette.muted, fontSize: 8 },
});
