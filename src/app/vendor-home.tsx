import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActionTile,
  BottomNav,
  BrandMark,
  MetricCard,
  ScreenHeader,
  SectionHeader,
  StatusChip,
  palette,
} from '@/components/gotamb-ui';

export default function VendorHome() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ preview?: string }>();
  const preview = params.preview === '1';

  function openFeature(section: string) {
    router.push(`/explore?role=vendor&section=${section}${preview ? '&preview=1' : ''}`);
  }

  function openCatalog() {
    if (preview) {
      openFeature('catalog');
      return;
    }
    router.push('/vendor-items');
  }

  function openFleets() {
    if (preview) {
      openFeature('fleets');
      return;
    }
    router.push('/vendor-fleets');
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 16, 28), paddingBottom: 28 }]}>
        <View style={styles.topBar}>
          <BrandMark compact />
          <Pressable onPress={() => openFeature('notifications')} style={styles.notificationButton}>
            <Text style={styles.notificationSymbol}>•</Text>
            <Text style={styles.notificationText}>Notifikasi</Text>
          </Pressable>
        </View>

        {preview ? (
          <View style={styles.previewBanner}>
            <View style={styles.previewDot} />
            <Text selectable style={styles.previewText}>Mode pratinjau aktif — data dashboard adalah contoh navigasi.</Text>
          </View>
        ) : null}

        <ScreenHeader
          eyebrow="Dashboard vendor"
          title="Halo, Partner Tambang"
          subtitle="Kelola material, armada, Driver, pesanan, dan pengiriman dari satu tempat."
          right={<View style={styles.avatar}><Text style={styles.avatarText}>VT</Text></View>}
        />

        <View style={styles.metricsRow}>
          <MetricCard label="Pesanan aktif" value="8" note="3 perlu diproses" tone="brand" />
          <MetricCard label="Penjualan bulan ini" value="Rp 24,8 jt" note="+12% dari bulan lalu" tone="green" />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard label="Item aktif" value="12" note="2 stok menipis" tone="blue" />
          <MetricCard label="Pengiriman" value="5" note="2 sedang di jalan" tone="purple" />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Menu cepat" />
          <View style={styles.actionList}>
            <ActionTile symbol="▦" label="Kelola item" description="Tambah, ubah, stok, harga dan lokasi material." onPress={openCatalog} tone="brand" />
            <ActionTile symbol="TR" label="Kelola armada" description="Tambah unit, atur tarif, dan pasangkan akun Driver." onPress={openFleets} tone="purple" />
            <ActionTile symbol="◎" label="Pesanan masuk" description="Periksa permintaan baru dan konfirmasi pesanan." onPress={() => openFeature('orders')} tone="blue" />
            <ActionTile symbol="↗" label="Pengiriman" description="Pantau armada dan proses pengantaran." onPress={() => openFeature('delivery')} tone="green" />
            <ActionTile symbol="Rp" label="Dompet & pencairan" description="Lihat saldo, transaksi dan riwayat pencairan." onPress={() => openFeature('wallet')} tone="purple" />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Pesanan terbaru" action="Lihat semua" onAction={() => openFeature('orders')} />
          <View style={styles.orderList}>
            <Pressable onPress={() => openFeature('order-detail')} style={({ pressed }) => [styles.orderCard, pressed && styles.pressed]}>
              <View style={styles.orderTopRow}>
                <View style={styles.orderIdentity}>
                  <View style={[styles.materialMark, { backgroundColor: palette.brandSoft }]}><Text style={[styles.materialSymbol, { color: palette.brandDark }]}>PS</Text></View>
                  <View style={styles.orderCopy}><Text selectable style={styles.orderName}>Pasir Beton</Text><Text selectable style={styles.orderMeta}>#GT-260915-018 · 8 m³</Text></View>
                </View>
                <StatusChip label="Perlu diproses" tone="brand" />
              </View>
              <View style={styles.orderBottomRow}><Text selectable style={styles.orderBuyer}>Customer · Sumedang</Text><Text selectable style={styles.orderPrice}>Rp 1.520.000</Text></View>
            </Pressable>
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}><Text style={styles.insightIconText}>!</Text></View>
          <View style={styles.insightCopy}><Text selectable style={styles.insightTitle}>Pastikan Driver sudah dipasangkan</Text><Text selectable style={styles.insightBody}>Order yang memilih armada akan otomatis diteruskan ke Driver yang terhubung pada unit tersebut.</Text></View>
          <Pressable onPress={openFleets}><Text style={styles.insightAction}>Atur</Text></Pressable>
        </View>
      </ScrollView>

      <BottomNav
        activeKey="home"
        items={[
          { key: 'home', symbol: '⌂', label: 'Beranda', onPress: () => {} },
          { key: 'orders', symbol: '≡', label: 'Pesanan', onPress: () => openFeature('orders') },
          { key: 'wallet', symbol: '◈', label: 'Dompet', onPress: () => openFeature('wallet') },
          { key: 'profile', symbol: '○', label: 'Akun', onPress: () => openFeature('profile') },
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
  previewBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 14, padding: 12, backgroundColor: palette.brandSoft, borderWidth: 1, borderColor: '#F9D789' },
  previewDot: { width: 8, height: 8, marginTop: 5, borderRadius: 4, backgroundColor: palette.brandDark },
  previewText: { flex: 1, color: '#77500D', fontSize: 11, lineHeight: 17, fontWeight: '600' },
  avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.ink },
  avatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  section: { gap: 12 },
  actionList: { gap: 10 },
  orderList: { gap: 10 },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 15, gap: 13 },
  orderTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  orderIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  materialMark: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  materialSymbol: { fontSize: 12, fontWeight: '900' },
  orderCopy: { flex: 1, gap: 3 },
  orderName: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  orderMeta: { color: palette.muted, fontSize: 11 },
  orderBottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: '#EEF0F3', paddingTop: 11 },
  orderBuyer: { flex: 1, color: palette.muted, fontSize: 11, lineHeight: 16 },
  orderPrice: { color: palette.ink, fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1F2933', borderRadius: 20, padding: 16 },
  insightIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  insightIconText: { color: palette.ink, fontSize: 17, fontWeight: '900' },
  insightCopy: { flex: 1, gap: 3 },
  insightTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  insightBody: { color: '#C6CDD6', fontSize: 11, lineHeight: 16 },
  insightAction: { color: '#FBCB6B', fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.78 },
});
