import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type Region, type UserLocationChangeEvent } from 'react-native-maps';

import { palette } from '@/components/gotamb-ui';

export type TripCoordinate = { latitude: number; longitude: number };

const DEFAULT_REGION: Region = {
  latitude: -6.8586,
  longitude: 107.9164,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

export function DriverTripMap({
  vendorCoordinate,
  deliveryCoordinate,
  driverCoordinate,
  routeCoordinates = [],
  trackingEnabled,
  onDriverLocation,
}: {
  vendorCoordinate: TripCoordinate | null;
  deliveryCoordinate: TripCoordinate | null;
  driverCoordinate: TripCoordinate | null;
  routeCoordinates?: TripCoordinate[];
  trackingEnabled: boolean;
  onDriverLocation: (coordinate: TripCoordinate) => void;
}) {
  const mapRef = useRef<MapView | null>(null);
  const initialRegion = useMemo<Region>(() => {
    const center = driverCoordinate ?? vendorCoordinate ?? deliveryCoordinate;
    return center ? { ...center, latitudeDelta: 0.13, longitudeDelta: 0.13 } : DEFAULT_REGION;
  }, []);

  const visibleCoordinates = useMemo(
    () => [vendorCoordinate, deliveryCoordinate, driverCoordinate].filter((value): value is TripCoordinate => Boolean(value)),
    [deliveryCoordinate, driverCoordinate, vendorCoordinate],
  );

  useEffect(() => {
    if (visibleCoordinates.length < 2) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(visibleCoordinates, {
        animated: true,
        edgePadding: { top: 46, right: 42, bottom: 46, left: 42 },
      });
    }, 220);
    return () => clearTimeout(timer);
  }, [visibleCoordinates]);

  function handleUserLocation(event: UserLocationChangeEvent) {
    const coordinate = event.nativeEvent.coordinate;
    if (!coordinate) return;
    onDriverLocation({ latitude: coordinate.latitude, longitude: coordinate.longitude });
  }

  const line = routeCoordinates.length > 1
    ? routeCoordinates
    : vendorCoordinate && deliveryCoordinate
      ? [vendorCoordinate, deliveryCoordinate]
      : [];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Tracking perjalanan</Text><Text style={styles.helper}>Posisi Driver diperbarui saat GPS aktif.</Text></View>
        <View style={[styles.liveBadge, trackingEnabled ? styles.liveBadgeOn : styles.liveBadgeOff]}><Text style={styles.liveBadgeText}>{trackingEnabled ? 'GPS LIVE' : 'GPS OFF'}</Text></View>
      </View>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation={trackingEnabled}
          followsUserLocation={trackingEnabled}
          onUserLocationChange={handleUserLocation}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          showsPointsOfInterests={false}>
          {vendorCoordinate ? <Marker coordinate={vendorCoordinate} title="Vendor" pinColor="#223142" /> : null}
          {deliveryCoordinate ? <Marker coordinate={deliveryCoordinate} title="Proyek" pinColor="#D69B1F" /> : null}
          {driverCoordinate && !trackingEnabled ? <Marker coordinate={driverCoordinate} title="Posisi Driver terakhir" pinColor="#198754" /> : null}
          {line.length > 1 ? <Polyline coordinates={line} strokeWidth={4} strokeColor="#D69B1F" /> : null}
        </MapView>
      </View>
      <View style={styles.legend}><Text style={styles.legendText}>● Vendor</Text><Text style={styles.legendText}>● Proyek</Text><Text style={styles.legendText}>● Driver</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  helper: { color: palette.muted, fontSize: 9, marginTop: 2 },
  liveBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  liveBadgeOn: { backgroundColor: palette.greenSoft },
  liveBadgeOff: { backgroundColor: '#EDF0F3' },
  liveBadgeText: { color: palette.ink, fontSize: 8, fontWeight: '900' },
  mapWrap: { height: 245, overflow: 'hidden', borderRadius: 16, backgroundColor: '#E9EEE8' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendText: { color: palette.muted, fontSize: 8, fontWeight: '700' },
});
