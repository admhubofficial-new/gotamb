import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type MapPressEvent, type Region } from 'react-native-maps';

import { palette } from '@/components/gotamb-ui';

export type DeliveryCoordinate = { latitude: number; longitude: number };

const DEFAULT_REGION: Region = {
  latitude: -6.8586,
  longitude: 107.9164,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

export function DeliveryLocationPicker({
  vendorCoordinate,
  value,
  onChange,
}: {
  vendorCoordinate: DeliveryCoordinate | null;
  value: DeliveryCoordinate | null;
  onChange: (coordinate: DeliveryCoordinate) => void;
}) {
  const initialRegion = useMemo<Region>(() => {
    const center = value ?? vendorCoordinate;
    if (!center) return DEFAULT_REGION;
    return {
      ...center,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }, [value, vendorCoordinate]);

  function handlePress(event: MapPressEvent) {
    onChange(event.nativeEvent.coordinate);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Titik proyek di peta</Text>
          <Text style={styles.helper}>Ketuk peta atau geser pin untuk menentukan lokasi bongkar material.</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>GPS</Text></View>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onPress={handlePress}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          showsCompass={false}
          showsPointsOfInterests={false}>
          {vendorCoordinate ? (
            <Marker coordinate={vendorCoordinate} title="Lokasi vendor" pinColor="#223142" />
          ) : null}
          {value ? (
            <Marker
              coordinate={value}
              draggable
              title="Titik proyek"
              onDragEnd={(event) => onChange(event.nativeEvent.coordinate)}
              pinColor="#D69B1F"
            />
          ) : null}
          {vendorCoordinate && value ? (
            <Polyline
              coordinates={[vendorCoordinate, value]}
              strokeWidth={3}
              lineDashPattern={[8, 6]}
              strokeColor="#D69B1F"
            />
          ) : null}
        </MapView>

        {!value ? (
          <View pointerEvents="none" style={styles.hint}>
            <Text style={styles.hintTitle}>Ketuk lokasi proyek</Text>
            <Text style={styles.hintText}>Pin kuning akan muncul di titik yang dipilih.</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, styles.vendorDot]} /><Text style={styles.legendText}>Vendor</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, styles.projectDot]} /><Text style={styles.legendText}>Proyek</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E8EB', padding: 12, borderCurve: 'continuous' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerCopy: { flex: 1, gap: 2 },
  title: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  helper: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  badge: { minWidth: 38, minHeight: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: palette.brandSoft },
  badgeText: { color: palette.brandDark, fontSize: 8, fontWeight: '900' },
  mapWrap: { height: 230, overflow: 'hidden', borderRadius: 16, backgroundColor: '#E9EEE8' },
  hint: { position: 'absolute', left: 24, right: 24, top: 82, alignItems: 'center', gap: 3, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.93)', borderWidth: 1, borderColor: '#E2E5E8', padding: 12 },
  hintTitle: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  hintText: { color: palette.muted, fontSize: 9, textAlign: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  vendorDot: { backgroundColor: '#223142' },
  projectDot: { backgroundColor: '#D69B1F' },
  legendText: { color: palette.muted, fontSize: 8, fontWeight: '700' },
});
