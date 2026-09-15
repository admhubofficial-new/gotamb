import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav, BrandMark, MetricCard, SectionHeader, StatusChip, palette } from '@/components/gotamb-ui';

const jobs = [
  ['Pasir Beton · 8 m³', 'Darmaraja → Sumedang Kota', '18 km', 'Rp 280.000'],
  ['Batu Split · 10 ton', 'Cimalaka → Tanjungsari', '27 km', 'Rp 390.000'],
  ['Tanah Urug · 1 truk', 'Wado → Jatinangor', '42 km', 'Rp 520.000'],
] as const;

export default function DriverHome() {
  const insets = useSafeAreaInsets();

  function open(section: string) {
    router.push(`/explore?role=driver&section=${section}`);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 16, 28), paddingBottom: 28 }]}>
        <View style={styles.topBar}>
          <BrandMark compact />
          <Pressable onPress={() => open('notifications')} style={styles.notificationButton}>
            <Text style={styles.notificationSymbol}>•</Text>
            <Text style={styles.notificationText}>Notifikasi</Text>
          </Pressable>
        </View>

        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text selectable style={styles.eyebrow}>Dashboard driver</Text>
            <Text selectable style={styles.title}>Siap narik hari ini?</Text>
            <Text selectable style={styles.subtitle}>Ambil order sesuai armada, lokasi, dan kapasitas muatan Anda.</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>DR</Text></View>
        </View>

        <View style={styles.onlineCard}>
          <View style={styles.onlineLeft}>
            <View style={styles.onlineDot} />
            <View>
              <Text style={styles.onlineLabel}>Status driver</Text>
              <Text selectable style={styles.onlineValue}>Online · siap menerima order</Text>
            </View>
          </View>
          <View style={styles.onlineBadge}><Text style={styles.onlineBadgeText}>AKTIF</Text></View>
        </View>

        <View style={styles.metricsRow}>
          <MetricCard label="Pendapatan hari ini" value="Rp 670 rb" note="2 perjalanan selesai" tone="green" />
          <MetricCard label="Rating" value="4,9" note="126 pengiriman" tone="brand" />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Pengiriman aktif" action="Lihat rute" onAction={() => open('trips')} />
          <Pressable onPress={() => open('trips')} style={({ pressed }) => [styles.activeTrip, pressed && styles.pressed]}>
            <View style={styles.tripHeader}>
              <View>
                <Text style={styles.tripOrder}>#GT-260915-014</Text>
                <Text selectable style={styles.tripTitle}>Batu Split 1–2 · 12 ton</Text>
              </View>
              <StatusChip label="Menuju lokasi" tone="green" />
            </View>
            <View style={styles.routeBlock}>
              <View style={styles.routeDots}>
                <View style={styles.routeDotStart} />
                <View style={styles.routeStem} />
                <View style={styles.routeDotEnd} />
              </View>
              <View style={styles.routeCopy}>
                <View><Text style={styles.routeLabel}>Ambil material</Text><Text selectable style={styles.routeValue}>CV Batu Makmur · Cimalaka</Text></View>
                <View><Text style={styles.routeLabel}>Kirim ke</Text><Text selectable style={styles.routeValue}>Proyek Cipta Karya · Tanjungsari</Text></View>
              </View>
            </View>
            <View style={styles.tripFooter}>
              <Text selectable style={styles.tripDistance}>27 km · estimasi 52 menit</Text>
              <Text selectable style={styles.tripPay}>Rp 390.000</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Order tersedia di sekitar" action="Lihat semua" onAction={() => open('jobs')} />
          <View style={styles.jobList}>
            {jobs.slice(0, 2).map((item, index) => (
              <Pressable key={item[0]} onPress={() => open('jobs')} style={({ pressed }) => [styles.jobCard, pressed && styles.pressed]}>
                <View style={[styles.jobMark, index === 0 ? styles.jobBrand : styles.jobBlue]}>
                  <Text style={styles.jobMarkText}>{index === 0 ? 'PS' : 'BS'}</Text>
                </View>
                <View style={styles.jobCopy}>
                  <Text selectable style={styles.jobTitle}>{item[0]}</Text>
                  <Text selectable style={styles.jobRoute}>{item[1]}</Text>
                  <View style={styles.jobMeta}><StatusChip label={item[2]} tone="blue" /><Text selectable style={styles.jobPay}>{item[3]}</Text></View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.safetyCard}>
          <View style={styles.safetyIcon}><Text style={styles.safetyIconText}>✓</Text></View>
          <View style={styles.safetyCopy}>
            <Text selectable style={styles.safetyTitle}>Pastikan muatan dan dokumen sesuai</Text>
            <Text selectable style={styles.safetyBody}>Konfirmasi jenis material, kapasitas kendaraan, dan tujuan sebelum menerima order.</Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav
        activeKey="home"
        items={[
          { key: 'home', symbol: '⌂', label: 'Beranda', onPress: () => {} },
          { key: 'trips', symbol: '↗', label: 'Perjalanan', onPress: () => open('trips') },
          { key: 'wallet', symbol: '◈', label: 'Dompet', onPress: () => open('wallet') },
          { key: 'profile', symbol: '○', label: 'Akun', onPress: () => open('profile') },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { paddingHorizontal: 18, gap: 22 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  notificationButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, paddingHorizontal: 12 },
  notificationSymbol: { color: palette.brandDark, fontSize: 24, lineHeight: 20, fontWeight: '900' },
  notificationText: { color: palette.ink, fontSize: 11, fontWeight: '800' },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  greetingCopy: { flex: 1, gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 11, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { color: palette.ink, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.9 },
  subtitle: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  avatar: { width: 45, height: 45, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.ink },
  avatarText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  onlineCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 14 },
  onlineLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.green },
  onlineLabel: { color: palette.muted, fontSize: 10, fontWeight: '700' },
  onlineValue: { color: palette.ink, fontSize: 12, fontWeight: '900', marginTop: 2 },
  onlineBadge: { borderRadius: 999, backgroundColor: palette.greenSoft, paddingHorizontal: 10, paddingVertical: 7 },
  onlineBadgeText: { color: palette.green, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  section: { gap: 12 },
  activeTrip: { backgroundColor: palette.ink, borderRadius: 22, padding: 17, gap: 15, borderCurve: 'continuous' },
  tripHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  tripOrder: { color: '#AEB7C2', fontSize: 9, fontWeight: '700' },
  tripTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 3 },
  routeBlock: { flexDirection: 'row', gap: 12 },
  routeDots: { width: 16, alignItems: 'center', paddingVertical: 4 },
  routeDotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.brand },
  routeStem: { width: 2, flex: 1, minHeight: 38, backgroundColor: '#56616E' },
  routeDotEnd: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.green },
  routeCopy: { flex: 1, justifyContent: 'space-between', gap: 16 },
  routeLabel: { color: '#8F9AA7', fontSize: 9, fontWeight: '700' },
  routeValue: { color: '#E8ECF0', fontSize: 11, fontWeight: '800', marginTop: 2 },
  tripFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: '#34404C', paddingTop: 12 },
  tripDistance: { color: '#AEB7C2', fontSize: 10 },
  tripPay: { color: '#FBCB6B', fontSize: 13, fontWeight: '900' },
  jobList: { gap: 10 },
  jobCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 12, borderCurve: 'continuous' },
  jobMark: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  jobBrand: { backgroundColor: '#F6D17F' },
  jobBlue: { backgroundColor: '#BFD1FA' },
  jobMarkText: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  jobCopy: { flex: 1, gap: 4 },
  jobTitle: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  jobRoute: { color: palette.muted, fontSize: 10 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  jobPay: { color: palette.green, fontSize: 11, fontWeight: '900' },
  chevron: { color: '#9AA2AE', fontSize: 27 },
  safetyCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: palette.brandSoft, borderWidth: 1, borderColor: '#F5DAA0', borderRadius: 18, padding: 14 },
  safetyIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  safetyIconText: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  safetyCopy: { flex: 1, gap: 3 },
  safetyTitle: { color: '#6F4A0A', fontSize: 11, fontWeight: '900' },
  safetyBody: { color: '#7F6539', fontSize: 10, lineHeight: 16 },
  pressed: { opacity: 0.77 },
});
