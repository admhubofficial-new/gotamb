import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark, StatusChip, palette } from '@/components/gotamb-ui';

type Material = {
  id: string;
  name: string;
  vendor: string;
  distance: string;
  price: number;
  unit: string;
  stock: string;
  symbol: string;
};

type Vehicle = {
  id: string;
  name: string;
  capacity: string;
  description: string;
  price: number;
  recommended?: boolean;
};

const materials: Material[] = [
  { id: 'pasir-beton', name: 'Pasir Beton Premium', vendor: 'Mitra Pasir Jaya', distance: '7,2 km', price: 190000, unit: 'm³', stock: '80 m³', symbol: 'PS' },
  { id: 'batu-split', name: 'Batu Split 1–2', vendor: 'CV Batu Makmur', distance: '12,4 km', price: 320000, unit: 'ton', stock: '42 ton', symbol: 'BS' },
  { id: 'tanah-urug', name: 'Tanah Urug Pilihan', vendor: 'Tambang Sejahtera', distance: '9,8 km', price: 850000, unit: 'truk', stock: '11 truk', symbol: 'TU' },
  { id: 'sirtu', name: 'Sirtu Padat', vendor: 'Sumber Alam Material', distance: '15,1 km', price: 210000, unit: 'm³', stock: '65 m³', symbol: 'ST' },
];

const vehicles: Vehicle[] = [
  { id: 'engkel', name: 'Dump Truck Engkel', capacity: '± 6 m³', description: 'Cocok untuk akses jalan kecil dan pesanan ringan.', price: 220000 },
  { id: 'double', name: 'Dump Truck Double', capacity: '± 8 m³', description: 'Pilihan seimbang untuk proyek rumah dan bangunan.', price: 280000, recommended: true },
  { id: 'tronton', name: 'Tronton / 20 Ton', capacity: '± 20 ton', description: 'Untuk volume besar dan akses proyek yang memadai.', price: 520000 },
];

function rupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
}

export default function CustomerOrder() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ material?: string }>();
  const initialMaterial = materials.find((item) => item.id === params.material) ?? materials[0];

  const [step, setStep] = useState(1);
  const [materialId, setMaterialId] = useState(initialMaterial.id);
  const [quantity, setQuantity] = useState(initialMaterial.unit === 'truk' ? '1' : '8');
  const [projectName, setProjectName] = useState('Proyek Rumah Sumedang');
  const [receiverName, setReceiverName] = useState('Budi Santoso');
  const [phone, setPhone] = useState('081234567890');
  const [address, setAddress] = useState('Jl. Prabu Gajah Agung, Sumedang Utara, Kabupaten Sumedang');
  const [notes, setNotes] = useState('Hubungi penerima 15 menit sebelum tiba.');
  const [vehicleId, setVehicleId] = useState('double');
  const [createdOrder, setCreatedOrder] = useState('');

  const material = materials.find((item) => item.id === materialId) ?? materials[0];
  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? vehicles[1];
  const parsedQuantity = Math.max(Number(quantity.replace(',', '.')) || 0, 0);
  const materialSubtotal = material.price * parsedQuantity;
  const serviceFee = Math.round(materialSubtotal * 0.015);
  const total = materialSubtotal + vehicle.price + serviceFee;

  const canContinue = useMemo(() => {
    if (step === 1) return parsedQuantity > 0;
    if (step === 2) return Boolean(projectName.trim() && receiverName.trim() && phone.trim() && address.trim());
    if (step === 3) return Boolean(vehicleId);
    return true;
  }, [address, phone, projectName, receiverName, parsedQuantity, step, vehicleId]);

  function chooseMaterial(id: string) {
    const next = materials.find((item) => item.id === id);
    if (!next) return;
    setMaterialId(id);
    setQuantity(next.unit === 'truk' ? '1' : next.unit === 'ton' ? '10' : '8');
  }

  function nextStep() {
    if (!canContinue) return;
    setStep((current) => Math.min(current + 1, 4));
  }

  function previousStep() {
    if (step === 1) {
      router.back();
      return;
    }
    setStep((current) => Math.max(current - 1, 1));
  }

  function createOrder() {
    const code = `GT-${String(Date.now()).slice(-6)}`;
    setCreatedOrder(code);
  }

  if (createdOrder) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.successScreen,
          { paddingTop: Math.max(insets.top + 28, 42), paddingBottom: Math.max(insets.bottom + 28, 40) },
        ]}>
        <BrandMark />
        <View style={styles.successCard}>
          <View style={styles.successIcon}><Text style={styles.successIconText}>✓</Text></View>
          <StatusChip label="PESANAN DIBUAT" tone="green" />
          <Text selectable style={styles.successTitle}>Pesanan siap diproses.</Text>
          <Text selectable style={styles.successBody}>Alur checkout berhasil diselesaikan. Nomor pesanan prototipe Anda:</Text>
          <Text selectable style={styles.orderCode}>{createdOrder}</Text>

          <View style={styles.successSummary}>
            <SummaryRow label="Material" value={`${material.name} · ${quantity} ${material.unit}`} />
            <SummaryRow label="Vendor" value={material.vendor} />
            <SummaryRow label="Armada" value={vehicle.name} />
            <SummaryRow label="Total" value={rupiah(total)} strong />
          </View>

          <View style={styles.prototypeNotice}>
            <Text style={styles.prototypeTitle}>Mode prototipe UI</Text>
            <Text selectable style={styles.prototypeText}>Nomor ini belum disimpan ke Supabase karena struktur tabel orders belum tersedia di repo. Tidak ada data produksi yang diubah.</Text>
          </View>

          <Pressable onPress={() => router.replace('/explore?role=customer&section=orders')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Lihat pesanan</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/customer-home')} style={styles.secondaryFullButton}>
            <Text style={styles.secondaryFullButtonText}>Kembali ke beranda</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top + 14, 26), paddingBottom: 116 },
        ]}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={previousStep} style={styles.backButton}>
            <Text style={styles.backSymbol}>‹</Text>
          </Pressable>
          <BrandMark compact />
          <Pressable accessibilityRole="button" onPress={() => router.replace('/customer-home')} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Tutup</Text>
          </Pressable>
        </View>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>BUAT PESANAN</Text>
          <Text selectable style={styles.title}>{step === 1 ? 'Pilih material' : step === 2 ? 'Alamat pengiriman' : step === 3 ? 'Pilih armada' : 'Ringkasan pesanan'}</Text>
          <Text selectable style={styles.subtitle}>{step === 1 ? 'Tentukan material dan jumlah kebutuhan proyek.' : step === 2 ? 'Pastikan titik dan penerima material sudah benar.' : step === 3 ? 'Pilih kendaraan sesuai volume dan akses lokasi.' : 'Periksa kembali semua detail sebelum membuat pesanan.'}</Text>
        </View>

        <Progress step={step} />

        {step === 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Material tersedia</Text>
            <View style={styles.materialList}>
              {materials.map((item, index) => {
                const selected = item.id === materialId;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => chooseMaterial(item.id)}
                    style={({ pressed }) => [styles.materialCard, selected && styles.materialCardSelected, pressed && styles.pressed]}>
                    <View style={[styles.materialMark, index === 0 ? styles.markBrand : index === 1 ? styles.markBlue : index === 2 ? styles.markGreen : styles.markPurple]}>
                      <Text style={styles.materialMarkText}>{item.symbol}</Text>
                    </View>
                    <View style={styles.materialCopy}>
                      <Text selectable style={styles.materialName}>{item.name}</Text>
                      <Text selectable style={styles.materialMeta}>{item.vendor} · {item.distance}</Text>
                      <View style={styles.materialBottom}>
                        <Text selectable style={styles.materialPrice}>{rupiah(item.price)} / {item.unit}</Text>
                        <Text style={styles.stockText}>Stok {item.stock}</Text>
                      </View>
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]} />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.quantityCard}>
              <View style={styles.quantityCopy}>
                <Text style={styles.fieldTitle}>Jumlah kebutuhan</Text>
                <Text selectable style={styles.fieldHelper}>Masukkan jumlah dalam satuan {material.unit}.</Text>
              </View>
              <View style={styles.quantityInputWrap}>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={styles.quantityUnit}>{material.unit}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.formCard}>
            <Field label="Nama proyek" value={projectName} onChangeText={setProjectName} placeholder="Contoh: Proyek Rumah Sumedang" />
            <View style={styles.twoColumns}>
              <View style={styles.column}><Field label="Nama penerima" value={receiverName} onChangeText={setReceiverName} placeholder="Nama penerima" /></View>
              <View style={styles.column}><Field label="Nomor HP" value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" /></View>
            </View>
            <Field label="Alamat lengkap" value={address} onChangeText={setAddress} placeholder="Jalan, desa/kecamatan, kabupaten" multiline />
            <Field label="Catatan untuk driver" value={notes} onChangeText={setNotes} placeholder="Petunjuk akses, patokan lokasi, dll." multiline optional />
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapPin}><Text style={styles.mapPinText}>⌖</Text></View>
              <View style={styles.mapCopy}>
                <Text style={styles.mapTitle}>Titik proyek</Text>
                <Text selectable style={styles.mapText}>Sumedang Utara · titik peta akan dihubungkan pada tahap lokasi/GPS.</Text>
              </View>
              <Text style={styles.mapAction}>Atur</Text>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.section}>
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerSymbol}>i</Text>
              <Text selectable style={styles.infoBannerText}>Estimasi armada menyesuaikan kapasitas muatan. Pastikan akses jalan lokasi proyek cukup untuk kendaraan yang dipilih.</Text>
            </View>
            <View style={styles.vehicleList}>
              {vehicles.map((item) => {
                const selected = item.id === vehicleId;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setVehicleId(item.id)}
                    style={({ pressed }) => [styles.vehicleCard, selected && styles.vehicleCardSelected, pressed && styles.pressed]}>
                    <View style={styles.vehicleIcon}><Text style={styles.vehicleIconText}>TR</Text></View>
                    <View style={styles.vehicleCopy}>
                      <View style={styles.vehicleTitleRow}>
                        <Text selectable style={styles.vehicleName}>{item.name}</Text>
                        {item.recommended ? <StatusChip label="Rekomendasi" tone="brand" /> : null}
                      </View>
                      <Text selectable style={styles.vehicleCapacity}>{item.capacity}</Text>
                      <Text selectable style={styles.vehicleDescription}>{item.description}</Text>
                      <Text selectable style={styles.vehiclePrice}>{rupiah(item.price)} estimasi ongkir</Text>
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.section}>
            <View style={styles.summaryCard}>
              <Text style={styles.summarySectionTitle}>Material</Text>
              <View style={styles.selectedMaterialRow}>
                <View style={styles.selectedMaterialMark}><Text style={styles.selectedMaterialMarkText}>{material.symbol}</Text></View>
                <View style={styles.selectedMaterialCopy}>
                  <Text selectable style={styles.materialName}>{material.name}</Text>
                  <Text selectable style={styles.materialMeta}>{material.vendor} · {quantity} {material.unit}</Text>
                </View>
                <Pressable onPress={() => setStep(1)}><Text style={styles.editLink}>Ubah</Text></Pressable>
              </View>
              <View style={styles.divider} />
              <Text style={styles.summarySectionTitle}>Pengiriman</Text>
              <SummaryRow label="Proyek" value={projectName} />
              <SummaryRow label="Penerima" value={`${receiverName} · ${phone}`} />
              <SummaryRow label="Alamat" value={address} />
              <SummaryRow label="Armada" value={`${vehicle.name} · ${vehicle.capacity}`} />
              <Pressable onPress={() => setStep(2)}><Text style={styles.editLink}>Ubah alamat / armada</Text></Pressable>
            </View>

            <View style={styles.paymentCard}>
              <Text style={styles.summarySectionTitle}>Rincian pembayaran</Text>
              <SummaryRow label={`Material (${quantity} ${material.unit})`} value={rupiah(materialSubtotal)} />
              <SummaryRow label="Estimasi pengiriman" value={rupiah(vehicle.price)} />
              <SummaryRow label="Biaya layanan" value={rupiah(serviceFee)} />
              <View style={styles.divider} />
              <SummaryRow label="Total estimasi" value={rupiah(total)} strong />
              <Text selectable style={styles.paymentNote}>Harga final dapat menyesuaikan validasi lokasi, kapasitas aktual, dan konfirmasi vendor.</Text>
            </View>

            <View style={styles.prototypeNotice}>
              <Text style={styles.prototypeTitle}>Prototipe pemesanan</Text>
              <Text selectable style={styles.prototypeText}>Tombol buat pesanan akan menampilkan status sukses untuk pengujian UI. Belum ada penulisan ke database orders.</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {step > 1 ? (
          <Pressable onPress={previousStep} style={styles.footerBackButton}>
            <Text style={styles.footerBackText}>Kembali</Text>
          </Pressable>
        ) : null}
        <Pressable
          disabled={!canContinue}
          onPress={step === 4 ? createOrder : nextStep}
          style={({ pressed }) => [styles.footerPrimary, pressed && styles.pressed, !canContinue && styles.disabled]}>
          <Text style={styles.footerPrimaryText}>{step === 4 ? 'Buat pesanan' : 'Lanjutkan'}</Text>
          <Text style={styles.footerArrow}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Progress({ step }: { step: number }) {
  const labels = ['Material', 'Alamat', 'Armada', 'Ringkasan'];
  return (
    <View style={styles.progressWrap}>
      {labels.map((label, index) => {
        const number = index + 1;
        const active = number === step;
        const done = number < step;
        return (
          <View key={label} style={styles.progressItem}>
            <View style={[styles.progressDot, (active || done) && styles.progressDotActive]}>
              <Text style={[styles.progressNumber, (active || done) && styles.progressNumberActive]}>{done ? '✓' : number}</Text>
            </View>
            <Text style={[styles.progressLabel, active && styles.progressLabelActive]}>{label}</Text>
            {number < labels.length ? <View style={[styles.progressLine, done && styles.progressLineDone]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  optional = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  optional?: boolean;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldTitle}>{label}{optional ? ' (opsional)' : ''}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA2AE"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text selectable style={[styles.summaryLabel, strong && styles.summaryLabelStrong]}>{label}</Text>
      <Text selectable style={[styles.summaryValue, strong && styles.summaryValueStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { paddingHorizontal: 18, gap: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  backButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  backSymbol: { color: palette.ink, fontSize: 29, lineHeight: 31 },
  closeButton: { minHeight: 38, justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', paddingHorizontal: 12 },
  closeButtonText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  heading: { gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: palette.ink, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  progressWrap: { flexDirection: 'row', alignItems: 'flex-start' },
  progressItem: { flex: 1, alignItems: 'center', position: 'relative', gap: 6 },
  progressDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9ECF0', zIndex: 2 },
  progressDotActive: { backgroundColor: palette.brand },
  progressNumber: { color: '#8A94A2', fontSize: 9, fontWeight: '900' },
  progressNumberActive: { color: palette.ink },
  progressLabel: { color: '#8A94A2', fontSize: 8, fontWeight: '700' },
  progressLabelActive: { color: palette.ink, fontWeight: '900' },
  progressLine: { position: 'absolute', top: 13, left: '64%', width: '72%', height: 2, backgroundColor: '#E1E5EA' },
  progressLineDone: { backgroundColor: palette.brand },
  section: { gap: 12 },
  sectionLabel: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  materialList: { gap: 9 },
  materialCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 19, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', padding: 12, borderCurve: 'continuous' },
  materialCardSelected: { borderColor: '#E9B850', backgroundColor: '#FFFCF5' },
  materialMark: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  markBrand: { backgroundColor: '#F7CD77' },
  markBlue: { backgroundColor: '#C9D8FB' },
  markGreen: { backgroundColor: '#C6E7D9' },
  markPurple: { backgroundColor: '#DACBFA' },
  materialMarkText: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  materialCopy: { flex: 1, gap: 3 },
  materialName: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  materialMeta: { color: palette.muted, fontSize: 9 },
  materialBottom: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 5, marginTop: 3 },
  materialPrice: { color: palette.green, fontSize: 10, fontWeight: '900' },
  stockText: { color: palette.muted, fontSize: 8, fontWeight: '700' },
  radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: '#C7CDD4', backgroundColor: '#FFFFFF' },
  radioSelected: { borderWidth: 5, borderColor: palette.brandDark },
  quantityCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 19, backgroundColor: palette.brandSoft, borderWidth: 1, borderColor: '#F5D798', padding: 14 },
  quantityCopy: { flex: 1, gap: 3 },
  fieldTitle: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  fieldHelper: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  quantityInputWrap: { minWidth: 104, height: 46, flexDirection: 'row', alignItems: 'center', borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5CB92', paddingHorizontal: 10 },
  quantityInput: { flex: 1, minWidth: 42, color: palette.ink, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  quantityUnit: { color: palette.muted, fontSize: 10, fontWeight: '800' },
  formCard: { gap: 14, borderRadius: 23, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 17, borderCurve: 'continuous' },
  fieldGroup: { gap: 7 },
  twoColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  column: { flex: 1, minWidth: 145 },
  input: { minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: '#DCE1E7', backgroundColor: '#FAFBFC', color: palette.ink, paddingHorizontal: 13, fontSize: 13, borderCurve: 'continuous' },
  multilineInput: { minHeight: 82, paddingTop: 13, paddingBottom: 13 },
  mapPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: palette.blueSoft, padding: 12 },
  mapPin: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  mapPinText: { color: palette.blue, fontSize: 19, fontWeight: '900' },
  mapCopy: { flex: 1, gap: 2 },
  mapTitle: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  mapText: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  mapAction: { color: palette.blue, fontSize: 10, fontWeight: '900' },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, backgroundColor: palette.blueSoft, padding: 13 },
  infoBannerSymbol: { width: 22, height: 22, borderRadius: 11, color: '#FFFFFF', backgroundColor: palette.blue, textAlign: 'center', lineHeight: 22, fontSize: 11, fontWeight: '900' },
  infoBannerText: { flex: 1, color: '#365274', fontSize: 10, lineHeight: 16 },
  vehicleList: { gap: 10 },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 13 },
  vehicleCardSelected: { borderColor: '#E9B850', backgroundColor: '#FFFCF5' },
  vehicleIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDEFF2' },
  vehicleIconText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  vehicleCopy: { flex: 1, gap: 3 },
  vehicleTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  vehicleName: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  vehicleCapacity: { color: palette.brandDark, fontSize: 9, fontWeight: '900' },
  vehicleDescription: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  vehiclePrice: { color: palette.green, fontSize: 10, fontWeight: '900', marginTop: 2 },
  summaryCard: { gap: 11, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 16 },
  paymentCard: { gap: 10, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 16 },
  summarySectionTitle: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  selectedMaterialRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedMaterialMark: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7CD77' },
  selectedMaterialMarkText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  selectedMaterialCopy: { flex: 1, gap: 3 },
  editLink: { color: palette.brandDark, fontSize: 10, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#ECEEF1' },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  summaryLabel: { flex: 1, color: palette.muted, fontSize: 10, lineHeight: 15 },
  summaryValue: { maxWidth: '58%', color: palette.ink, fontSize: 10, lineHeight: 15, fontWeight: '800', textAlign: 'right' },
  summaryLabelStrong: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  summaryValueStrong: { color: palette.green, fontSize: 14, fontWeight: '900' },
  paymentNote: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  prototypeNotice: { gap: 4, borderRadius: 16, backgroundColor: palette.brandSoft, borderWidth: 1, borderColor: '#F3D18A', padding: 12 },
  prototypeTitle: { color: '#77500D', fontSize: 10, fontWeight: '900' },
  prototypeText: { color: '#8B671F', fontSize: 9, lineHeight: 15 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: '#FFFFFF', paddingTop: 10, paddingHorizontal: 14 },
  footerBackButton: { minHeight: 49, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF', paddingHorizontal: 18 },
  footerBackText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  footerPrimary: { flex: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 15, backgroundColor: palette.brand },
  footerPrimaryText: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  footerArrow: { color: palette.ink, fontSize: 17, fontWeight: '900' },
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.45 },
  successScreen: { flexGrow: 1, gap: 22, backgroundColor: palette.background, paddingHorizontal: 20 },
  successCard: { width: '100%', maxWidth: 540, alignSelf: 'center', alignItems: 'center', gap: 13, borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 22, borderCurve: 'continuous' },
  successIcon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.greenSoft },
  successIconText: { color: palette.green, fontSize: 34, fontWeight: '900' },
  successTitle: { color: palette.ink, fontSize: 23, fontWeight: '900', textAlign: 'center' },
  successBody: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  orderCode: { color: palette.brandDark, fontSize: 22, fontWeight: '900', letterSpacing: 1.5 },
  successSummary: { width: '100%', gap: 9, borderRadius: 17, backgroundColor: '#F8F9FA', padding: 13 },
  primaryButton: { width: '100%', minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.brand },
  primaryButtonText: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  secondaryFullButton: { width: '100%', minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FFFFFF' },
  secondaryFullButtonText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
});
