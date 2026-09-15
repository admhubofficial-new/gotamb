import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav, BrandMark, SectionHeader, StatusChip, palette } from '@/components/gotamb-ui';
import { supabase } from '../../lib/supabase';

type Role = 'vendor' | 'customer' | 'driver';

type FeatureInfo = {
  title: string;
  subtitle: string;
  eyebrow: string;
};

const featureInfo: Record<string, FeatureInfo> = {
  catalog: { eyebrow: 'Vendor', title: 'Katalog material', subtitle: 'Kelola material yang tampil di marketplace goTamb.' },
  orders: { eyebrow: 'Aktivitas', title: 'Pesanan', subtitle: 'Pantau pesanan baru, diproses, dikirim, dan selesai.' },
  'order-detail': { eyebrow: 'Detail pesanan', title: '#GT-260915-018', subtitle: 'Pasir Beton · 8 m³ · CV Bangun Jaya' },
  delivery: { eyebrow: 'Logistik', title: 'Pengiriman', subtitle: 'Pantau armada dan status pengantaran material.' },
  wallet: { eyebrow: 'Keuangan', title: 'Dompet goTamb', subtitle: 'Saldo, pemasukan, biaya layanan, dan pencairan dana.' },
  profile: { eyebrow: 'Akun', title: 'Profil & pengaturan', subtitle: 'Kelola identitas, kontak, alamat, dan keamanan akun.' },
  notifications: { eyebrow: 'Pusat informasi', title: 'Notifikasi', subtitle: 'Informasi penting tentang pesanan dan akun.' },
  market: { eyebrow: 'Marketplace', title: 'Cari material', subtitle: 'Bandingkan material, harga, lokasi, dan vendor.' },
  favorites: { eyebrow: 'Customer', title: 'Favorit', subtitle: 'Simpan material dan vendor untuk ditemukan lebih cepat.' },
  jobs: { eyebrow: 'Driver', title: 'Order tersedia', subtitle: 'Pilih pengiriman yang sesuai dengan armada dan lokasi.' },
  trips: { eyebrow: 'Driver', title: 'Perjalanan', subtitle: 'Pantau pekerjaan aktif dan riwayat pengiriman.' },
};

const vendorOrders = [
  ['#GT-260915-018', 'Pasir Beton · 8 m³', 'CV Bangun Jaya', 'Rp 1.520.000', 'Perlu diproses'],
  ['#GT-260915-014', 'Batu Split 1–2 · 12 ton', 'Proyek Cipta Karya', 'Rp 3.840.000', 'Dikirim'],
  ['#GT-260914-031', 'Tanah Urug · 2 truk', 'UD Karya Mandiri', 'Rp 1.800.000', 'Selesai'],
];

const marketItems = [
  ['Pasir Beton Premium', 'Mitra Pasir Jaya', '7,2 km', 'Rp 190.000 / m³'],
  ['Batu Split 1–2', 'CV Batu Makmur', '12,4 km', 'Rp 320.000 / ton'],
  ['Tanah Urug Pilihan', 'Tambang Sejahtera', '9,8 km', 'Rp 850.000 / truk'],
  ['Sirtu Padat', 'Sumber Alam Material', '15,1 km', 'Rp 210.000 / m³'],
];

const driverJobs = [
  ['Pasir Beton · 8 m³', 'Darmaraja → Sumedang Kota', '18 km', 'Rp 280.000'],
  ['Batu Split · 10 ton', 'Cimalaka → Tanjungsari', '27 km', 'Rp 390.000'],
  ['Tanah Urug · 1 truk', 'Wado → Jatinangor', '42 km', 'Rp 520.000'],
];

function getRole(value?: string): Role {
  if (value === 'customer' || value === 'driver') return value;
  return 'vendor';
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string; section?: string; preview?: string }>();
  const role = getRole(params.role);
  const section = typeof params.section === 'string' ? params.section : role === 'driver' ? 'jobs' : role === 'customer' ? 'market' : 'orders';
  const preview = params.preview === '1';
  const info = featureInfo[section] ?? featureInfo.orders;

  function goHome() {
    if (role === 'customer') router.replace('/customer-home');
    else if (role === 'driver') router.replace('/driver-home');
    else router.replace(preview ? '/vendor-home?preview=1' : '/vendor-home');
  }

  function open(sectionName: string) {
    router.push(`/explore?role=${role}&section=${sectionName}${preview ? '&preview=1' : ''}`);
  }

  async function signOut() {
    if (!preview) await supabase.auth.signOut();
    router.replace('/login');
  }

  const activeKey = section === 'orders' ? 'orders' : section === 'wallet' ? 'wallet' : section === 'profile' ? 'profile' : role === 'driver' && section === 'trips' ? 'trips' : role === 'customer' && section === 'favorites' ? 'favorites' : 'home';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 14, 26), paddingBottom: 30 }]}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backSymbol}>‹</Text>
          </Pressable>
          <BrandMark compact />
          <View style={styles.topSpacer} />
        </View>

        {preview ? (
          <View style={styles.previewBanner}>
            <Text style={styles.previewLabel}>PREVIEW UI</Text>
            <Text selectable style={styles.previewCopy}>Konten contoh untuk mencoba alur aplikasi sebelum seluruh data produksi dihubungkan.</Text>
          </View>
        ) : null}

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>{info.eyebrow}</Text>
          <Text selectable style={styles.title}>{info.title}</Text>
          <Text selectable style={styles.subtitle}>{info.subtitle}</Text>
        </View>

        {section === 'catalog' ? (
          <View style={styles.section}>
            <View style={styles.catalogHero}>
              <View style={styles.heroCopy}>
                <Text selectable style={styles.heroTitle}>12 item aktif</Text>
                <Text selectable style={styles.heroSubtitle}>2 item stoknya mulai menipis.</Text>
              </View>
              {!preview ? (
                <Pressable onPress={() => router.push('/vendor-items')} style={styles.heroButton}>
                  <Text style={styles.heroButtonText}>Kelola item</Text>
                </Pressable>
              ) : null}
            </View>
            <SectionHeader title="Material populer" />
            {marketItems.slice(0, 3).map((item, index) => (
              <View key={item[0]} style={styles.listCard}>
                <View style={[styles.listMark, index === 0 ? styles.markBrand : index === 1 ? styles.markBlue : styles.markGreen]}>
                  <Text style={styles.listMarkText}>{item[0].slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.listCopy}>
                  <Text selectable style={styles.listTitle}>{item[0]}</Text>
                  <Text selectable style={styles.listMeta}>{index === 0 ? 'Stok 80 m³' : index === 1 ? 'Stok 42 ton' : 'Stok 11 truk'}</Text>
                </View>
                <Text selectable style={styles.listValue}>{item[3]}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {section === 'orders' ? (
          <View style={styles.section}>
            <View style={styles.filterRow}>
              {['Semua', 'Baru', 'Diproses', 'Dikirim'].map((filter, index) => (
                <View key={filter} style={[styles.filterChip, index === 0 && styles.filterChipActive]}>
                  <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{filter}</Text>
                </View>
              ))}
            </View>
            {vendorOrders.map((item, index) => (
              <Pressable key={item[0]} onPress={() => open('order-detail')} style={({ pressed }) => [styles.orderCard, pressed && styles.pressed]}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text selectable style={styles.orderId}>{item[0]}</Text>
                    <Text selectable style={styles.orderItem}>{item[1]}</Text>
                  </View>
                  <StatusChip label={item[4]} tone={index === 0 ? 'brand' : index === 1 ? 'green' : 'neutral'} />
                </View>
                <Text selectable style={styles.orderCustomer}>{item[2]}</Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.detailLink}>Lihat detail →</Text>
                  <Text selectable style={styles.orderTotal}>{item[3]}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {section === 'order-detail' ? (
          <View style={styles.section}>
            <View style={styles.detailCard}>
              <View style={styles.detailLine}><Text style={styles.detailLabel}>Status</Text><StatusChip label="Perlu diproses" tone="brand" /></View>
              <View style={styles.divider} />
              <View style={styles.detailLine}><Text style={styles.detailLabel}>Pembeli</Text><Text selectable style={styles.detailValue}>CV Bangun Jaya</Text></View>
              <View style={styles.detailLine}><Text style={styles.detailLabel}>Material</Text><Text selectable style={styles.detailValue}>Pasir Beton · 8 m³</Text></View>
              <View style={styles.detailLine}><Text style={styles.detailLabel}>Alamat</Text><Text selectable style={[styles.detailValue, styles.detailLong]}>Sumedang Kota, Jawa Barat</Text></View>
              <View style={styles.detailLine}><Text style={styles.detailLabel}>Total</Text><Text selectable style={styles.detailTotal}>Rp 1.520.000</Text></View>
            </View>
            <View style={styles.timelineCard}>
              <SectionHeader title="Alur pesanan" />
              {['Pesanan dibuat', 'Vendor mengonfirmasi', 'Driver ditugaskan', 'Material dikirim', 'Pesanan selesai'].map((step, index) => (
                <View key={step} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />
                  <View style={styles.timelineCopy}>
                    <Text style={styles.timelineTitle}>{step}</Text>
                    <Text style={styles.timelineMeta}>{index === 0 ? '15 Sep · 15:42' : 'Menunggu tahap sebelumnya'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {section === 'delivery' || section === 'trips' ? (
          <View style={styles.section}>
            <View style={styles.mapMock}>
              <View style={styles.routeLine} />
              <View style={[styles.routePin, styles.pinStart]}><Text style={styles.pinText}>A</Text></View>
              <View style={[styles.routePin, styles.pinEnd]}><Text style={styles.pinText}>B</Text></View>
              <View style={styles.truckBadge}><Text style={styles.truckBadgeText}>TRUK · 18 KM</Text></View>
            </View>
            <View style={styles.detailCard}>
              <View style={styles.detailLine}><Text style={styles.detailLabel}>Rute</Text><Text selectable style={styles.detailValue}>Darmaraja → Sumedang Kota</Text></View>
              <View style={styles.detailLine}><Text style={styles.detailLabel}>Driver</Text><Text selectable style={styles.detailValue}>Asep R. · D 8123 AB</Text></View>
              <View style={styles.detailLine}><Text style={styles.detailLabel}>Muatan</Text><Text selectable style={styles.detailValue}>Pasir Beton · 8 m³</Text></View>
              <View style={styles.detailLine}><Text style={styles.detailLabel}>Status</Text><StatusChip label="Menuju lokasi" tone="green" /></View>
            </View>
          </View>
        ) : null}

        {section === 'wallet' ? (
          <View style={styles.section}>
            <View style={styles.walletCard}>
              <Text style={styles.walletLabel}>Saldo tersedia</Text>
              <Text selectable style={styles.walletAmount}>Rp 8.450.000</Text>
              <Text style={styles.walletMeta}>Terakhir diperbarui hari ini, 15:48</Text>
              <Pressable style={styles.walletButton}><Text style={styles.walletButtonText}>Tarik saldo</Text></Pressable>
            </View>
            <SectionHeader title="Transaksi terakhir" />
            {[
              ['Pembayaran #GT-260914-031', '+ Rp 1.800.000', 'Masuk'],
              ['Biaya layanan #GT-260914-031', '- Rp 45.000', 'Biaya'],
              ['Pencairan ke rekening', '- Rp 3.000.000', 'Berhasil'],
            ].map((item, index) => (
              <View key={item[0]} style={styles.transactionRow}>
                <View style={styles.transactionIcon}><Text style={styles.transactionIconText}>{index === 0 ? '+' : '−'}</Text></View>
                <View style={styles.listCopy}><Text selectable style={styles.listTitle}>{item[0]}</Text><Text style={styles.listMeta}>{item[2]} · 14 Sep 2026</Text></View>
                <Text selectable style={[styles.transactionValue, index === 0 && { color: palette.green }]}>{item[1]}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {section === 'market' || section === 'favorites' ? (
          <View style={styles.section}>
            <View style={styles.searchMock}><Text style={styles.searchIcon}>⌕</Text><Text style={styles.searchText}>Cari pasir, batu split, tanah urug...</Text></View>
            <View style={styles.filterRow}>
              {['Pasir', 'Batu', 'Tanah', 'Sirtu'].map((filter, index) => (
                <View key={filter} style={[styles.filterChip, index === 0 && styles.filterChipActive]}><Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{filter}</Text></View>
              ))}
            </View>
            {marketItems.slice(0, section === 'favorites' ? 2 : 4).map((item, index) => (
              <View key={item[0]} style={styles.productCard}>
                <View style={[styles.productImage, index % 2 === 0 ? styles.markBrand : styles.markBlue]}><Text style={styles.productImageText}>{item[0].slice(0, 2).toUpperCase()}</Text></View>
                <View style={styles.productCopy}>
                  <Text selectable style={styles.productTitle}>{item[0]}</Text>
                  <Text selectable style={styles.productVendor}>{item[1]} · {item[2]}</Text>
                  <Text selectable style={styles.productPrice}>{item[3]}</Text>
                </View>
                <Text style={styles.favoriteSymbol}>{section === 'favorites' ? '♥' : '♡'}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {section === 'jobs' ? (
          <View style={styles.section}>
            <View style={styles.driverStatus}>
              <View><Text style={styles.driverStatusLabel}>Status Anda</Text><Text style={styles.driverStatusValue}>Siap menerima order</Text></View>
              <View style={styles.onlinePill}><View style={styles.onlineDot} /><Text style={styles.onlineText}>ONLINE</Text></View>
            </View>
            {driverJobs.map((item) => (
              <View key={item[0]} style={styles.jobCard}>
                <View style={styles.jobTop}><Text selectable style={styles.jobTitle}>{item[0]}</Text><Text selectable style={styles.jobPay}>{item[3]}</Text></View>
                <Text selectable style={styles.jobRoute}>{item[1]}</Text>
                <View style={styles.jobFooter}><StatusChip label={item[2]} tone="blue" /><Pressable onPress={() => open('trips')}><Text style={styles.detailLink}>Lihat order →</Text></Pressable></View>
              </View>
            ))}
          </View>
        ) : null}

        {section === 'notifications' ? (
          <View style={styles.section}>
            {[
              ['Pesanan baru masuk', 'CV Bangun Jaya memesan Pasir Beton 8 m³.', '2 menit lalu'],
              ['Driver sudah ditugaskan', 'Asep R. akan mengambil Batu Split untuk order #014.', '18 menit lalu'],
              ['Pencairan berhasil', 'Rp 3.000.000 sudah dikirim ke rekening terdaftar.', 'Kemarin'],
            ].map((item, index) => (
              <View key={item[0]} style={styles.notificationCard}>
                <View style={[styles.notificationDot, index > 1 && styles.notificationDotRead]} />
                <View style={styles.listCopy}><Text selectable style={styles.listTitle}>{item[0]}</Text><Text selectable style={styles.notificationBody}>{item[1]}</Text><Text style={styles.listMeta}>{item[2]}</Text></View>
              </View>
            ))}
          </View>
        ) : null}

        {section === 'profile' ? (
          <View style={styles.section}>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{role === 'vendor' ? 'VT' : role === 'driver' ? 'DR' : 'CU'}</Text></View>
              <View style={styles.profileCopy}>
                <Text selectable style={styles.profileName}>{role === 'vendor' ? 'Vendor Tambang Demo' : role === 'driver' ? 'Driver goTamb' : 'Customer goTamb'}</Text>
                <Text selectable style={styles.profileMeta}>{role === 'vendor' ? 'Partner terverifikasi · Sumedang' : role === 'driver' ? 'Mitra driver · Armada dump truck' : 'Akun customer aktif'}</Text>
              </View>
              <StatusChip label="Terverifikasi" tone="green" />
            </View>
            {['Data akun', 'Alamat & lokasi', 'Rekening pencairan', 'Keamanan akun', 'Bantuan & dukungan'].map((item) => (
              <Pressable key={item} style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}>
                <Text style={styles.settingText}>{item}</Text><Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" onPress={signOut} style={styles.logoutButton}><Text style={styles.logoutText}>{preview ? 'Keluar dari mode demo' : 'Keluar akun'}</Text></Pressable>
          </View>
        ) : null}
      </ScrollView>

      <BottomNav
        activeKey={activeKey}
        items={role === 'vendor' ? [
          { key: 'home', symbol: '⌂', label: 'Beranda', onPress: goHome },
          { key: 'orders', symbol: '≡', label: 'Pesanan', onPress: () => open('orders') },
          { key: 'wallet', symbol: '◈', label: 'Dompet', onPress: () => open('wallet') },
          { key: 'profile', symbol: '○', label: 'Akun', onPress: () => open('profile') },
        ] : role === 'driver' ? [
          { key: 'home', symbol: '⌂', label: 'Beranda', onPress: goHome },
          { key: 'trips', symbol: '↗', label: 'Perjalanan', onPress: () => open('trips') },
          { key: 'wallet', symbol: '◈', label: 'Dompet', onPress: () => open('wallet') },
          { key: 'profile', symbol: '○', label: 'Akun', onPress: () => open('profile') },
        ] : [
          { key: 'home', symbol: '⌂', label: 'Beranda', onPress: goHome },
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  backSymbol: { color: palette.ink, fontSize: 29, lineHeight: 31, fontWeight: '500' },
  topSpacer: { width: 38 },
  previewBanner: { borderRadius: 14, backgroundColor: palette.brandSoft, borderWidth: 1, borderColor: '#F6DA9D', padding: 12, gap: 4 },
  previewLabel: { color: palette.brandDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  previewCopy: { color: '#77500D', fontSize: 11, lineHeight: 17 },
  heading: { gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 11, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { color: palette.ink, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  section: { gap: 12 },
  catalogHero: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.ink, borderRadius: 20, padding: 18, borderCurve: 'continuous' },
  heroCopy: { flex: 1, gap: 3 },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  heroSubtitle: { color: '#C6CDD6', fontSize: 11 },
  heroButton: { borderRadius: 12, backgroundColor: palette.brand, paddingHorizontal: 13, paddingVertical: 10 },
  heroButtonText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, borderRadius: 17, padding: 13, borderCurve: 'continuous' },
  listMark: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  markBrand: { backgroundColor: palette.brand },
  markBlue: { backgroundColor: '#BED2FF' },
  markGreen: { backgroundColor: '#BFEBD8' },
  listMarkText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  listCopy: { flex: 1, gap: 3 },
  listTitle: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  listMeta: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  listValue: { maxWidth: 100, color: palette.ink, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { borderRadius: 999, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', paddingHorizontal: 13, paddingVertical: 8 },
  filterChipActive: { borderColor: palette.ink, backgroundColor: palette.ink },
  filterText: { color: palette.muted, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: '#FFFFFF' },
  orderCard: { gap: 11, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 15, borderCurve: 'continuous' },
  orderHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  orderId: { color: palette.muted, fontSize: 10, fontWeight: '700' },
  orderItem: { color: palette.ink, fontSize: 14, fontWeight: '900', marginTop: 3 },
  orderCustomer: { color: palette.muted, fontSize: 11 },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: '#EEF0F3', paddingTop: 10 },
  detailLink: { color: palette.brandDark, fontSize: 11, fontWeight: '900' },
  orderTotal: { color: palette.ink, fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] },
  detailCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: palette.line, padding: 16, gap: 13, borderCurve: 'continuous' },
  detailLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  detailLabel: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  detailValue: { flex: 1, color: palette.ink, fontSize: 12, fontWeight: '800', textAlign: 'right' },
  detailLong: { lineHeight: 18 },
  detailTotal: { color: palette.green, fontSize: 15, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#EEF0F3' },
  timelineCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: palette.line, padding: 16, gap: 15, borderCurve: 'continuous' },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  timelineDot: { width: 11, height: 11, marginTop: 4, borderRadius: 6, borderWidth: 2, borderColor: '#C9CFD7', backgroundColor: '#FFFFFF' },
  timelineDotActive: { borderColor: palette.brandDark, backgroundColor: palette.brand },
  timelineCopy: { flex: 1, gap: 2 },
  timelineTitle: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  timelineMeta: { color: palette.muted, fontSize: 10 },
  mapMock: { height: 190, borderRadius: 22, backgroundColor: '#E8ECE7', overflow: 'hidden', position: 'relative', borderCurve: 'continuous' },
  routeLine: { position: 'absolute', left: '24%', top: '50%', width: '52%', height: 4, borderRadius: 2, backgroundColor: palette.brandDark, transform: [{ rotate: '-18deg' }] },
  routePin: { position: 'absolute', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.ink, borderWidth: 4, borderColor: '#FFFFFF' },
  pinStart: { left: '18%', bottom: 38 },
  pinEnd: { right: '17%', top: 34 },
  pinText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  truckBadge: { position: 'absolute', left: '36%', top: '42%', borderRadius: 999, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: palette.line },
  truckBadgeText: { color: palette.ink, fontSize: 9, fontWeight: '900' },
  walletCard: { backgroundColor: palette.ink, borderRadius: 22, padding: 20, gap: 7, borderCurve: 'continuous' },
  walletLabel: { color: '#BFC7D1', fontSize: 11, fontWeight: '700' },
  walletAmount: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  walletMeta: { color: '#9EA9B6', fontSize: 10 },
  walletButton: { alignSelf: 'flex-start', marginTop: 7, borderRadius: 12, backgroundColor: palette.brand, paddingHorizontal: 14, paddingVertical: 10 },
  walletButtonText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 13, borderWidth: 1, borderColor: palette.line },
  transactionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F3F5' },
  transactionIconText: { color: palette.ink, fontSize: 17, fontWeight: '900' },
  transactionValue: { color: palette.ink, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  searchMock: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, paddingHorizontal: 14 },
  searchIcon: { color: palette.ink, fontSize: 20, fontWeight: '800' },
  searchText: { color: '#9099A5', fontSize: 12 },
  productCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 12, borderCurve: 'continuous' },
  productImage: { width: 68, height: 68, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  productImageText: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  productCopy: { flex: 1, gap: 3 },
  productTitle: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  productVendor: { color: palette.muted, fontSize: 10 },
  productPrice: { color: palette.green, fontSize: 11, fontWeight: '900', marginTop: 3 },
  favoriteSymbol: { color: palette.red, fontSize: 20 },
  driverStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 15 },
  driverStatusLabel: { color: palette.muted, fontSize: 10 },
  driverStatusValue: { color: palette.ink, fontSize: 14, fontWeight: '900', marginTop: 2 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: palette.greenSoft, paddingHorizontal: 10, paddingVertical: 7 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.green },
  onlineText: { color: palette.green, fontSize: 9, fontWeight: '900' },
  jobCard: { gap: 10, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 15 },
  jobTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  jobTitle: { flex: 1, color: palette.ink, fontSize: 14, fontWeight: '900' },
  jobPay: { color: palette.green, fontSize: 13, fontWeight: '900' },
  jobRoute: { color: palette.muted, fontSize: 11 },
  jobFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notificationCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: palette.line, padding: 14 },
  notificationDot: { width: 9, height: 9, marginTop: 5, borderRadius: 5, backgroundColor: palette.brand },
  notificationDotRead: { backgroundColor: '#C8CED6' },
  notificationBody: { color: palette.muted, fontSize: 11, lineHeight: 17 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: palette.ink, borderRadius: 20, padding: 16 },
  profileAvatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  profileAvatarText: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  profileCopy: { flex: 1, gap: 3 },
  profileName: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  profileMeta: { color: '#BFC7D1', fontSize: 10 },
  settingRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', paddingHorizontal: 15 },
  settingText: { color: palette.ink, fontSize: 12, fontWeight: '800' },
  chevron: { color: '#9AA2AE', fontSize: 25 },
  logoutButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.redSoft, borderWidth: 1, borderColor: '#FFD4D4' },
  logoutText: { color: palette.red, fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.76 },
});
