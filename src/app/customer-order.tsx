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

import {
  DeliveryLocationPicker,
  type DeliveryCoordinate,
} from '@/components/delivery-location-picker';
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
  vendorCoordinate: DeliveryCoordinate | null;
};

type Fleet = {
  id: string;
  vendor_id: string;
  no_polisi: string;
  kapasitas: number | null;
  satuan_kapasitas: string;
  jenis_armada: string;
  tarif_dasar: number;
  tarif_per_km: number;
  driver_id: string | null;
};

type RouteQuote = {
  source: 'google_routes' | 'fallback';
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string | null;
  warning: string | null;
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
  lokasi_lat: number | null;
  lokasi_lng: number | null;
};

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

function distanceKm(a: DeliveryCoordinate, b: DeliveryCoordinate) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function fallbackRoute(origin: DeliveryCoordinate, destination: DeliveryCoordinate): RouteQuote {
  const roadKm = distanceKm(origin, destination) * 1.25;
  return {
    source: 'fallback',
    distanceMeters: Math.max(1000, Math.round(roadKm * 1000)),
    durationSeconds: Math.max(300, Math.round((roadKm / 35) * 3600)),
    encodedPolyline: null,
    warning: 'Google Routes belum tersedia; ongkir memakai estimasi jalan sementara.',
  };
}

function decodePolyline(encoded: string): DeliveryCoordinate[] {
  const result: DeliveryCoordinate[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let shift = 0;
    let value = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      value |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    latitude += value & 1 ? ~(value >> 1) : value >> 1;

    shift = 0;
    value = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      value |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    longitude += value & 1 ? ~(value >> 1) : value >> 1;

    result.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }

  return result;
}

function durationText(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain ? `${hours} jam ${remain} menit` : `${hours} jam`;
}

export default function CustomerOrder() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ item?: string; vendor?: string }>();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [fleetLoading, setFleetLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState(1);
  const [materialId, setMaterialId] = useState('');
  const [fleetId, setFleetId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [projectName, setProjectName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [projectCoordinate, setProjectCoordinate] = useState<DeliveryCoordinate | null>(null);
  const [routeQuote, setRouteQuote] = useState<RouteQuote | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
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
      .select('id, nama_perusahaan, lokasi_lat, lokasi_lng')
      .in('id', vendorIds);

    if (vendorError) {
      setLoading(false);
      setLoadError(vendorError.message);
      return;
    }

    const vendorMap = new Map(((vendorData ?? []) as VendorRow[]).map((vendor) => [vendor.id, vendor]));
    const nextMaterials = itemRows.map<Material>((item) => {
      const vendor = vendorMap.get(item.vendor_id);
      return {
        id: item.id,
        vendorId: item.vendor_id,
        name: item.nama_item,
        vendor: vendor?.nama_perusahaan ?? 'Vendor goTamb',
        category: item.kategori,
        price: Number(item.harga),
        unit: item.satuan,
        stock: Number(item.stok),
        symbol: item.kategori.slice(0, 2).toUpperCase(),
        vendorCoordinate:
          vendor?.lokasi_lat != null && vendor?.lokasi_lng != null
            ? { latitude: vendor.lokasi_lat, longitude: vendor.lokasi_lng }
            : null,
      };
    });

    setMaterials(nextMaterials);
    setMaterialId((current) => current || nextMaterials[0].id);
    setLoading(false);
  }, [params.item, params.vendor]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const material = materials.find((item) => item.id === materialId) ?? materials[0] ?? null;
  const selectedFleet = fleets.find((fleet) => fleet.id === fleetId) ?? fleets[0] ?? null;

  const loadFleets = useCallback(async (vendorId: string) => {
    setFleetLoading(true);
    const { data, error } = await supabase
      .from('fleets')
      .select('id, vendor_id, no_polisi, kapasitas, satuan_kapasitas, jenis_armada, tarif_dasar, tarif_per_km, driver_id')
      .eq('vendor_id', vendorId)
      .eq('status_ketersediaan', 'tersedia')
      .order('jenis_armada', { ascending: true });

    if (error) {
      setFleets([]);
      setFleetId('');
      setFleetLoading(false);
      return;
    }

    const rows = (data ?? []).map((row) => ({
      ...row,
      kapasitas: row.kapasitas == null ? null : Number(row.kapasitas),
      tarif_dasar: Number(row.tarif_dasar),
      tarif_per_km: Number(row.tarif_per_km),
    })) as Fleet[];
    setFleets(rows);
    setFleetId((current) => (rows.some((fleet) => fleet.id === current) ? current : rows[0]?.id ?? ''));
    setFleetLoading(false);
  }, []);

  useEffect(() => {
    if (!material?.vendorId) return;
    loadFleets(material.vendorId);
  }, [loadFleets, material?.vendorId]);

  const parsedQuantity = Math.max(Number(quantity.replace(',', '.')) || 0, 0);
  const materialSubtotal = material ? material.price * parsedQuantity : 0;
  const routeDistanceKm = routeQuote ? routeQuote.distanceMeters / 1000 : 0;
  const shippingCost = selectedFleet
    ? Math.round((selectedFleet.tarif_dasar + routeDistanceKm * selectedFleet.tarif_per_km) / 1000) * 1000
    : 0;
  const serviceFee = Math.round(materialSubtotal * 0.015);
  const total = materialSubtotal + shippingCost + serviceFee;
  const routeCoordinates = useMemo(
    () => (routeQuote?.encodedPolyline ? decodePolyline(routeQuote.encodedPolyline) : []),
    [routeQuote?.encodedPolyline],
  );

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(material && parsedQuantity > 0 && parsedQuantity <= material.stock);
    if (step === 2) {
      return Boolean(projectName.trim() && receiverName.trim() && phone.trim() && address.trim() && projectCoordinate);
    }
    if (step === 3) return Boolean(selectedFleet && routeQuote);
    return Boolean(selectedFleet && routeQuote);
  }, [address, material, parsedQuantity, phone, projectCoordinate, projectName, receiverName, routeQuote, selectedFleet, step]);

  function chooseMaterial(id: string) {
    setMaterialId(id);
    setQuantity('1');
    setRouteQuote(null);
    setFleetId('');
  }

  function updateProjectCoordinate(value: DeliveryCoordinate) {
    setProjectCoordinate(value);
    setRouteQuote(null);
  }

  function previousStep() {
    if (step === 1) {
      router.back();
      return;
    }
    setStep((current) => Math.max(current - 1, 1));
  }

  async function calculateRouteAndContinue() {
    if (!material?.vendorCoordinate || !projectCoordinate || routeLoading) {
      if (!material?.vendorCoordinate) Alert.alert('Lokasi vendor belum lengkap', 'Vendor perlu mengisi titik perusahaan sebelum ongkir dapat dihitung.');
      return;
    }

    setRouteLoading(true);
    const { data, error } = await supabase.functions.invoke('route-quote', {
      body: { origin: material.vendorCoordinate, destination: projectCoordinate },
    });

    let quote: RouteQuote;
    if (error || !data?.distanceMeters) {
      quote = fallbackRoute(material.vendorCoordinate, projectCoordinate);
    } else {
      quote = {
        source: data.source === 'google_routes' ? 'google_routes' : 'fallback',
        distanceMeters: Number(data.distanceMeters),
        durationSeconds: Number(data.durationSeconds ?? 0),
        encodedPolyline: typeof data.encodedPolyline === 'string' ? data.encodedPolyline : null,
        warning: typeof data.warning === 'string' ? data.warning : null,
      };
    }

    setRouteQuote(quote);
    setRouteLoading(false);
    setStep(3);
  }

  async function createOrder() {
    if (!material || !projectCoordinate || !selectedFleet || !routeQuote || creating) return;
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
      fleet_id: selectedFleet.id,
      volume: parsedQuantity,
      status: 'menunggu',
      kontrak_id: code,
      total_harga: total,
      project_name: projectName.trim(),
      receiver_name: receiverName.trim(),
      receiver_phone: phone.trim(),
      delivery_address: address.trim(),
      delivery_lat: projectCoordinate.latitude,
      delivery_lng: projectCoordinate.longitude,
      distance_km: Number(routeDistanceKm.toFixed(2)),
      route_distance_m: routeQuote.distanceMeters,
      route_duration_s: routeQuote.durationSeconds,
      route_polyline: routeQuote.encodedPolyline,
      route_source: routeQuote.source,
      route_updated_at: new Date().toISOString(),
      notes: notes.trim() || null,
      vehicle_type: selectedFleet.jenis_armada,
      vehicle_capacity: selectedFleet.kapasitas == null ? null : `${selectedFleet.kapasitas} ${selectedFleet.satuan_kapasitas}`,
      shipping_cost: shippingCost,
      service_fee: serviceFee,
    });

    setCreating(false);
    if (insertError) {
      Alert.alert('Pesanan belum berhasil dibuat', insertError.message);
      await loadFleets(material.vendorId);
      return;
    }

    setCreatedOrder(code);
  }

  if (loading) {
    return <View style={styles.centerScreen}><ActivityIndicator color={palette.brandDark} /><Text style={styles.loadingText}>Memuat marketplace...</Text></View>;
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
          <Text style={styles.successTitle}>Armada berhasil dipesan.</Text>
          <Text style={styles.successBody}>Nomor pesanan Anda:</Text>
          <Text selectable style={styles.orderCode}>{createdOrder}</Text>
          <View style={styles.summaryCard}>
            <SummaryRow label="Material" value={`${material.name} · ${quantity} ${material.unit}`} />
            <SummaryRow label="Vendor" value={material.vendor} />
            <SummaryRow label="Rute" value={`${routeDistanceKm.toFixed(1)} km · ${durationText(routeQuote?.durationSeconds ?? 0)}`} />
            <SummaryRow label="Sumber rute" value={routeQuote?.source === 'google_routes' ? 'Google Routes' : 'Estimasi sementara'} />
            <SummaryRow label="Armada" value={`${selectedFleet.jenis_armada} · ${selectedFleet.no_polisi}`} />
            <SummaryRow label="Driver" value={selectedFleet.driver_id ? 'Sudah ditugaskan' : 'Menunggu penugasan vendor'} />
            <SummaryRow label="Total" value={rupiah(total)} strong />
          </View>
          <Pressable onPress={() => router.replace(`/customer-orders?created=${createdOrder}`)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Lihat pesanan</Text></Pressable>
          <Pressable onPress={() => router.replace('/customer-home')} style={styles.secondaryFullButton}><Text style={styles.secondaryFullButtonText}>Kembali ke peta</Text></Pressable>
        </View>
      </ScrollView>
    );
  }

  const title = step === 1 ? 'Pilih material' : step === 2 ? 'Titik pengiriman' : step === 3 ? 'Pilih armada tersedia' : 'Ringkasan pesanan';
  const subtitle = step === 1
    ? 'Material berasal langsung dari vendor di marketplace.'
    : step === 2
      ? 'Tentukan titik proyek; rute jalan akan dihitung sebelum memilih armada.'
      : step === 3
        ? 'Hanya unit armada vendor yang berstatus tersedia yang ditampilkan.'
        : 'Periksa rute, armada, dan total sebelum mengirim pesanan.';

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
          <Text selectable style={styles.title}>{title}</Text>
          <Text selectable style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Progress step={step} />

        {step === 1 ? (
          <View style={styles.section}>
            <View style={styles.vendorSource}><Text style={styles.vendorSourceLabel}>Sumber material</Text><Text style={styles.vendorSourceValue}>{material.vendor}</Text></View>
            <View style={styles.materialList}>
              {materials.map((item) => {
                const selected = item.id === materialId;
                return (
                  <Pressable key={item.id} onPress={() => chooseMaterial(item.id)} style={({ pressed }) => [styles.materialCard, selected && styles.selectedCard, pressed && styles.pressed]}>
                    <View style={styles.materialMark}><Text style={styles.materialMarkText}>{item.symbol}</Text></View>
                    <View style={styles.flexCopy}>
                      <Text selectable style={styles.cardTitle}>{item.name}</Text>
                      <Text selectable style={styles.cardMeta}>{item.vendor} · {item.category}</Text>
                      <View style={styles.cardBottom}><Text style={styles.price}>{rupiah(item.price)} / {item.unit}</Text><Text style={styles.smallText}>Stok {item.stock} {item.unit}</Text></View>
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]} />
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.quantityCard}>
              <View style={styles.flexCopy}><Text style={styles.fieldTitle}>Jumlah kebutuhan</Text><Text style={styles.helper}>Maksimal {material.stock} {material.unit}.</Text></View>
              <View style={styles.quantityInputWrap}><TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={styles.quantityInput} /><Text style={styles.quantityUnit}>{material.unit}</Text></View>
            </View>
            {parsedQuantity > material.stock ? <Text style={styles.errorText}>Jumlah melebihi stok vendor.</Text> : null}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.section}>
            <View style={styles.formCard}>
              <Field label="Nama proyek" value={projectName} onChangeText={setProjectName} placeholder="Contoh: Proyek Rumah Sumedang" />
              <Field label="Nama penerima" value={receiverName} onChangeText={setReceiverName} placeholder="Nama penerima di lokasi" />
              <Field label="Nomor HP" value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" />
              <Field label="Alamat lengkap" value={address} onChangeText={setAddress} placeholder="Jalan, desa/kecamatan, kabupaten" multiline />
              <Field label="Catatan untuk driver" value={notes} onChangeText={setNotes} placeholder="Patokan, akses jalan, waktu penerimaan, dll." multiline optional />
            </View>
            <DeliveryLocationPicker
              vendorCoordinate={material.vendorCoordinate}
              value={projectCoordinate}
              onChange={updateProjectCoordinate}
              routeCoordinates={routeCoordinates}
              routeSource={routeQuote?.source ?? null}
            />
            {routeQuote?.warning ? <View style={styles.warningCard}><Text style={styles.warningText}>{routeQuote.warning}</Text></View> : null}
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.section}>
            {routeQuote ? (
              <View style={styles.routeCard}>
                <View style={styles.routeHeader}><Text style={styles.routeTitle}>Rute vendor → proyek</Text><StatusChip label={routeQuote?.source === 'google_routes' ? 'Google Routes' : 'Estimasi'} tone={routeQuote?.source === 'google_routes' ? 'green' : 'brand'} /></View>
                <Text selectable style={styles.routeValue}>{routeDistanceKm.toFixed(1)} km · {durationText(routeQuote?.durationSeconds ?? 0)}</Text>
                {routeQuote.warning ? <Text selectable style={styles.routeWarning}>{routeQuote.warning}</Text> : null}
              </View>
            ) : null}

            {fleetLoading ? <View style={styles.stateCard}><ActivityIndicator color={palette.brandDark} /><Text style={styles.helper}>Memeriksa armada tersedia...</Text></View> : null}
            {!fleetLoading && !fleets.length ? (
              <View style={styles.stateCard}><Text style={styles.emptyTitle}>Armada sedang penuh</Text><Text style={styles.emptyText}>Tidak ada unit vendor yang berstatus tersedia. Kembali lagi setelah armada menyelesaikan tugas.</Text></View>
            ) : null}
            <View style={styles.materialList}>
              {fleets.map((fleet) => {
                const selected = fleet.id === selectedFleet?.id;
                const cost = Math.round((fleet.tarif_dasar + routeDistanceKm * fleet.tarif_per_km) / 1000) * 1000;
                return (
                  <Pressable key={fleet.id} onPress={() => setFleetId(fleet.id)} style={({ pressed }) => [styles.materialCard, selected && styles.selectedCard, pressed && styles.pressed]}>
                    <View style={styles.vehicleMark}><Text style={styles.vehicleMarkText}>TR</Text></View>
                    <View style={styles.flexCopy}>
                      <View style={styles.cardBottom}><Text selectable style={styles.cardTitle}>{fleet.jenis_armada}</Text>{fleet.driver_id ? <StatusChip label="Driver siap" tone="green" /> : <StatusChip label="Driver menyusul" tone="neutral" />}</View>
                      <Text selectable style={styles.cardMeta}>{fleet.no_polisi} · {fleet.kapasitas ?? '-'} {fleet.satuan_kapasitas}</Text>
                      <Text selectable style={styles.price}>{rupiah(cost)} ongkir rute ini</Text>
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 4 && selectedFleet && routeQuote ? (
          <View style={styles.section}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Material & pengiriman</Text>
              <SummaryRow label="Material" value={`${material.name} · ${quantity} ${material.unit}`} />
              <SummaryRow label="Vendor" value={material.vendor} />
              <SummaryRow label="Alamat" value={address} />
              <SummaryRow label="Rute" value={`${routeDistanceKm.toFixed(1)} km · ${durationText(routeQuote?.durationSeconds ?? 0)}`} />
              <SummaryRow label="Armada" value={`${selectedFleet.jenis_armada} · ${selectedFleet.no_polisi}`} />
              <SummaryRow label="Driver" value={selectedFleet.driver_id ? 'Sudah ditugaskan' : 'Akan ditugaskan vendor'} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Rincian harga</Text>
              <SummaryRow label="Material" value={rupiah(materialSubtotal)} />
              <SummaryRow label="Ongkir" value={rupiah(shippingCost)} />
              <SummaryRow label="Biaya layanan" value={rupiah(serviceFee)} />
              <View style={styles.divider} />
              <SummaryRow label="Total" value={rupiah(total)} strong />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {step > 1 ? <Pressable onPress={previousStep} style={styles.secondaryFooterButton}><Text style={styles.secondaryFooterText}>Kembali</Text></Pressable> : null}
        <Pressable
          disabled={!canContinue || creating || routeLoading}
          onPress={() => {
            if (step === 2) calculateRouteAndContinue();
            else if (step === 4) createOrder();
            else setStep((current) => Math.min(current + 1, 4));
          }}
          style={[styles.footerPrimary, (!canContinue || creating || routeLoading) && styles.disabled]}>
          {creating || routeLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.footerPrimaryText}>{step === 2 ? 'Hitung rute & armada' : step === 4 ? 'Buat pesanan' : 'Lanjutkan'}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function Progress({ step }: { step: number }) {
  return <View style={styles.progressRow}>{[1, 2, 3, 4].map((value) => <View key={value} style={styles.progressItem}><View style={[styles.progressDot, value <= step && styles.progressDotActive]}><Text style={[styles.progressDotText, value <= step && styles.progressDotTextActive]}>{value}</Text></View>{value < 4 ? <View style={[styles.progressLine, value < step && styles.progressLineActive]} /> : null}</View>)}</View>;
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text selectable style={[styles.summaryValue, strong && styles.summaryValueStrong]}>{value}</Text></View>;
}

function Field({ label, value, onChangeText, placeholder, multiline = false, optional = false, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; optional?: boolean; keyboardType?: 'default' | 'phone-pad' }) {
  return <View style={styles.field}><Text style={styles.fieldTitle}>{label}{optional ? ' (opsional)' : ''}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9AA2AE" multiline={multiline} keyboardType={keyboardType} style={[styles.fieldInput, multiline && styles.fieldInputMultiline]} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { paddingHorizontal: 18, gap: 20 },
  centerScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 13, paddingHorizontal: 30, backgroundColor: palette.background },
  loadingText: { color: palette.muted, fontSize: 12 },
  emptyTitle: { color: palette.ink, fontSize: 17, fontWeight: '900' },
  emptyText: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.ink, paddingHorizontal: 18 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  linkButton: { padding: 10 },
  linkButtonText: { color: palette.brandDark, fontSize: 11, fontWeight: '800' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  backSymbol: { color: palette.ink, fontSize: 28, lineHeight: 30 },
  closeButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 11 },
  closeButtonText: { color: palette.muted, fontSize: 11, fontWeight: '800' },
  heading: { gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: palette.ink, fontSize: 27, lineHeight: 32, fontWeight: '900', letterSpacing: -0.7 },
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
  selectedCard: { borderColor: '#E7B64C', backgroundColor: '#FFFCF5' },
  materialMark: { width: 47, height: 47, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft },
  materialMarkText: { color: palette.brandDark, fontSize: 11, fontWeight: '900' },
  vehicleMark: { width: 47, height: 47, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF0F3' },
  vehicleMarkText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  flexCopy: { flex: 1, gap: 3 },
  cardTitle: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  cardMeta: { color: palette.muted, fontSize: 9 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  price: { color: palette.green, fontSize: 10, fontWeight: '900' },
  smallText: { color: palette.muted, fontSize: 9 },
  radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: '#C8CED5' },
  radioSelected: { borderWidth: 6, borderColor: palette.brandDark },
  quantityCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 13 },
  quantityInputWrap: { minWidth: 112, flexDirection: 'row', alignItems: 'center', borderRadius: 13, backgroundColor: '#F6F7F8', borderWidth: 1, borderColor: '#E3E6EA', overflow: 'hidden' },
  quantityInput: { width: 62, minHeight: 44, color: palette.ink, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  quantityUnit: { flex: 1, color: palette.muted, fontSize: 9, fontWeight: '800' },
  fieldTitle: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  helper: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  errorText: { color: palette.red, fontSize: 10, fontWeight: '700' },
  formCard: { gap: 14, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 15 },
  field: { gap: 6 },
  fieldInput: { minHeight: 48, borderRadius: 14, backgroundColor: '#F7F8F9', borderWidth: 1, borderColor: '#E5E8EC', paddingHorizontal: 12, color: palette.ink, fontSize: 12 },
  fieldInputMultiline: { minHeight: 86, textAlignVertical: 'top', paddingTop: 12 },
  warningCard: { borderRadius: 15, backgroundColor: '#FFF3D8', borderWidth: 1, borderColor: '#F1D394', padding: 11 },
  warningText: { color: '#755412', fontSize: 9, lineHeight: 14 },
  routeCard: { gap: 7, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 14 },
  routeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  routeTitle: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  routeValue: { color: palette.green, fontSize: 18, fontWeight: '900' },
  routeWarning: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  stateCard: { alignItems: 'center', gap: 8, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 18 },
  summaryCard: { gap: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 15 },
  summaryTitle: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summaryLabel: { width: 105, color: palette.muted, fontSize: 9, lineHeight: 14 },
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
  orderCode: { color: palette.brandDark, fontSize: 20, fontWeight: '900', letterSpacing: 0.7 },
  secondaryFullButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#F2F4F6' },
  secondaryFullButtonText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  pressed: { opacity: 0.76 },
});
