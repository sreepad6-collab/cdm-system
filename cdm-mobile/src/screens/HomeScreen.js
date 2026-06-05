import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MachineCard from '../components/MachineCard';
import { fetchMachines } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadMachines = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchMachines();
      setMachines(res.data.data);
    } catch (e) {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMachines();
    // Poll every 30 seconds for live balance updates
    const interval = setInterval(loadMachines, 30000);
    return () => clearInterval(interval);
  }, [loadMachines]);

  const alertCount = machines.filter(
    m => m.status === 'EMPTY' || m.status === 'LOW_CASH'
  ).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading CDM Machines...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>CDM Dashboard</Text>
          <Text style={styles.subtitle}>{machines.length} machines • {alertCount} need attention</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Management')} style={styles.mgmtBtn}>
          <Ionicons name="settings" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <SummaryChip
          label="Active"
          count={machines.filter(m => m.status === 'ACTIVE').length}
          color="#2e7d32" bg="#e8f5e9"
        />
        <SummaryChip
          label="Low Cash"
          count={machines.filter(m => m.status === 'LOW_CASH').length}
          color="#f57f17" bg="#fff8e1"
        />
        <SummaryChip
          label="Empty"
          count={machines.filter(m => m.status === 'EMPTY').length}
          color="#c62828" bg="#ffebee"
        />
        <SummaryChip
          label="Refilling"
          count={machines.filter(m => m.status === 'REFILLING').length}
          color="#1565c0" bg="#e3f2fd"
        />
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="wifi-off" size={16} color="#c62828" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={machines}
        keyExtractor={m => m.id.toString()}
        renderItem={({ item }) => (
          <MachineCard
            machine={item}
            onPress={() => navigation.navigate('MachineDetail', { machine: item })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMachines(); }} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="hardware-chip-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No machines registered</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

function SummaryChip({ label, count, color, bg }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipCount, { color }]}>{count}</Text>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#888', fontSize: 14 },
  header: {
    backgroundColor: '#1a237e',
    paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#c5cae9', fontSize: 13, marginTop: 2 },
  mgmtBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 6,
  },
  chip: {
    flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center',
  },
  chipCount: { fontSize: 18, fontWeight: '800' },
  chipLabel: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ffebee', marginHorizontal: 16, marginBottom: 8,
    padding: 10, borderRadius: 8,
  },
  errorText: { color: '#c62828', fontSize: 13 },
  emptyText: { color: '#aaa', marginTop: 12, fontSize: 15 },
});
