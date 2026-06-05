import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchAllAlerts, acknowledgeAlert, resolveAlert,
  fetchOpenRefillRequests, updateRefillStatus, completeCashLoad,
  fetchMachines,
} from '../services/api';
import { connectWebSocket, disconnectWebSocket } from '../services/websocket';

const TAB = { ALERTS: 'Alerts', REFILLS: 'Refills', MACHINES: 'Machines' };

export default function ManagementDashboardScreen() {
  const [tab, setTab] = useState(TAB.ALERTS);
  const [alerts, setAlerts] = useState([]);
  const [refills, setRefills] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refill modal state
  const [refillModal, setRefillModal] = useState({ visible: false, machine: null });
  const [loadAmount, setLoadAmount] = useState('');
  const [handledBy, setHandledBy] = useState('Branch Manager');
  const [submitting, setSubmitting] = useState(false);

  // Live websocket notification banner
  const [liveAlert, setLiveAlert] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [aRes, rRes, mRes] = await Promise.all([
        fetchAllAlerts(),
        fetchOpenRefillRequests(),
        fetchMachines(),
      ]);
      setAlerts(aRes.data.data);
      setRefills(rRes.data.data);
      setMachines(mRes.data.data);
    } catch (_) {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();

    // WebSocket: real-time push from CDM machine
    const ws = connectWebSocket(
      (payload) => {
        setLiveAlert(payload);
        setTimeout(() => setLiveAlert(null), 5000);
        loadAll(); // refresh lists
      },
      (payload) => {
        loadAll();
      }
    );

    return () => disconnectWebSocket();
  }, [loadAll]);

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId, handledBy);
      loadAll();
    } catch (e) {
      Alert.alert('Error', 'Failed to acknowledge alert.');
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await resolveAlert(alertId, handledBy);
      loadAll();
    } catch (e) {
      Alert.alert('Error', 'Failed to resolve alert.');
    }
  };

  const handleRefillStatusUpdate = async (refillId, status) => {
    try {
      await updateRefillStatus(refillId, status, handledBy);
      loadAll();
    } catch (e) {
      Alert.alert('Error', 'Status update failed.');
    }
  };

  const openRefillModal = (machine) => {
    setRefillModal({ visible: true, machine });
    setLoadAmount('');
  };

  const handleCashLoad = async () => {
    const amt = parseFloat(loadAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount.');
      return;
    }
    setSubmitting(true);
    try {
      await completeCashLoad(refillModal.machine.id, amt, handledBy);
      setRefillModal({ visible: false, machine: null });
      loadAll();
      Alert.alert('Success', `₹${amt.toLocaleString('en-IN')} loaded successfully. Machine is now ACTIVE.`);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to complete refill.');
    } finally {
      setSubmitting(false);
    }
  };

  const ALERT_STATUS_COLOR = { PENDING: '#c62828', ACKNOWLEDGED: '#f57f17', RESOLVED: '#2e7d32' };

  const renderAlert = ({ item }) => (
    <View style={styles.listCard}>
      <View style={styles.listCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listCardTitle}>
            {item.alertType === 'EMPTY' ? '🔴' : '🟡'} {item.machine?.machineCode}
          </Text>
          <Text style={styles.listCardSub}>{item.machine?.location}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: ALERT_STATUS_COLOR[item.status] + '22' }]}>
          <Text style={[styles.statusChipText, { color: ALERT_STATUS_COLOR[item.status] }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.alertMsg}>{item.message}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.createdAt).toLocaleString('en-IN')}
      </Text>
      {item.status === 'PENDING' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#1565c0' }]}
            onPress={() => handleAcknowledge(item.id)}
          >
            <Ionicons name="eye" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Acknowledge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#2e7d32' }]}
            onPress={() => handleResolve(item.id)}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Resolve</Text>
          </TouchableOpacity>
        </View>
      )}
      {item.status === 'ACKNOWLEDGED' && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#2e7d32', alignSelf: 'flex-start' }]}
          onPress={() => handleResolve(item.id)}
        >
          <Ionicons name="checkmark-done" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Mark Resolved</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRefill = ({ item }) => (
    <View style={styles.listCard}>
      <View style={styles.listCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listCardTitle}>
            {item.requestedBy === 'SYSTEM' ? '🤖 Auto' : '👤 Customer'} — {item.machine?.machineCode}
          </Text>
          <Text style={styles.listCardSub}>{item.machine?.location}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: '#1a237e22' }]}>
          <Text style={[styles.statusChipText, { color: '#1a237e' }]}>{item.status}</Text>
        </View>
      </View>
      {item.customerName && <Text style={styles.alertMsg}>By: {item.customerName} ({item.customerContact})</Text>}
      {item.requestedAmount && (
        <Text style={styles.alertMsg}>
          Requested: ₹{Number(item.requestedAmount).toLocaleString('en-IN')}
        </Text>
      )}
      <Text style={styles.alertMsg}>{item.remarks}</Text>
      <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleString('en-IN')}</Text>

      {item.status === 'OPEN' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#1565c0' }]}
            onPress={() => handleRefillStatusUpdate(item.id, 'IN_PROGRESS')}
          >
            <Ionicons name="car" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Start Refill</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderMachine = ({ item }) => (
    <View style={styles.listCard}>
      <View style={styles.listCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listCardTitle}>{item.machineCode}</Text>
          <Text style={styles.listCardSub}>{item.location}</Text>
        </View>
        <Text style={[styles.statusChipText, {
          color: item.status === 'ACTIVE' ? '#2e7d32' :
                 item.status === 'EMPTY' ? '#c62828' : '#f57f17',
        }]}>{item.status}</Text>
      </View>
      <Text style={styles.alertMsg}>
        Balance: ₹{Number(item.currentBalance).toLocaleString('en-IN')} / ₹{Number(item.totalCapacity).toLocaleString('en-IN')}
      </Text>
      {(item.status === 'EMPTY' || item.status === 'LOW_CASH' || item.status === 'REFILLING') && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#1a237e', marginTop: 8, alignSelf: 'flex-start' }]}
          onPress={() => openRefillModal(item)}
        >
          <Ionicons name="cash" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Load Cash</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const pendingCount = alerts.filter(a => a.status === 'PENDING').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Management Dashboard</Text>
        <Text style={styles.headerSub}>
          {pendingCount > 0 ? `⚠ ${pendingCount} pending alert(s)` : '✓ All clear'}
        </Text>
      </View>

      {/* Live WebSocket notification */}
      {liveAlert && (
        <View style={styles.liveBanner}>
          <Ionicons name="notifications" size={16} color="#fff" />
          <Text style={styles.liveBannerText} numberOfLines={2}>
            🔔 {liveAlert.message || `Alert from ${liveAlert.machineCode}`}
          </Text>
        </View>
      )}

      {/* Manager name input */}
      <View style={styles.managerRow}>
        <Ionicons name="person" size={14} color="#888" />
        <TextInput
          style={styles.managerInput}
          value={handledBy}
          onChangeText={setHandledBy}
          placeholder="Your name"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {Object.values(TAB).map(t => (
          <TouchableOpacity
            key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t}{t === TAB.ALERTS && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a237e" />
        </View>
      ) : (
        <FlatList
          data={tab === TAB.ALERTS ? alerts : tab === TAB.REFILLS ? refills : machines}
          keyExtractor={i => i.id.toString()}
          renderItem={tab === TAB.ALERTS ? renderAlert : tab === TAB.REFILLS ? renderRefill : renderMachine}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-done-circle" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {tab === TAB.ALERTS ? 'No alerts' : tab === TAB.REFILLS ? 'No open refill requests' : 'No machines'}
              </Text>
            </View>
          }
        />
      )}

      {/* Cash Load Modal */}
      <Modal visible={refillModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Load Cash</Text>
            <Text style={styles.modalSub}>
              {refillModal.machine?.machineCode} — {refillModal.machine?.location}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Amount to load (₹)"
              keyboardType="numeric"
              value={loadAmount}
              onChangeText={setLoadAmount}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRefillModal({ visible: false, machine: null })}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCashLoad} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitBtnText}>Confirm Load</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  header: {
    backgroundColor: '#1a237e', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: '#c5cae9', fontSize: 13, marginTop: 2 },
  liveBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#e53935', padding: 10, paddingHorizontal: 16,
  },
  liveBannerText: { color: '#fff', fontSize: 13, flex: 1 },
  managerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  managerInput: { flex: 1, fontSize: 13, color: '#333' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#1a237e' },
  tabBtnText: { fontSize: 13, color: '#888', fontWeight: '500' },
  tabBtnTextActive: { color: '#1a237e', fontWeight: '700' },
  listCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    marginBottom: 10, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 3,
  },
  listCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  listCardTitle: { fontSize: 14, fontWeight: '700', color: '#212121' },
  listCardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusChipText: { fontSize: 11, fontWeight: '700' },
  alertMsg: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 4 },
  timestamp: { fontSize: 11, color: '#aaa', marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyText: { color: '#aaa', marginTop: 12, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a237e', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#888', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, fontSize: 14, marginBottom: 12,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  submitBtn: { flex: 2, padding: 14, borderRadius: 8, backgroundColor: '#1a237e', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
