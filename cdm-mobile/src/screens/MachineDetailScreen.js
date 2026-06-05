import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlertBanner from '../components/AlertBanner';
import { fetchMachine, fetchRecentTransactions, customerRefillRequest } from '../services/api';

const STATUS_LABEL = {
  ACTIVE: { label: 'Active — Cash Available', color: '#2e7d32', icon: 'checkmark-circle' },
  LOW_CASH: { label: 'Low Cash — Limited withdrawals', color: '#f57f17', icon: 'warning' },
  EMPTY: { label: 'Empty — No cash available', color: '#c62828', icon: 'close-circle' },
  REFILLING: { label: 'Refill in Progress', color: '#1565c0', icon: 'refresh-circle' },
  MAINTENANCE: { label: 'Under Maintenance', color: '#616161', icon: 'construct' },
};

export default function MachineDetailScreen({ route, navigation }) {
  const [machine, setMachine] = useState(route.params.machine);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerContact: '', remarks: '' });
  const [submitting, setSubmitting] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        fetchMachine(machine.machineCode),
        fetchRecentTransactions(machine.id),
      ]);
      setMachine(mRes.data.data);
      setTransactions(tRes.data.data);
    } catch (_) {}
  }, [machine.machineCode, machine.id]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleRefillRequest = async () => {
    if (!form.customerContact.trim()) {
      Alert.alert('Required', 'Please enter your mobile number or email.');
      return;
    }
    setSubmitting(true);
    try {
      await customerRefillRequest({
        machineCode: machine.machineCode,
        customerName: form.customerName,
        customerContact: form.customerContact,
        remarks: form.remarks || 'Customer reported low/no cash.',
      });
      setShowRefillModal(false);
      Alert.alert(
        'Request Sent',
        'Your request has been sent to the branch management. The machine will be refilled shortly. Thank you for your patience.',
        [{ text: 'OK' }]
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  const cfg = STATUS_LABEL[machine.status] || STATUS_LABEL.MAINTENANCE;
  const pct = Math.round((machine.currentBalance / machine.totalCapacity) * 100);
  const canRequestRefill = machine.status === 'EMPTY' || machine.status === 'LOW_CASH';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Status banner */}
      <View style={[styles.statusBanner, { backgroundColor: cfg.color }]}>
        <Ionicons name={cfg.icon} size={28} color="#fff" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.machineCode}>{machine.machineCode}</Text>
          <Text style={styles.statusLabel}>{cfg.label}</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Ionicons name="location" size={16} color="#666" />
        <Text style={styles.location}>{machine.location}</Text>
      </View>

      {/* Balance card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cash Status</Text>
        <Text style={styles.balanceAmount}>
          ₹{Number(machine.currentBalance).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.balanceCapacity}>
          of ₹{Number(machine.totalCapacity).toLocaleString('en-IN')} capacity
        </Text>

        <View style={styles.barBg}>
          <View style={[styles.barFill, {
            width: `${pct}%`,
            backgroundColor: pct > 40 ? '#2e7d32' : pct > 20 ? '#f57f17' : '#c62828',
          }]} />
        </View>
        <Text style={styles.pctText}>{pct}% remaining</Text>

        <View style={styles.thresholdRow}>
          <Ionicons name="alert-circle-outline" size={14} color="#888" />
          <Text style={styles.thresholdText}>
            Alert threshold: ₹{Number(machine.lowThreshold).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Status message for customer */}
      {machine.status === 'EMPTY' && (
        <View style={styles.alertCard}>
          <Ionicons name="information-circle" size={20} color="#c62828" />
          <Text style={styles.alertText}>
            This machine currently has no cash. Management has been automatically notified.
            You can also tap below to send an urgent request.
          </Text>
        </View>
      )}

      {machine.status === 'LOW_CASH' && (
        <View style={[styles.alertCard, { backgroundColor: '#fff8e1', borderColor: '#f9a825' }]}>
          <Ionicons name="warning" size={20} color="#f57f17" />
          <Text style={[styles.alertText, { color: '#5d4037' }]}>
            Cash is running low. Management has been alerted. Withdrawals may be limited.
          </Text>
        </View>
      )}

      {machine.status === 'REFILLING' && (
        <View style={[styles.alertCard, { backgroundColor: '#e3f2fd', borderColor: '#90caf9' }]}>
          <Ionicons name="refresh-circle" size={20} color="#1565c0" />
          <Text style={[styles.alertText, { color: '#0d47a1' }]}>
            Management is currently loading cash into this machine. Please check back shortly.
          </Text>
        </View>
      )}

      {/* Customer refill request button */}
      {canRequestRefill && (
        <TouchableOpacity
          style={styles.refillBtn}
          onPress={() => setShowRefillModal(true)}
        >
          <Ionicons name="notifications" size={20} color="#fff" />
          <Text style={styles.refillBtnText}>Request Cash Refill</Text>
        </TouchableOpacity>
      )}

      {/* Recent transactions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          transactions.map(txn => (
            <View key={txn.id} style={styles.txnRow}>
              <View style={[styles.txnIcon, {
                backgroundColor: txn.type === 'DEPOSIT' ? '#e8f5e9' : '#ffebee',
              }]}>
                <Ionicons
                  name={txn.type === 'DEPOSIT' ? 'arrow-down' : 'arrow-up'}
                  size={14}
                  color={txn.type === 'DEPOSIT' ? '#2e7d32' : '#c62828'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnType}>{txn.type}</Text>
                <Text style={styles.txnTime}>
                  {new Date(txn.timestamp).toLocaleString('en-IN')}
                </Text>
              </View>
              <Text style={[styles.txnAmount, {
                color: txn.type === 'DEPOSIT' ? '#2e7d32' : '#c62828',
              }]}>
                {txn.type === 'DEPOSIT' ? '+' : '-'}₹{Number(txn.amount).toLocaleString('en-IN')}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Refill Request Modal */}
      <Modal visible={showRefillModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Request Cash Refill</Text>
            <Text style={styles.modalSubtitle}>
              Your request will be sent directly to branch management.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Your Name (optional)"
              value={form.customerName}
              onChangeText={v => setForm(f => ({ ...f, customerName: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile / Email *"
              value={form.customerContact}
              onChangeText={v => setForm(f => ({ ...f, customerContact: v }))}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Additional remarks (optional)"
              value={form.remarks}
              onChangeText={v => setForm(f => ({ ...f, remarks: v }))}
              multiline
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowRefillModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleRefillRequest}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitBtnText}>Send Request</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, paddingTop: 32,
  },
  machineCode: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statusLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  section: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
  },
  location: { fontSize: 13, color: '#555', flex: 1 },
  card: {
    backgroundColor: '#fff', margin: 16, marginBottom: 0,
    borderRadius: 12, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: '#1a237e' },
  balanceCapacity: { fontSize: 13, color: '#888', marginBottom: 12 },
  barBg: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', borderRadius: 5 },
  pctText: { fontSize: 12, color: '#888', marginBottom: 8 },
  thresholdRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  thresholdText: { fontSize: 12, color: '#888' },
  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    margin: 16, marginBottom: 0, padding: 14,
    backgroundColor: '#ffebee', borderWidth: 1, borderColor: '#ef9a9a',
    borderRadius: 10,
  },
  alertText: { flex: 1, fontSize: 13, color: '#b71c1c', lineHeight: 19 },
  refillBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#e53935', margin: 16, marginBottom: 0,
    padding: 14, borderRadius: 10,
  },
  refillBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  txnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  txnIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txnType: { fontSize: 13, fontWeight: '600', color: '#333' },
  txnTime: { fontSize: 11, color: '#aaa' },
  txnAmount: { fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#aaa', textAlign: 'center', padding: 12 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a237e', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, fontSize: 14, marginBottom: 12,
  },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  submitBtn: {
    flex: 2, padding: 14, borderRadius: 8,
    backgroundColor: '#1a237e', alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
