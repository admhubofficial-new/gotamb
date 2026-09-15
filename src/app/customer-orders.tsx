import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav, BrandMark, SectionHeader, StatusChip, palette } from '@/components/gotamb-ui';

const existingOrders = [
  { code: '#GT-260915-014', material: 'Batu Split 1–2 · 10 ton', vendor: 'CV Batu Makmur', total: 'Rp 3.480.000', status: 'Dalam perjalanan', tone: 'green' as const, meta: 'Estimasi tiba 17:20 · Driver Asep R.' },
  { code: '#GT-260914-031', material: 'Pasir Beton · 6 m³', vendor: 'Mitra Pasir Jaya', total: 'Rp 1.420.000', status: 'Selesai', tone: 'neutral' as const, meta: 'Selesai 14 Sep · 14:35' },
];

export default function CustomerOrders() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ created?: string }>();
  const created = typeof params.created === 'string' ? params.created : '';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 14, 26), paddingBottom: 30 }]}>
        <View style={styles.topBar}>
          <BrandMark compact />
          <Pressable onPress={() => router.push('/customer-order')} style={styles.newButton}>
            <Text style={styles.newButtonText}>＋ Pesan baru</Text>
          </Pressable>
        </View>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>AKTIVITAS CUSTOMER</Text>
          <Text selectable style={styles.title}>Pesanan saya</Text>
          <Text selectable style={styles.subtitle}>Pantau status material sejak dibuat sampai diterima di lokasi proyek.</Text>
        </View>

        {created ? (
          <View style={styles.createdBanner}>
            <View style={styles.createdIcon}><Text style={styles.createdIconText}>✓</Text></View>
            <View style={styles.createdCopy}>
              <Text selectable style={styles.createdTitle}>Pesanan {created} berhasil dibuat</Text>
              <Text selectable style={styles.createdText}>Ini masih data prototipe UI dan belum tersimpan ke Supabase.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.filterRow}>
          <View style={[styles.filterChip, styles.filterChipActive]}><Text style={styles.filterTextActive}>Aktif</Text></View>
          <View style={styles.filterChip}><Text style={styles.filterText}>Selesai</Text></View>
          <View style={styles.filterChip}><Text style={styles.filterText}>Dibatalkan</Text></View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Pesanan terbaru" />
          {created ? (
            <Pressable style={({ pressed }) => [styles.orderCard, pressed && styles.pressed]}>
              <View style={styles.orderTop}>
                <View style={styles.orderCodeWrap}>
                  <Text selectable style={styles.orderCode}>{created}</Text>
                  <Text selectable style={styles.orderMaterial}>Pesanan baru · menunggu konfirmasi vendor</Text>
                </View>
                <StatusChip label="Baru" tone="brand" />
              </View>
              <View style={styles.timelineStrip}>
                <View style={styles.timelineStepActive}><Text style={styles.timelineStepTextActive}>1</Text></View>
                <View style={styles.timelineLine} />
                <View style={styles.timelineStep}><Text style={styles.timelineStepText}>2</Text></View>
                <View style={styles.timelineLine} />
                <View style={styles.timelineStep}><Text style={styles.timelineStepText}>3</Text></View>
                <View style={styles.timelineLine} />
                <View style={styles.timelineStep}><Text style={styles.timelineStepText}>4</Text></View>
              </View>
              <Text selectable style={styles.orderMeta}>Pesanan dibuat → konfirmasi vendor → pengiriman → selesai</Text>
            </Pressable>
          ) : null}

          {existingOrders.map((order) => (
            <Pressable key={order.code} style={({ pressed }) => [styles.orderCard, pressed && styles.pressed]}>
              <View style={styles.orderTop}>
                <View style={styles.orderCodeWrap}>
                  <Text selectable style={styles.orderCode}>{order.code}</Text>
                  <Text selectable style={styles.orderMaterial}>{order.material}</Text>
                </View>
                <StatusChip label={order.status} tone={order.tone} />
              </View>
              <Text selectable style={styles.vendorText}>{order.vendor}</Text>
              <View style={styles.orderBottom}>
                <Text selectable style={styles.orderMeta}>{order.meta}</Text>
                <Text selectable style={styles.orderTotal}>{order.total}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.helpCard}>
          <View style={styles.helpIcon}><Text style={styles.helpIconText}>?</Text></View>
          <View style={styles.helpCopy}>
            <Text selectable style={styles.helpTitle}>Butuh bantuan pesanan?</Text>
            <Text selectable style={styles.helpText}>Nanti CS, komplain, bukti pengiriman, dan chat vendor dapat ditempatkan dari layar ini.</Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav
        activeKey="orders"
        items={[
          { key: 'home', symbol: '⌂', label: 'Beranda', onPress: () => router.replace('/customer-home') },
          { key: 'orders', symbol: '≡', label: 'Pesanan', onPress: () => {} },
          { key: 'favorites', symbol: '♡', label: 'Favorit', onPress: () => router.push('/explore?role=customer&section=favorites') },
          { key: 'profile', symbol: '○', label: 'Akun', onPress: () => router.push('/explore?role=customer&section=profile') },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { paddingHorizontal: 18, gap: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  newButton: { minHeight: 39, justifyContent: 'center', borderRadius: 14, backgroundColor: palette.brand, paddingHorizontal: 12 },
  newButtonText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  heading: { gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: palette.ink, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  createdBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 17, backgroundColor: palette.greenSoft, borderWidth: 1, borderColor: '#C7E8D9', padding: 13 },
  createdIcon: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  createdIconText: { color: palette.green, fontSize: 18, fontWeight: '900' },
  createdCopy: { flex: 1, gap: 2 },
  createdTitle: { color: '#125E46', fontSize: 11, fontWeight: '900' },
  createdText: { color: '#467565', fontSize: 9, lineHeight: 14 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { minHeight: 34, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', paddingHorizontal: 13 },
  filterChipActive: { borderColor: '#E9BA55', backgroundColor: palette.brandSoft },
  filterText: { color: palette.muted, fontSize: 10, fontWeight: '800' },
  filterTextActive: { color: palette.brandDark, fontSize: 10, fontWeight: '900' },
  section: { gap: 10 },
  orderCard: { gap: 11, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 14, borderCurve: 'continuous' },
  orderTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 9 },
  orderCodeWrap: { flex: 1, gap: 3 },
  orderCode: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  orderMaterial: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  vendorText: { color: palette.ink, fontSize: 10, fontWeight: '800' },
  orderBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: '#EEF0F3', paddingTop: 10 },
  orderMeta: { flex: 1, color: palette.muted, fontSize: 9, lineHeight: 14 },
  orderTotal: { color: palette.green, fontSize: 11, fontWeight: '900' },
  timelineStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  timelineStep: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9ECF0' },
  timelineStepActive: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  timelineStepText: { color: '#8A94A2', fontSize: 8, fontWeight: '900' },
  timelineStepTextActive: { color: palette.ink, fontSize: 8, fontWeight: '900' },
  timelineLine: { flex: 1, height: 2, backgroundColor: '#E4E7EB' },
  helpCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 18, backgroundColor: '#1F2933', padding: 14 },
  helpIcon: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  helpIconText: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  helpCopy: { flex: 1, gap: 3 },
  helpTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  helpText: { color: '#C5CDD5', fontSize: 9, lineHeight: 14 },
  pressed: { opacity: 0.76 },
});
