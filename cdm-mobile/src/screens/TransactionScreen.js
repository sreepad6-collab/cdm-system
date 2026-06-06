import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchMachines, processTransaction } from '../services/api';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export default function TransactionScreen() {
  const [machines, setMachines] = useState([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [txnType, setTxnType] = useState('WITHDRAWAL');
  const [amount, setAmount] = useState('');
  const [customerRef, setCustomerRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchMachines()
      .then(res => {
        setMachines(res.data.data);
        if (res.data.data.length > 0) setSelectedCode(res.data.data[0].machineCode);
      })
      .finally(() => setLoadingMachines(false));
  }, []);

  const selectedMachine = machines.find(m => m.machineCode === selectedCode);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Invalid', 'Please enter a valid amount.'); return; }
    if (!selectedCode) { Alert.alert('Required', 'Please select a machine.'); return; }

    setLoading(true);
    setResult(null);
    try {
      const res = await processTransaction({
        machineCode: selectedCode,
        type: txnType,
        amount: amt,
        customerReference: customerRef || undefined,
      });
      setResult({ success: true, txn: res.data.data });
      setAmount('');
      setCustomerRef('');
      // Refresh machine balance
      const mRes = await fetchMachines();
      setMachines(mRes.data.data);
    } catch (e) {
      const msg = e.response?.data?.message || 'Transaction failed. Please try again.';
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (n) => Number(n).toLocaleString('en-IN');

  if (loadingMachines) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading machines...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Process Transaction</Text>
          <Text style={styles.headerSub}>Deposit or withdraw cash</Text>
        </View>

        {/* Transaction type toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, txnType === 'WITHDRAWAL' && styles.typeBtnWithdraw]}
            onPress={() => setTxnType('WITHDRAWAL')}
          >
            <Ionicons name="arrow-up-circle" size={18} color={txnType === 'WITHDRAWAL' ? '#fff' : '#c62828'} />
            <Text style={[styles.typeBtnText, txnType === 'WITHDRAWAL' && { color: '#fff' }]}>
              Withdrawal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, txnType === 'DEPOSIT' && styles.typeBtnDeposit]}
            onPress={() => setTxnType('DEPOSIT')}
          >
            <Ionicons name="arrow-down-circle" size={18} color={txnType === 'DEPOSIT' ? '#fff' : '#2e7d32'} />
            <Text style={[styles.typeBtnText, txnType === 'DEPOSIT' && { color: '#fff' }]}>
              Deposit
            </Text>
          </TouchableOpacity>
        </View>

        {/* Machine selector */}
        <View style={styles.card}>
          <Text style={styles.label}>Select CDM Machine</Text>
          <View style={styles.machineList}>
            {machines.map(m => (
              <TouchableOpacity
                key={m.machineCode}
                style={[styles.machineOption, selectedCode === m.machineCode && styles.machineOptionActive]}
                onPress={() => setSelectedCode(m.machineCode)}
              >
                <Text style={[styles.machineOptionCode, selectedCode === m.machineCode && { color: '#fff' }]}>
                  {m.machineCode}
                </Text>
                <Text style={[styles.machineOptionLoc, selectedCode === m.machineCode && { color: '#c5cae9' }]}>
                  {m.location}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Machine balance preview */}
          {selectedMachine && (
            <View style={[styles.balancePreview, {
              backgroundColor:
                selectedMachine.status === 'ACTIVE' ? '#e8f5e9' :
                selectedMachine.status === 'LOW_CASH' ? '#fff8e1' : '#ffebee',
            }]}>
              <Text style={styles.balancePreviewLabel}>Available Cash</Text>
              <Text style={[styles.balancePreviewAmt, {
                color: selectedMachine.status === 'ACTIVE' ? '#2e7d32' :
                       selectedMachine.status === 'LOW_CASH' ? '#f57f17' : '#c62828',
              }]}>
                ₹{formatINR(selectedMachine.currentBalance)}
              </Text>
              <Text style={styles.balancePreviewStatus}>{selectedMachine.status}</Text>
            </View>
          )}
        </View>

        {/* Amount input */}
        <View style={styles.card}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Enter amount"
            placeholderTextColor="#bbb"
          />

          {/* Quick select */}
          <Text style={[styles.label, { marginBottom: 8 }]}>Quick Select</Text>
          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map(qa => (
              <TouchableOpacity
                key={qa}
                style={[styles.quickBtn, amount === qa.toString() && styles.quickBtnActive]}
                onPress={() => setAmount(qa.toString())}
              >
                <Text style={[styles.quickBtnText, amount === qa.toString() && { color: '#fff' }]}>
                  ₹{formatINR(qa)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Customer reference */}
        <View style={styles.card}>
          <Text style={styles.label}>Account / Card Reference (optional)</Text>
          <TextInput
            style={styles.input}
            value={customerRef}
            onChangeText={setCustomerRef}
            placeholder="e.g. XXXX1234"
            placeholderTextColor="#bbb"
          />
        </View>

        {/* Result banner */}
        {result && (
          <View style={[styles.resultCard, {
            backgroundColor: result.success ? '#e8f5e9' : '#ffebee',
            borderColor: result.success ? '#81c784' : '#ef9a9a',
          }]}>
            <Ionicons
              name={result.success ? 'checkmark-circle' : 'close-circle'}
              size={22}
              color={result.success ? '#2e7d32' : '#c62828'}
            />
            {result.success ? (
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultText, { color: '#2e7d32' }]}>
                  Transaction Successful
                </Text>
                <Text style={styles.resultSub}>
                  {result.txn.type} of ₹{formatINR(result.txn.amount)}
                </Text>
                <Text style={styles.resultSub}>
                  New balance: ₹{formatINR(result.txn.balanceAfter)}
                </Text>
              </View>
            ) : (
              <Text style={[styles.resultText, { color: '#c62828', flex: 1 }]}>
                {result.message}
              </Text>
            )}
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Ionicons
                  name={txnType === 'WITHDRAWAL' ? 'arrow-up' : 'arrow-down'}
                  size={18} color="#fff"
                />
                <Text style={styles.submitBtnText}>
                  {txnType === 'WITHDRAWAL' ? 'Withdraw Cash' : 'Deposit Cash'}
                </Text>
              </>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#888' },
  header: {
    backgroundColor: '#1a237e', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: '#c5cae9', fontSize: 13, marginTop: 2 },

  typeToggle: {
    flexDirection: 'row', margin: 16, gap: 10,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 10, paddingVertical: 12,
    borderWidth: 1.5, borderColor: '#e0e0e0', backgroundColor: '#fff',
  },
  typeBtnWithdraw: { backgroundColor: '#c62828', borderColor: '#c62828' },
  typeBtnDeposit: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  typeBtnText: { fontWeight: '700', fontSize: 14, color: '#555' },

  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 12, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 3,
  },
  label: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 6, textTransform: 'uppercase' },
  machineList: { gap: 8 },
  machineOption: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10,
    padding: 12, backgroundColor: '#fafafa',
  },
  machineOptionActive: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
  machineOptionCode: { fontSize: 14, fontWeight: '700', color: '#1a237e' },
  machineOptionLoc: { fontSize: 12, color: '#888', marginTop: 2 },
  balancePreview: {
    marginTop: 12, padding: 12, borderRadius: 8, alignItems: 'center',
  },
  balancePreviewLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  balancePreviewAmt: { fontSize: 24, fontWeight: '800' },
  balancePreviewStatus: { fontSize: 11, color: '#888', marginTop: 2 },

  amountInput: {
    fontSize: 28, fontWeight: '800', color: '#1a237e',
    borderBottomWidth: 2, borderBottomColor: '#1a237e',
    paddingVertical: 8, marginBottom: 16, textAlign: 'center',
  },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f9f9f9',
  },
  quickBtnActive: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
  quickBtnText: { fontSize: 12, fontWeight: '600', color: '#555' },

  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, fontSize: 14, color: '#333',
  },

  resultCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, marginBottom: 12, padding: 14,
    borderRadius: 10, borderWidth: 1,
  },
  resultText: { fontSize: 14, fontWeight: '700' },
  resultSub: { fontSize: 12, color: '#555', marginTop: 2 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1a237e', marginHorizontal: 16, padding: 16, borderRadius: 12,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
