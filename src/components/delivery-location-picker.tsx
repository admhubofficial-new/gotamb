import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/components/gotamb-ui';

export type DeliveryCoordinate = { latitude: number; longitude: number };

export function DeliveryLocationPicker({
  vendorCoordinate,
  value,
  onChange,
  routeSource = null,
}: {
  vendorCoordinate: DeliveryCoordinate | null;
  value: DeliveryCoordinate | null;
  onChange: (coordinate: DeliveryCoordinate) => void;
  routeCoordinates?: DeliveryCoordinate[];
  routeSource?: 'google_routes' | 'fallback' | null;
}) {
  const fallback = value ?? vendorCoordinate ?? { latitude: -6.8586, longitude: 107.9164 };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Titik proyek</Text>
      <Text style={styles.helper}>Pemilih peta interaktif tersedia di Android/iOS. Pada tampilan ini gunakan titik awal sebagai simulasi.</Text>
      <Pressable onPress={() => onChange(fallback)} style={styles.button}>
        <Text style={styles.buttonText}>{value ? 'Titik proyek sudah dipilih' : 'Gunakan titik proyek simulasi'}</Text>
      </Pressable>
      {value ? (
        <Text selectable style={styles.coordinate}>{value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}</Text>
      ) : null}
      {routeSource ? (
        <View style={[styles.routeBadge, routeSource === 'google_routes' ? styles.googleBadge : styles.fallbackBadge]}>
          <Text style={styles.routeBadgeText}>{routeSource === 'google_routes' ? 'Google Routes' : 'Estimasi rute'}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E8EB', padding: 14 },
  title: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  helper: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  button: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: palette.brand },
  buttonText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  coordinate: { color: palette.muted, fontSize: 9, fontVariant: ['tabular-nums'] },
  routeBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  googleBadge: { backgroundColor: '#E8F7ED' },
  fallbackBadge: { backgroundColor: '#FFF3D8' },
  routeBadgeText: { color: palette.ink, fontSize: 8, fontWeight: '800' },
});
