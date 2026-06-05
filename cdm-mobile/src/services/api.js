import axios from 'axios';
import { Platform } from 'react-native';

// Web (Chrome) uses localhost; Android emulator uses 10.0.2.2
const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:8080/api'
    : 'http://10.0.2.2:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Machines ──────────────────────────────────────────────────────────────
export const fetchMachines = () => api.get('/machines');
export const fetchMachine = (code) => api.get(`/machines/${code}`);

// ── Transactions ──────────────────────────────────────────────────────────
export const processTransaction = (data) => api.post('/transactions', data);
export const fetchRecentTransactions = (machineId) =>
  api.get(`/transactions/machine/${machineId}/recent`);

// ── Alerts ────────────────────────────────────────────────────────────────
export const fetchAllAlerts = () => api.get('/alerts');
export const fetchPendingAlerts = () => api.get('/alerts/pending');
export const acknowledgeAlert = (id, handledBy) =>
  api.patch(`/alerts/${id}/acknowledge?handledBy=${encodeURIComponent(handledBy)}`);
export const resolveAlert = (id, handledBy) =>
  api.patch(`/alerts/${id}/resolve?handledBy=${encodeURIComponent(handledBy)}`);

// ── Refill Requests ────────────────────────────────────────────────────────
export const fetchOpenRefillRequests = () => api.get('/refill-requests');
export const customerRefillRequest = (data) => api.post('/refill-requests/customer', data);
export const updateRefillStatus = (id, status, handledBy) =>
  api.patch(`/refill-requests/${id}/status?status=${status}&handledBy=${encodeURIComponent(handledBy)}`);
export const completeCashLoad = (machineId, amount, handledBy) =>
  api.post(`/machines/${machineId}/complete-refill`, { amount, handledBy });

export default api;
