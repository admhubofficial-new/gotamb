import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/components/gotamb-ui';

export type TrackingCoordinate = { latitude: number; longitude: number };

export function CustomerTripTrackingMap({ driverCoordinate, locationUpdatedAt }: {
  vendorCoordinate: TrackingCoordinate | null;
  deliveryCoordinate: TrackingCoordinate | null;
  driverCoordinate: TrackingCoordinate | null;
  routeCoordinates?: TrackingCoordinate[];
  locationUpdatedAt: string | null;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Lacak pengiriman</Text>
      <Text style={styles.helper}>Peta tracking tersedia di Android/iOS.</Text>
      <Text selectable style={styles.status}>{driverCoordinate ? 'Posisi armada tersedia.' : 'Menunggu GPS Driver aktif.'}</Text>
      {locationUpdatedAt ? <Text selectable style={styles.updated}>Pembaruan: {new Date(locationUpdatedAt).toLocaleString('id-ID')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 7, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 14 },
  title: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  helper: { color: palette.muted, fontSize: 9 },
  status: { color: palette.ink, fontSize: 10, fontWeight: '700' },
  updated: { color: palette.muted, fontSize: 8 },
});
