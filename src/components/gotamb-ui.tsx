import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const palette = {
  ink: '#17202A',
  muted: '#687386',
  background: '#F5F6F8',
  surface: '#FFFFFF',
  line: '#E5E8ED',
  brand: '#F59E0B',
  brandDark: '#B45309',
  brandSoft: '#FFF7E6',
  green: '#16855B',
  greenSoft: '#E9F8F1',
  blue: '#2563EB',
  blueSoft: '#EEF4FF',
  red: '#DC2626',
  redSoft: '#FFF0F0',
  purple: '#7C3AED',
  purpleSoft: '#F4EEFF',
} as const;

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={[styles.brandIcon, compact && styles.brandIconCompact]}>
        <Text style={[styles.brandIconText, compact && styles.brandIconTextCompact]}>gT</Text>
      </View>
      <Text selectable style={[styles.brandText, compact && styles.brandTextCompact]}>
        <Text style={{ color: palette.ink }}>go</Text>
        <Text style={{ color: palette.brandDark }}>Tamb</Text>
      </Text>
    </View>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text selectable style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text selectable style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text selectable style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  note,
  tone = 'brand',
}: {
  label: string;
  value: string;
  note?: string;
  tone?: 'brand' | 'green' | 'blue' | 'purple';
}) {
  const toneMap = {
    brand: [palette.brandSoft, palette.brandDark],
    green: [palette.greenSoft, palette.green],
    blue: [palette.blueSoft, palette.blue],
    purple: [palette.purpleSoft, palette.purple],
  } as const;
  const [backgroundColor, color] = toneMap[tone];

  return (
    <View style={[styles.metricCard, { backgroundColor }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text selectable style={[styles.metricValue, { color }]}>{value}</Text>
      {note ? <Text selectable style={styles.metricNote}>{note}</Text> : null}
    </View>
  );
}

export function ActionTile({
  symbol,
  label,
  description,
  onPress,
  tone = 'brand',
}: {
  symbol: string;
  label: string;
  description: string;
  onPress: () => void;
  tone?: 'brand' | 'green' | 'blue' | 'purple';
}) {
  const toneMap = {
    brand: [palette.brandSoft, palette.brandDark],
    green: [palette.greenSoft, palette.green],
    blue: [palette.blueSoft, palette.blue],
    purple: [palette.purpleSoft, palette.purple],
  } as const;
  const [backgroundColor, color] = toneMap[tone];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.actionTile, pressed && styles.pressed]}>
      <View style={[styles.actionSymbol, { backgroundColor }]}>
        <Text style={[styles.actionSymbolText, { color }]}>{symbol}</Text>
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text numberOfLines={2} style={styles.actionDescription}>{description}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export function StatusChip({
  label,
  tone = 'brand',
}: {
  label: string;
  tone?: 'brand' | 'green' | 'blue' | 'red' | 'neutral';
}) {
  const toneMap = {
    brand: [palette.brandSoft, palette.brandDark],
    green: [palette.greenSoft, palette.green],
    blue: [palette.blueSoft, palette.blue],
    red: [palette.redSoft, palette.red],
    neutral: ['#F0F2F5', '#556070'],
  } as const;
  const [backgroundColor, color] = toneMap[tone];

  return (
    <View style={[styles.statusChip, { backgroundColor }]}>
      <Text style={[styles.statusChipText, { color }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

type NavItem = {
  key: string;
  symbol: string;
  label: string;
  onPress: () => void;
};

export function BottomNav({ activeKey, items }: { activeKey: string; items: NavItem[] }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={item.onPress}
            style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
            <View style={[styles.navIcon, active && styles.navIconActive]}>
              <Text style={[styles.navSymbol, active && styles.navSymbolActive]}>{item.symbol}</Text>
            </View>
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  brandIconCompact: { width: 38, height: 38, borderRadius: 12 },
  brandIconText: { color: '#3B2A04', fontSize: 16, fontWeight: '900', letterSpacing: -1 },
  brandIconTextCompact: { fontSize: 14 },
  brandText: { fontSize: 29, fontWeight: '900', letterSpacing: -1.1 },
  brandTextCompact: { fontSize: 23 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1, gap: 4 },
  eyebrow: { color: palette.brandDark, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  headerTitle: { color: palette.ink, fontSize: 27, lineHeight: 32, fontWeight: '800', letterSpacing: -0.7 },
  headerSubtitle: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: '800' },
  sectionAction: { color: palette.brandDark, fontSize: 13, fontWeight: '800' },
  metricCard: { flex: 1, minWidth: 140, minHeight: 112, borderRadius: 20, padding: 16, gap: 6, borderCurve: 'continuous' },
  metricLabel: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  metricValue: { fontSize: 25, fontWeight: '900', letterSpacing: -0.7, fontVariant: ['tabular-nums'] },
  metricNote: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  actionTile: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: palette.line, borderCurve: 'continuous' },
  actionSymbol: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  actionSymbolText: { fontSize: 20, fontWeight: '900' },
  actionCopy: { flex: 1, gap: 2 },
  actionLabel: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  actionDescription: { color: palette.muted, fontSize: 12, lineHeight: 17 },
  chevron: { color: '#9AA2AE', fontSize: 28, lineHeight: 30 },
  statusChip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusChipText: { fontSize: 11, fontWeight: '800' },
  primaryButton: { minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.ink, paddingHorizontal: 18, borderCurve: 'continuous' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.45 },
  bottomNav: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: 'rgba(255,255,255,0.98)', paddingTop: 8, paddingHorizontal: 8 },
  navItem: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navIcon: { minWidth: 34, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: palette.brandSoft },
  navSymbol: { color: '#8A94A2', fontSize: 17, fontWeight: '800' },
  navSymbolActive: { color: palette.brandDark },
  navLabel: { color: '#8A94A2', fontSize: 10, fontWeight: '700' },
  navLabelActive: { color: palette.ink, fontWeight: '900' },
});
