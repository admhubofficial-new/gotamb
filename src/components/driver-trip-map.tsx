import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/components/gotamb-ui';

export type TripCoordinate = { latitude: number; longitude: number };

export function DriverTripMap({ trackingEnabled }: {
  vendorCoordinate: TripCoordinate | null;
  deliveryCoordinate: TripCoordinate | null;
  driverCoordinate: TripCoordinate | null;
  routeCoordinates?: TripCoordinate[];
  trackingEnabled: boolean;
  onDriverLocation: (coordinate: TripCoordinate) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tracking perjalanan</Text>
      <Text style={styles.helper}>Peta GPS perjalanan aktif di aplikasi Android/iOS.</Text>
      <View style={styles.badge}><Text style={styles.badgeText}>{trackingEnabled ? 'GPS LIVE' : 'GPS OFF'}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 16 },
  title: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  helper: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#EDF0F3', paddingHorizontal: 9, paddingVertical: 6 },
  badgeText: { color: palette.ink, fontSize: 8, fontWeight: '900' },
});
