import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark, StatusChip, palette } from '@/components/gotamb-ui';
import { supabase } from '../../lib/supabase';

type Material = {
  id: string;
  vendorId: string;
  name: string;
  vendor: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  symbol: string;
};

type ItemRow = {
  id: string;
  vendor_id: string;
  kategori: string;
  nama_item: string;
  harga: number;
  satuan: string;
  stok: number;
};

type VendorRow = {
  id: string;
  nama_perusahaan: string;
};

type Vehicle = {
  id: string;
  name: string;
  capacity: string;
  description: string;
  price: number;
  recommended?: boolean;
};

const vehicles: Vehicle[] = [
  { id: 'engkel', name: 'Dump Truck Engkel', capacity: '± 6 m³', description: 'Cocok untuk akses jalan kecil dan pesanan ringan.', price: 220000 },
  { id: 'double', name: 'Dump Truck Double', capacity: '± 8 m³', description: 'Pilihan seimbang untuk proyek rumah dan bangunan.', price: 280000, recommended: true },
  { id: 'tronton', name: 'Tronton / 20 Ton', capacity: '± 20 ton', description: 'Untuk volume besar dan akses proyek yang memadai.', price: 520000 },
];

function rupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)}`;
}

function makeOrderCode() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `GT-${year}${month}${day}-${suffix}`;
}

export default function CustomerOrder() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ item?: string; vendor?: string }>();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState(1);
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [projectName, setProjectName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [vehicleId, setVehicleId] = useState('double');
  const [creating, setCreating] = useState(false);
  const [createdOrder, setCreatedOrder] = useState('');

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    let itemQuery = supabase
      .from('items')
      .select('id, vendor_id, kategori, nama_item, harga, satuan, stok')
      .gt('stok', 0)
      .order('created_at', { ascending: false });

    if (params.item) itemQuery = itemQuery.eq('id', params.item);
    else if (params.vendor) itemQuery = itemQuery.eq('vendor_id', params.vendor);

    const { data: itemData, error: itemError } = await itemQuery;
    if (itemError) {
      setLoading(false);
      setLoadError(itemError.message);
      return;
    }

    const itemRows = (itemData ?? []) as ItemRow[];
    if (!itemRows.length) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    const vendorIds = Array.from(new Set(itemRows.map((item) => item.vendor_id)));
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id, nama_perusahaan')
      .in('id', vendorIds);

    if (vendorError) {
      setLoading(false);
      setLoadError(vendorError.message);
      return;
    }

    const vendors = (vendorData ?? []) as VendorRow[];
    const vendorName = new Map(vendors.map((vendor) => [vendor.id, vendor.nama_perusahaan]));
    const nextMaterials = itemRows.map<Material>((item) => ({
      id: item.id,
      vendorId: item.vendor_id,
      name: item.nama_item,
      vendor: vendorName.get(item.vendor_id) ?? 'Vendor goTamb',
      category: item.kategori,
      price: Number(item.harga),
      unit: item.satuan,
      stock: Number(item.stok),
      symbol: item.kategori.slice(0, 2).toUpperCase(),
    }));

    setMaterials(nextMaterials);
    setMaterialId((current) => current || nextMaterials[0].id);
    setQuantity(nextMaterials[0].unit.toLowerCase().includes('truk') ? '1' : '1');
    setLoading(false);
  }, [params.item, params.vendor]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const material = materials.find((item) => item.id === materialId) ?? materials[0] ?? null;
  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? vehicles[1];
  const parsedQuantity = Math.max(Number(quantity.replace(',', '.')) || 0, 0);
  const materialSubtotal = material ? material.price * parsedQuantity : 0;
  const serviceFee = Math.round(materialSubtotal * 0.015);
  const total = materialSubtotal + vehicle.price + serviceFee;

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(material && parsedQuantity > 0 && parsedQuantity <= material.stock);
    if (step === 2) return Boolean(projectName.trim() && receiverName.trim() && phone.trim() && address.trim());
    if (step === 3) return Boolean(vehicleId);
    return true;
  }, [address, material, parsedQuantity, phone, projectName, receiverName, step, vehicleId]);

  function chooseMaterial(id: string) {
    const next = materials.find((item) => item.id === id);
    if (!next) return;
    setMaterialId(id);
    setQuantity('1');
  }

  function previousStep() {
    if (step === 1) {
      router.back();
      return;
    }
    setStep((current) => Math.max(current - 1, 1));
  }

  async function createOrder() {
    if (!material || creating) return;
    setCreating(true);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setCreating(false);
      Alert.alert('Sesi login diperlukan', 'Silakan login kembali sebagai Customer sebelum membuat pesanan.');
      return;
    }

    const code = makeOrderCode();
    const { error: insertError } = await supabase.from('orders').insert({
      customer_id: authData.user.id,
      item_id: material.id,
      volume: parsedQuantity,
      status: 'menunggu',
      kontrak_id: code,
      total_harga: total,
      project_name: projectName.trim(),
      receiver_name: receiverName.trim(),
      receiver_phone: phone.trim(),
      delivery_address: address.trim(),
      notes: notes.trim() || null,
      vehicle_type: vehicle.name,
      vehicle_capacity: vehicle.capacity,
      shipping_cost: vehicle.price,
      service_fee: serviceFee,
    });

    setCreating(false);
    if (insertError) {
      Alert.alert('Pesanan belum berhasil dibuat', insertError.message);
      return;
    }

    setCreatedOrder(code);
  }

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={palette.brandDark} />
        <Text style={styles.loadingText}>Memuat material dari marketplace...</Text>
      </View>
    );
  }

  if (loadError || !material) {
    return (
      <View style={styles.centerScreen}>
        <BrandMark compact />
        <Text style={styles.emptyTitle}>Material belum dapat dibuka</Text>
        <Text style={styles.emptyText}>{loadError || 'Tidak ada material aktif untuk pilihan ini.'}</Text>
        <Pressable onPress={loadMaterials} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Coba lagi</Text></Pressable>
        <Pressable onPress={() => router.replace('/customer-home')} style={styles.linkButton}><Text style={styles.linkButtonText}>Kembali ke peta</Text></Pressable>
      </View>
    );
  }

  if (createdOrder) {
    return (
      <ScrollView contentContainerStyle={[styles.successScreen, { paddingTop: Math.max(insets.top + 28, 42), paddingBottom: 40 }]}>
        <BrandMark />
        <View style={styles.successCard}>
          <View style={styles.successIcon}><Text style={styles.successIconText}>✓</Text></View>
          <StatusChip label="PESANAN DIBUAT" tone="green" />
          <Text style={styles.successTitle}>Pesanan masuk ke goTamb.</Text>
          <Text style={styles.successBody}>Vendor dapat melihat pesanan ini dari akun mitra. Nomor pesanan Anda:</Text>
          <Text style={styles.orderCode}>{createdOrder}</Text>
          <View style={styles.summaryCard}>
            <SummaryRow label="Material" value={`${material.name} · ${quantity} ${material.unit}`} />
            <SummaryRow label="Vendor" value={material.vendor} />
            <SummaryRow label="Armada" value={vehicle.name} />
            <SummaryRow label="Total" value={rupiah(total)} strong />
          </View>
          <Pressable onPress={() => router.replace(`/customer-orders?created=${createdOrder}`)} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Lihat pesanan</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/customer-home')} style={styles.secondaryFullButton}>
            <Text style={styles.secondaryFullButtonText}>Kembali ke peta</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const title = step === 1 ? 'Pilih material' : step === 2 ? 'Alamat pengiriman' : step === 3 ? 'Pilih armada' : 'Ringkasan pesanan';
  const subtitle = step === 1
    ? 'Material berasal langsung dari vendor yang tampil di marketplace.'
    : step === 2
      ? 'Lengkapi penerima dan alamat proyek.'
      : step === 3
        ? 'Pilih jenis armada sesuai volume dan akses lokasi.'
        : 'Periksa kembali sebelum mengirim pesanan ke vendor.';

  return (
    <View style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 14, 26), paddingBottom: 124 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={previousStep} style={styles.backButton}><Text style={styles.backSymbol}>‹</Text></Pressable>
          <BrandMark compact />
          <Pressable onPress={() => router.replace('/customer-home')} style={styles.closeButton}><Text style={styles.closeButtonText}>Tutup</Text></Pressable>
        </View>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>CHECKOUT CUSTOMER</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <Progress step={step} />

        {step === 1 ? (
          <View style={styles.section}>
            <View style={styles.vendorSource}>
              <Text style={styles.vendorSourceLabel}>Sumber material</Text>
              <Text style={styles.vendorSourceValue}>{params.vendor ? material.vendor : 'Marketplace goTamb'}</Text>
            </View>
            <View style={styles.materialList}>
              {materials.map((item) => {
                const selected = item.id === materialId;
                return (
                  <Pressable key={item.id} onPress={() => chooseMaterial(item.id)} style={({ pressed }) => [styles.materialCard, selected && styles.materialCardSelected, pressed && styles.pressed]}>
                    <View style={styles.materialMark}><Text style={styles.materialMarkText}>{item.symbol}</Text></View>
                    <View style={styles.materialCopy}>
                      <Text style={styles.materialName}>{item.name}</Text>
                      <Text style={styles.materialMeta}>{item.vendor} · {item.category}</Text>
                      <View style={styles.materialBottom}>
                        <Text style={styles.materialPrice}>{rupiah(item.price)} / {item.unit}</Text>
                        <Text style={styles.stockText}>Stok {item.stock} {item.unit}</Text>
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
                <Text style={styles.fieldHelper}>Maksimal stok saat ini {material.stock} {material.unit}.</Text>
              </View>
              <View style={styles.quantityInputWrap}>
                <TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={styles.quantityInput} selectTextOnFocus />
                <Text style={styles.quantityUnit}>{material.unit}</Text>
              </View>
            </View>
            {parsedQuantity > material.stock ? <Text style={styles.validationText}>Jumlah melebihi stok vendor.</Text> : null}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.formCard}>
            <Field label="Nama proyek" value={projectName} onChangeText={setProjectName} placeholder="Contoh: Proyek Rumah Sumedang" />
            <Field label="Nama penerima" value={receiverName} onChangeText={setReceiverName} placeholder="Nama penerima di lokasi" />
            <Field label="Nomor HP" value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" />
            <Field label="Alamat lengkap" value={address} onChangeText={setAddress} placeholder="Jalan, desa/kecamatan, kabupaten" multiline />
            <Field label="Catatan untuk driver" value={notes} onChangeText={setNotes} placeholder="Patokan, akses jalan, waktu penerimaan, dll." multiline optional />
            <View style={styles.mapNotice}>
              <Text style={styles.mapNoticeIcon}>⌖</Text>
              <View style={styles.mapNoticeCopy}>
                <Text style={styles.mapNoticeTitle}>Titik proyek</Text>
                <Text style={styles.mapNoticeText}>Alamat disimpan pada pesanan. Penentuan pin proyek presisi akan menjadi langkah berikutnya.</Text>
              </View>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.section}>
            <View style={styles.infoBanner}><Text style={styles.infoSymbol}>i</Text><Text style={styles.infoText}>Ongkir di bawah masih estimasi berdasarkan jenis armada. Perhitungan jarak vendor → proyek akan disambungkan ke titik alamat.</Text></View>
            <View style={styles.vehicleList}>
              {vehicles.map((item) => {
                const selected = vehicleId === item.id;
                return (
                  <Pressable key={item.id} onPress={() => setVehicleId(item.id)} style={({ pressed }) => [styles.vehicleCard, selected && styles.vehicleCardSelected, pressed && styles.pressed]}>
                    <View style={styles.vehicleIcon}><Text style={styles.vehicleIconText}>TR</Text></View>
                    <View style={styles.vehicleCopy}>
                      <View style={styles.vehicleTitleRow}><Text style={styles.vehicleName}>{item.name}</Text>{item.recommended ? <StatusChip label="Rekomendasi" tone="brand" /> : null}</View>
                      <Text style={styles.vehicleCapacity}>{item.capacity}</Text>
                      <Text style={styles.vehicleDescription}>{item.description}</Text>
                      <Text style={styles.vehiclePrice}>{rupiah(item.price)} estimasi ongkir</Text>
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
              <Text style={styles.summaryTitle}>Material & vendor</Text>
              <SummaryRow label="Material" value={`${material.name} · ${quantity} ${material.unit}`} />
              <SummaryRow label="Vendor" value={material.vendor} />
              <View style={styles.divider} />
              <Text style={styles.summaryTitle}>Pengiriman</Text>
              <SummaryRow label="Proyek" value={projectName} />
              <SummaryRow label="Penerima" value={`${receiverName} · ${phone}`} />
              <SummaryRow label="Alamat" value={address} />
              <SummaryRow label="Armada" value={`${vehicle.name} · ${vehicle.capacity}`} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Rincian harga</Text>
              <SummaryRow label={`Material (${quantity} ${material.unit})`} value={rupiah(materialSubtotal)} />
              <SummaryRow label="Estimasi pengiriman" value={rupiah(vehicle.price)} />
              <SummaryRow label="Biaya layanan" value={rupiah(serviceFee)} />
              <View style={styles.divider} />
              <SummaryRow label="Total estimasi" value={rupiah(total)} strong />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {step > 1 ? <Pressable onPress={previousStep} style={styles.secondaryFooterButton}><Text style={styles.secondaryFooterText}>Kembali</Text></Pressable> : null}
        <Pressable
          disabled={!canContinue || creating}
          onPress={() => (step === 4 ? createOrder() : setStep((current) => Math.min(current + 1, 4)))}
          style={[styles.footerPrimary, (!canContinue || creating) && styles.disabled]}>
          {creating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.footerPrimaryText}>{step === 4 ? 'Buat pesanan' : 'Lanjutkan'}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <View style={styles.progressRow}>
      {[1, 2, 3, 4].map((value) => (
        <View key={value} style={styles.progressItem}>
          <View style={[styles.progressDot, value <= step && styles.progressDotActive]}><Text style={[styles.progressDotText, value <= step && styles.progressDotTextActive]}>{value}</Text></View>
          {value < 4 ? <View style={[styles.progressLine, value < step && styles.progressLineActive]} /> : null}
        </View>
      ))}
    </View>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue, strong && styles.summaryValueStrong]}>{value}</Text></View>;
}

function Field({ label, value, onChangeText, placeholder, multiline = false, optional = false, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; optional?: boolean; keyboardType?: 'default' | 'phone-pad' }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldTitle}>{label}{optional ? ' (opsional)' : ''}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9AA2AE" multiline={multiline} keyboardType={keyboardType} style={[styles.fieldInput, multiline && styles.fieldInputMultiline]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { paddingHorizontal: 18, gap: 20 },
  centerScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 13, paddingHorizontal: 30, backgroundColor: palette.background },
  loadingText: { color: palette.muted, fontSize: 12 },
  emptyTitle: { color: palette.ink, fontSize: 20, fontWeight: '900' },
  emptyText: { color: palette.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  linkButton: { padding: 10 },
  linkButtonText: { color: palette.brandDark, fontSize: 12, fontWeight: '800' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  backSymbol: { color: palette.ink, fontSize: 28, lineHeight: 30 },
  closeButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 11 },
  closeButtonText: { color: palette.muted, fontSize: 11, fontWeight: '800' },
  heading: { gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: palette.ink, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  progressItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  progressDot: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E4E7EB' },
  progressDotActive: { backgroundColor: palette.brand },
  progressDotText: { color: '#8B94A0', fontSize: 9, fontWeight: '900' },
  progressDotTextActive: { color: palette.ink },
  progressLine: { flex: 1, height: 2, backgroundColor: '#E4E7EB' },
  progressLineActive: { backgroundColor: palette.brand },
  section: { gap: 12 },
  vendorSource: { borderRadius: 17, backgroundColor: palette.brandSoft, borderWidth: 1, borderColor: '#F0D18D', padding: 13, gap: 3 },
  vendorSourceLabel: { color: '#87631E', fontSize: 9, fontWeight: '700' },
  vendorSourceValue: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  materialList: { gap: 9 },
  materialCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 11 },
  materialCardSelected: { borderColor: '#E7B64C', backgroundColor: '#FFFCF5' },
  materialMark: { width: 47, height: 47, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft },
  materialMarkText: { color: palette.brandDark, fontSize: 11, fontWeight: '900' },
  materialCopy: { flex: 1, gap: 3 },
  materialName: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  materialMeta: { color: palette.muted, fontSize: 9 },
  materialBottom: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  materialPrice: { color: palette.green, fontSize: 10, fontWeight: '900' },
  stockText: { color: palette.muted, fontSize: 9 },
  radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: '#C8CED5' },
  radioSelected: { borderWidth: 6, borderColor: palette.brandDark },
  quantityCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 13 },
  quantityCopy: { flex: 1, gap: 3 },
  fieldTitle: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  fieldHelper: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  quantityInputWrap: { minWidth: 112, flexDirection: 'row', alignItems: 'center', borderRadius: 13, backgroundColor: '#F6F7F8', borderWidth: 1, borderColor: '#E3E6EA', overflow: 'hidden' },
  quantityInput: { width: 62, minHeight: 44, color: palette.ink, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  quantityUnit: { flex: 1, color: palette.muted, fontSize: 9, fontWeight: '800' },
  validationText: { color: palette.red, fontSize: 10, fontWeight: '700' },
  formCard: { gap: 14, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 15 },
  field: { gap: 6 },
  fieldInput: { minHeight: 48, borderRadius: 14, backgroundColor: '#F7F8F9', borderWidth: 1, borderColor: '#E5E8EC', paddingHorizontal: 12, color: palette.ink, fontSize: 12 },
  fieldInputMultiline: { minHeight: 86, textAlignVertical: 'top', paddingTop: 12 },
  mapNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: '#EEF4FF', padding: 12 },
  mapNoticeIcon: { color: palette.blue, fontSize: 20, fontWeight: '900' },
  mapNoticeCopy: { flex: 1, gap: 2 },
  mapNoticeTitle: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  mapNoticeText: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  infoBanner: { flexDirection: 'row', gap: 9, borderRadius: 16, backgroundColor: palette.blueSoft, padding: 12 },
  infoSymbol: { color: palette.blue, fontSize: 13, fontWeight: '900' },
  infoText: { flex: 1, color: '#50647E', fontSize: 9, lineHeight: 14 },
  vehicleList: { gap: 9 },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 12 },
  vehicleCardSelected: { borderColor: '#E7B64C', backgroundColor: '#FFFCF5' },
  vehicleIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF0F3' },
  vehicleIconText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  vehicleCopy: { flex: 1, gap: 3 },
  vehicleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  vehicleName: { flex: 1, color: palette.ink, fontSize: 12, fontWeight: '900' },
  vehicleCapacity: { color: palette.brandDark, fontSize: 9, fontWeight: '800' },
  vehicleDescription: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  vehiclePrice: { color: palette.green, fontSize: 10, fontWeight: '900' },
  summaryCard: { gap: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 15 },
  summaryTitle: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summaryLabel: { width: 110, color: palette.muted, fontSize: 9, lineHeight: 14 },
  summaryValue: { flex: 1, color: palette.ink, fontSize: 9, lineHeight: 14, fontWeight: '700', textAlign: 'right' },
  summaryValueStrong: { color: palette.green, fontSize: 13, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#ECEFF2' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 9, backgroundColor: 'rgba(255,255,255,0.98)', borderTopWidth: 1, borderTopColor: palette.line, paddingHorizontal: 16, paddingTop: 10 },
  secondaryFooterButton: { minWidth: 94, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#F2F4F6' },
  secondaryFooterText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  footerPrimary: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.ink },
  footerPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  successScreen: { paddingHorizontal: 20, gap: 22, backgroundColor: palette.background },
  successCard: { gap: 14, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 20 },
  successIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.greenSoft },
  successIconText: { color: palette.green, fontSize: 26, fontWeight: '900' },
  successTitle: { color: palette.ink, fontSize: 24, fontWeight: '900' },
  successBody: { color: palette.muted, fontSize: 11, lineHeight: 17 },
  orderCode: { color: palette.brandDark, fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.ink, paddingHorizontal: 18 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  secondaryFullButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#F3F5F6' },
  secondaryFullButtonText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  pressed: { opacity: 0.76 },
});
