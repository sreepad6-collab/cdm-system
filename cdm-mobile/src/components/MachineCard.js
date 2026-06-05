import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STATUS_CONFIG = {
  ACTIVE:      { color: '#2e7d32', bg: '#e8f5e9', icon: 'checkmark-circle',  label: 'Active' },
  LOW_CASH:    { color: '#f57f17', bg: '#fff8e1', icon: 'warning',            label: 'Low Cash' },
  EMPTY:       { color: '#c62828', bg: '#ffebee', icon: 'close-circle',       label: 'Empty' },
  REFILLING:   { color: '#1565c0', bg: '#e3f2fd', icon: 'refresh-circle',     label: 'Refilling' },
  MAINTENANCE: { color: '#616161', bg: '#f5f5f5', icon: 'construct',          label: 'Maintenance' },
};

export default function MachineCard({ machine, onPress }) {
  const cfg = STATUS_CONFIG[machine.status] || STATUS_CONFIG.MAINTENANCE;
  const pct = Math.round((machine.currentBalance / machine.totalCapacity) * 100);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <View>
          <Text style={styles.code}>{machine.machineCode}</Text>
          <Text style={styles.location} numberOfLines={1}>{machine.location}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={14} color={cfg.color} />
          <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balance}>₹{Number(machine.currentBalance).toLocaleString('en-IN')}</Text>
      </View>

      {/* Cash level bar */}
      <View style={styles.barBg}>
        <View style={[styles.barFill, {
          width: `${pct}%`,
          backgroundColor: pct > 40 ? '#2e7d32' : pct > 20 ? '#f57f17' : '#c62828',
        }]} />
      </View>
      <Text style={styles.pctText}>{pct}% of ₹{Number(machine.totalCapacity).toLocaleString('en-IN')} capacity</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  code: { fontSize: 16, fontWeight: '700', color: '#1a237e' },
  location: { fontSize: 12, color: '#666', marginTop: 2, maxWidth: 200 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  balanceLabel: { fontSize: 13, color: '#888' },
  balance: { fontSize: 15, fontWeight: '700', color: '#212121' },
  barBg: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', borderRadius: 4 },
  pctText: { fontSize: 11, color: '#888' },
});
