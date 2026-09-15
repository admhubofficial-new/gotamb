import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav, BrandMark, SectionHeader, StatusChip, palette } from '@/components/gotamb-ui';

const categories = [
  ['PS', 'Pasir', palette.brandSoft, palette.brandDark],
  ['BS', 'Batu split', palette.blueSoft, palette.blue],
  ['TU', 'Tanah urug', palette.greenSoft, palette.green],
  ['ST', 'Sirtu', palette.purpleSoft, palette.purple],
] as const;

const products = [
  ['pasir-beton', 'Pasir Beton Premium', 'Mitra Pasir Jaya', '7,2 km', 'Rp 190.000 / m³', 'PS'],
  ['batu-split', 'Batu Split 1–2', 'CV Batu Makmur', '12,4 km', 'Rp 320.000 / ton', 'BS'],
  ['tanah-urug', 'Tanah Urug Pilihan', 'Tambang Sejahtera', '9,8 km', 'Rp 850.000 / truk', 'TU'],
] as const;

export default function CustomerHome() {
  const insets = useSafeAreaInsets();

  function open(section: string) {
    router.push(`/explore?role=customer&section=${section}`);
  }

  function startOrder(material?: string) {
    router.push(material ? `/customer-order?material=${material}` : '/customer-order');
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 16, 28), paddingBottom: 28 }]}>
        <View style={styles.topBar}>
          <BrandMark compact />
          <Pressable onPress={() => open('notifications')} style={styles.locationPill}>
            <Text style={styles.locationDot}>●</Text>
            <View><Text style={styles.locationLabel}>Lokasi kirim</Text><Text style={styles.locationValue}>Sumedang</Text></View>
          </Pressable>
        </View>

        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text selectable style={styles.eyebrow}>Selamat datang</Text>
            <Text selectable style={styles.title}>Cari material untuk proyekmu.</Text>
            <Text selectable style={styles.subtitle}>Bandingkan harga, vendor, lalu pesan sekaligus pilih armada pengiriman.</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>CU</Text></View>
        </View>

        <Pressable onPress={() => open('market')} style={({ pressed }) => [styles.searchBox, pressed && styles.pressed]}>
          <Text style={styles.searchIcon}>⌕</Text>
          <Text style={styles.searchPlaceholder}>Cari pasir, batu split, tanah urug...</Text>
          <View style={styles.filterButton}><Text style={styles.filterSymbol}>≡</Text></View>
        </Pressable>

        <View style={styles.section}>
          <SectionHeader title="Kategori material" />
          <View style={styles.categoryRow}>
            {categories.map(([symbol, label, backgroundColor, color]) => (
              <Pressable key={label} onPress={() => startOrder()} style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}>
                <View style={[styles.categoryIcon, { backgroundColor }]}><Text style={[styles.categorySymbol, { color }]}>{symbol}</Text></View>
                <Text style={styles.categoryLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.promoCard}>
          <View style={styles.promoCopy}>
            <StatusChip label="PENGIRIMAN TERINTEGRASI" tone="brand" />
            <Text selectable style={styles.promoTitle}>Material sampai lokasi tanpa cari armada sendiri.</Text>
            <Text selectable style={styles.promoBody}>Pilih material, isi alamat proyek, tentukan armada, lalu cek total dalam satu alur.</Text>
            <Pressable onPress={() => startOrder()} style={styles.promoButton}><Text style={styles.promoButtonText}>Mulai pesan</Text></Pressable>
          </View>
          <View style={styles.promoGraphic}>
            <View style={styles.promoRoad} />
            <View style={styles.promoTruck}><Text style={styles.promoTruckText}>GT</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Rekomendasi dekat Anda" action="Lihat semua" onAction={() => open('market')} />
          <View style={styles.productList}>
            {products.map((item, index) => (
              <Pressable key={item[0]} onPress={() => startOrder(item[0])} style={({ pressed }) => [styles.productCard, pressed && styles.pressed]}>
                <View style={[styles.productImage, index === 0 ? styles.imageBrand : index === 1 ? styles.imageBlue : styles.imageGreen]}>
                  <Text style={styles.productImageText}>{item[5]}</Text>
                </View>
                <View style={styles.productCopy}>
                  <Text selectable style={styles.productTitle}>{item[1]}</Text>
                  <Text selectable style={styles.vendorText}>{item[2]} · {item[3]}</Text>
                  <View style={styles.productMetaRow}>
                    <Text selectable style={styles.productPrice}>{item[4]}</Text>
                    <StatusChip label="Pesan" tone="brand" />
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={() => startOrder()} style={({ pressed }) => [styles.orderCta, pressed && styles.pressed]}>
          <View style={styles.orderCtaIcon}><Text style={styles.orderCtaIconText}>＋</Text></View>
          <View style={styles.orderCtaCopy}>
            <Text selectable style={styles.orderCtaTitle}>Buat pesanan baru</Text>
            <Text selectable style={styles.orderCtaBody}>Material → alamat → armada → ringkasan → buat order</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <View style={styles.orderSummary}>
          <View style={styles.orderSummaryIcon}><Text style={styles.orderSummarySymbol}>↗</Text></View>
          <View style={styles.orderSummaryCopy}>
            <Text selectable style={styles.orderSummaryTitle}>1 pesanan sedang dikirim</Text>
            <Text selectable style={styles.orderSummaryBody}>Batu Split 1–2 · estimasi tiba 17:20</Text>
          </View>
          <Pressable onPress={() => open('orders')}><Text style={styles.orderSummaryLink}>Lacak</Text></Pressable>
        </View>
      </ScrollView>

      <BottomNav
        activeKey="home"
        items={[
          { key: 'home', symbol: '⌂', label: 'Beranda', onPress: () => {} },
          { key: 'orders', symbol: '≡', label: 'Pesanan', onPress: () => open('orders') },
          { key: 'favorites', symbol: '♡', label: 'Favorit', onPress: () => open('favorites') },
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
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, paddingHorizontal: 11, paddingVertical: 8 },
  locationDot: { color: palette.brandDark, fontSize: 9 },
  locationLabel: { color: palette.muted, fontSize: 8, fontWeight: '700' },
  locationValue: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  greetingCopy: { flex: 1, gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 11, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { color: palette.ink, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.9 },
  subtitle: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  avatar: { width: 45, height: 45, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.ink },
  avatarText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  searchBox: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, paddingLeft: 15, paddingRight: 7, borderCurve: 'continuous', boxShadow: '0 6px 20px rgba(23, 32, 42, 0.04)' },
  searchIcon: { color: palette.ink, fontSize: 21, fontWeight: '900' },
  searchPlaceholder: { flex: 1, color: '#8A94A2', fontSize: 12 },
  filterButton: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  filterSymbol: { color: palette.ink, fontSize: 17, fontWeight: '900' },
  section: { gap: 12 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  categoryCard: { flex: 1, minWidth: 72, alignItems: 'center', gap: 7 },
  categoryIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  categorySymbol: { fontSize: 12, fontWeight: '900' },
  categoryLabel: { color: palette.ink, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  promoCard: { minHeight: 186, flexDirection: 'row', overflow: 'hidden', backgroundColor: palette.ink, borderRadius: 23, borderCurve: 'continuous' },
  promoCopy: { flex: 1.35, padding: 18, gap: 8 },
  promoTitle: { color: '#FFFFFF', fontSize: 18, lineHeight: 23, fontWeight: '900', letterSpacing: -0.4 },
  promoBody: { color: '#BFC7D1', fontSize: 10, lineHeight: 16 },
  promoButton: { alignSelf: 'flex-start', borderRadius: 12, backgroundColor: palette.brand, paddingHorizontal: 13, paddingVertical: 10, marginTop: 2 },
  promoButtonText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  promoGraphic: { flex: 0.65, position: 'relative', overflow: 'hidden', backgroundColor: '#2B3642' },
  promoRoad: { position: 'absolute', width: 180, height: 54, left: -34, bottom: 36, backgroundColor: '#495564', transform: [{ rotate: '-18deg' }] },
  promoTruck: { position: 'absolute', right: 20, top: 64, width: 54, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  promoTruckText: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  productList: { gap: 10 },
  productCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 11, borderCurve: 'continuous' },
  productImage: { width: 67, height: 67, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  imageBrand: { backgroundColor: '#F7CD77' },
  imageBlue: { backgroundColor: '#BFD1FA' },
  imageGreen: { backgroundColor: '#BFE5D5' },
  productImageText: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  productCopy: { flex: 1, gap: 4 },
  productTitle: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  vendorText: { color: palette.muted, fontSize: 10 },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7, marginTop: 2 },
  productPrice: { color: palette.green, fontSize: 11, fontWeight: '900' },
  chevron: { color: '#A0A8B3', fontSize: 25, fontWeight: '700' },
  orderCta: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 19, backgroundColor: palette.brandSoft, borderWidth: 1, borderColor: '#F3D18A', padding: 14 },
  orderCtaIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  orderCtaIconText: { color: palette.ink, fontSize: 20, fontWeight: '900' },
  orderCtaCopy: { flex: 1, gap: 3 },
  orderCtaTitle: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  orderCtaBody: { color: '#7A612E', fontSize: 9, lineHeight: 14 },
  orderSummary: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, borderRadius: 18, padding: 14 },
  orderSummaryIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.greenSoft },
  orderSummarySymbol: { color: palette.green, fontSize: 18, fontWeight: '900' },
  orderSummaryCopy: { flex: 1, gap: 3 },
  orderSummaryTitle: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  orderSummaryBody: { color: palette.muted, fontSize: 10 },
  orderSummaryLink: { color: palette.brandDark, fontSize: 11, fontWeight: '900' },
  pressed: { opacity: 0.77 },
});
