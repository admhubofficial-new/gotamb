import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark, StatusChip, palette } from '@/components/gotamb-ui';
import { supabase } from '../../lib/supabase';

type Fleet = {
  id: string;
  vendor_id: string;
  no_polisi: string;
  kapasitas: number | null;
  satuan_kapasitas: string;
  jenis_armada: string;
  status_ketersediaan: 'tersedia' | 'dipesan' | 'bertugas' | 'nonaktif';
  tarif_dasar: number;
  tarif_per_km: number;
  driver_id: string | null;
};

type Driver = {
  id: string;
  nama: string | null;
  no_hp: string | null;
  assigned_fleet_count: number;
};

const vehiclePresets = [
  { name: 'Dump Truck Engkel', capacity: '6', unit: 'm³', base: '120000', perKm: '8000' },
  { name: 'Dump Truck Double', capacity: '8', unit: 'm³', base: '160000', perKm: '10000' },
  { name: 'Tronton', capacity: '20', unit: 'ton', base: '280000', perKm: '14000' },
] as const;

export default function VendorFleets() {
  const insets = useSafeAreaInsets();
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('Vendor');
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignFleetId, setAssignFleetId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [vehiclePreset, setVehiclePreset] = useState(1);
  const [plate, setPlate] = useState('');
  const [capacity, setCapacity] = useState(vehiclePresets[1].capacity);
  const [saving, setSaving] = useState(false);

  const driverMap = useMemo(() => new Map(drivers.map((driver) => [driver.id, driver])), [drivers]);
  const preset = vehiclePresets[vehiclePreset];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setLoading(false);
      setError('Sesi Vendor tidak ditemukan.');
      return;
    }

    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id, nama_perusahaan')
      .eq('user_id', authData.user.id)
      .single();
    if (vendorError || !vendorData) {
      setLoading(false);
      setError(vendorError?.message || 'Data Vendor tidak ditemukan.');
      return;
    }

    setVendorId(vendorData.id);
    setVendorName(vendorData.nama_perusahaan);

    const [fleetResult, driverResult] = await Promise.all([
      supabase
        .from('fleets')
        .select('id, vendor_id, no_polisi, kapasitas, satuan_kapasitas, jenis_armada, status_ketersediaan, tarif_dasar, tarif_per_km, driver_id')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false }),
      supabase.rpc('list_available_drivers'),
    ]);

    if (fleetResult.error || driverResult.error) {
      setLoading(false);
      setError(fleetResult.error?.message || driverResult.error?.message || 'Data armada belum dapat dimuat.');
      return;
    }

    setFleets(((fleetResult.data ?? []) as Fleet[]).map((fleet) => ({
      ...fleet,
      kapasitas: fleet.kapasitas == null ? null : Number(fleet.kapasitas),
      tarif_dasar: Number(fleet.tarif_dasar),
      tarif_per_km: Number(fleet.tarif_per_km),
    })));
    setDrivers(((driverResult.data ?? []) as Driver[]).map((driver) => ({ ...driver, assigned_fleet_count: Number(driver.assigned_fleet_count) })));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function choosePreset(index: number) {
    const next = vehiclePresets[index];
    setVehiclePreset(index);
    setCapacity(next.capacity);
  }

  async function addFleet() {
    const cleanPlate = plate.trim().toUpperCase();
    const numericCapacity = Number(capacity.replace(',', '.'));
    if (!vendorId || !cleanPlate || !numericCapacity || numericCapacity <= 0) {
      Alert.alert('Lengkapi armada', 'Nomor polisi dan kapasitas wajib diisi.');
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from('fleets').insert({
      vendor_id: vendorId,
      no_polisi: cleanPlate,
      kapasitas: numericCapacity,
      satuan_kapasitas: preset.unit,
      jenis_armada: preset.name,
      status_ketersediaan: 'tersedia',
      tarif_dasar: Number(preset.base),
      tarif_per_km: Number(preset.perKm),
    });
    setSaving(false);

    if (insertError) {
      Alert.alert('Armada belum tersimpan', insertError.message);
      return;
    }

    setPlate('');
    setShowAdd(false);
    await loadData();
  }

  async function assignDriver(fleetId: string, driverId: string | null) {
    setSaving(true);
    const { error: assignError } = await supabase.rpc('assign_driver_to_fleet', {
      p_fleet_id: fleetId,
      p_driver_id: driverId,
    });
    setSaving(false);
    if (assignError) {
      Alert.alert('Driver belum terpasang', assignError.message);
      return;
    }
    setAssignFleetId(null);
    await loadData();
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 14, 26), paddingBottom: Math.max(insets.bottom + 30, 42) }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backSymbol}>‹</Text></Pressable>
        <BrandMark compact />
        <Pressable onPress={loadData} style={styles.refreshButton}><Text style={styles.refreshText}>↻</Text></Pressable>
      </View>

      <View style={styles.heading}>
        <Text style={styles.eyebrow}>ARMADA VENDOR</Text>
        <Text selectable style={styles.title}>Kelola armada</Text>
        <Text selectable style={styles.subtitle}>{vendorName} · tambah unit dan pasangkan akun Driver ke kendaraan yang akan menerima tugas.</Text>
      </View>

      <Pressable onPress={() => setShowAdd((value) => !value)} style={styles.addToggle}><Text style={styles.addToggleText}>{showAdd ? '× Tutup form' : '＋ Tambah armada'}</Text></Pressable>

      {showAdd ? (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Unit baru</Text>
          <View style={styles.presetRow}>{vehiclePresets.map((item, index) => <Pressable key={item.name} onPress={() => choosePreset(index)} style={[styles.presetChip, vehiclePreset === index && styles.presetChipActive]}><Text style={[styles.presetText, vehiclePreset === index && styles.presetTextActive]}>{item.name.replace('Dump Truck ', '')}</Text></Pressable>)}</View>
          <Field label="Nomor polisi" value={plate} onChangeText={setPlate} placeholder="Contoh: Z 8123 AB" />
          <Field label={`Kapasitas (${preset.unit})`} value={capacity} onChangeText={setCapacity} placeholder={preset.capacity} keyboardType="decimal-pad" />
          <View style={styles.priceInfo}><Text style={styles.priceInfoText}>Tarif default: Rp {Number(preset.base).toLocaleString('id-ID')} + Rp {Number(preset.perKm).toLocaleString('id-ID')}/km</Text></View>
          <Pressable onPress={addFleet} disabled={saving} style={[styles.primaryButton, saving && styles.disabled]}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Simpan armada</Text>}</Pressable>
        </View>
      ) : null}

      {loading ? <View style={styles.stateCard}><ActivityIndicator color={palette.brandDark} /><Text style={styles.stateText}>Memuat armada...</Text></View> : null}
      {!loading && error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Armada belum dapat dimuat</Text><Text selectable style={styles.errorText}>{error}</Text></View> : null}

      {!loading && !error ? (
        <View style={styles.list}>
          {fleets.length === 0 ? <View style={styles.stateCard}><Text style={styles.emptyTitle}>Belum ada armada</Text><Text style={styles.stateText}>Tambahkan unit pertama agar Customer dapat memilih kendaraan saat checkout.</Text></View> : null}
          {fleets.map((fleet) => {
            const driver = fleet.driver_id ? driverMap.get(fleet.driver_id) : null;
            const assigning = assignFleetId === fleet.id;
            return (
              <View key={fleet.id} style={styles.fleetCard}>
                <View style={styles.fleetHeader}>
                  <View style={styles.truckMark}><Text style={styles.truckMarkText}>TR</Text></View>
                  <View style={styles.fleetCopy}><Text selectable style={styles.fleetName}>{fleet.jenis_armada}</Text><Text selectable style={styles.fleetMeta}>{fleet.no_polisi} · {fleet.kapasitas ?? '-'} {fleet.satuan_kapasitas}</Text></View>
                  <StatusChip label={fleet.status_ketersediaan} tone={fleet.status_ketersediaan === 'tersedia' ? 'green' : fleet.status_ketersediaan === 'bertugas' ? 'blue' : 'neutral'} />
                </View>
                <View style={styles.driverRow}><View><Text style={styles.driverLabel}>Driver</Text><Text selectable style={styles.driverName}>{driver?.nama || 'Belum ditugaskan'}</Text>{driver?.no_hp ? <Text selectable style={styles.driverPhone}>{driver.no_hp}</Text> : null}</View><Pressable onPress={() => setAssignFleetId(assigning ? null : fleet.id)} style={styles.assignButton}><Text style={styles.assignButtonText}>{assigning ? 'Tutup' : 'Atur Driver'}</Text></Pressable></View>

                {assigning ? (
                  <View style={styles.driverPicker}>
                    <Text style={styles.driverPickerTitle}>Pilih akun Driver</Text>
                    {fleet.driver_id ? <Pressable onPress={() => assignDriver(fleet.id, null)} disabled={saving} style={styles.driverOption}><Text style={styles.driverOptionName}>Tanpa Driver</Text><Text style={styles.driverOptionMeta}>Lepaskan penugasan saat ini</Text></Pressable> : null}
                    {drivers.length === 0 ? <Text style={styles.noDriverText}>Belum ada akun Driver. Daftarkan akun dengan role Driver dari halaman pendaftaran.</Text> : drivers.map((item) => <Pressable key={item.id} onPress={() => assignDriver(fleet.id, item.id)} disabled={saving} style={[styles.driverOption, fleet.driver_id === item.id && styles.driverOptionActive]}><Text style={styles.driverOptionName}>{item.nama || 'Driver goTamb'}</Text><Text style={styles.driverOptionMeta}>{item.no_hp || 'No. HP belum diisi'} · {item.assigned_fleet_count} armada terhubung</Text></Pressable>)}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'decimal-pad' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9AA2AE" keyboardType={keyboardType} style={styles.input} autoCapitalize="characters" /></View>;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: palette.background, paddingHorizontal: 18, gap: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  backSymbol: { color: palette.ink, fontSize: 28, lineHeight: 30 },
  refreshButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line },
  refreshText: { color: palette.ink, fontSize: 18, fontWeight: '900' },
  heading: { gap: 5 },
  eyebrow: { color: palette.brandDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: palette.ink, fontSize: 28, fontWeight: '900' },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  addToggle: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: palette.ink },
  addToggleText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  formCard: { gap: 12, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 15 },
  sectionTitle: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  presetChip: { borderRadius: 999, backgroundColor: '#F2F4F6', paddingHorizontal: 11, paddingVertical: 8 },
  presetChipActive: { backgroundColor: palette.brand },
  presetText: { color: palette.muted, fontSize: 9, fontWeight: '800' },
  presetTextActive: { color: palette.ink },
  field: { gap: 6 },
  fieldLabel: { color: palette.ink, fontSize: 10, fontWeight: '800' },
  input: { minHeight: 47, borderRadius: 14, backgroundColor: '#F7F8F9', borderWidth: 1, borderColor: '#E3E7EA', paddingHorizontal: 12, color: palette.ink, fontSize: 12 },
  priceInfo: { borderRadius: 13, backgroundColor: palette.brandSoft, padding: 10 },
  priceInfoText: { color: '#77500D', fontSize: 9, fontWeight: '700' },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: palette.ink },
  primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  list: { gap: 11 },
  fleetCard: { gap: 12, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 14 },
  fleetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  truckMark: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brandSoft },
  truckMarkText: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  fleetCopy: { flex: 1, gap: 3 },
  fleetName: { color: palette.ink, fontSize: 12, fontWeight: '900' },
  fleetMeta: { color: palette.muted, fontSize: 9 },
  driverRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: '#EEF0F3', paddingTop: 11 },
  driverLabel: { color: palette.muted, fontSize: 8, fontWeight: '700' },
  driverName: { color: palette.ink, fontSize: 10, fontWeight: '900', marginTop: 2 },
  driverPhone: { color: palette.muted, fontSize: 8, marginTop: 2 },
  assignButton: { borderRadius: 12, backgroundColor: '#F2F4F6', paddingHorizontal: 11, paddingVertical: 8 },
  assignButtonText: { color: palette.ink, fontSize: 9, fontWeight: '900' },
  driverPicker: { gap: 7, borderRadius: 15, backgroundColor: '#F7F8F9', padding: 10 },
  driverPickerTitle: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  driverOption: { borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E8EB', padding: 10, gap: 2 },
  driverOptionActive: { borderColor: '#E6B342', backgroundColor: '#FFFCF5' },
  driverOptionName: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  driverOptionMeta: { color: palette.muted, fontSize: 8 },
  noDriverText: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  stateCard: { alignItems: 'center', gap: 8, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.line, padding: 18 },
  stateText: { color: palette.muted, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  emptyTitle: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  errorCard: { gap: 6, borderRadius: 18, backgroundColor: palette.redSoft, padding: 15 },
  errorTitle: { color: '#8C1717', fontSize: 12, fontWeight: '900' },
  errorText: { color: '#A92020', fontSize: 10, lineHeight: 15 },
});
