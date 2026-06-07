import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const fetchMachines = () => api.get('/machines');
export const fetchMachine = (code) => api.get(`/machines/${code}`);
export const processTransaction = (data) => api.post('/transactions', data);
export const fetchAllAlerts = () => api.get('/alerts');
export const fetchPendingAlerts = () => api.get('/alerts/pending');
export const acknowledgeAlert = (id, handledBy) => api.patch(`/alerts/${id}/acknowledge?handledBy=${encodeURIComponent(handledBy)}`);
export const resolveAlert = (id, handledBy) => api.patch(`/alerts/${id}/resolve?handledBy=${encodeURIComponent(handledBy)}`);
export const fetchOpenRefillRequests = () => api.get('/refill-requests');
export const customerRefillRequest = (data) => api.post('/refill-requests/customer', data);
export const updateRefillStatus = (id, status, handledBy) => api.patch(`/refill-requests/${id}/status?status=${status}&handledBy=${encodeURIComponent(handledBy)}`);
export const completeCashLoad = (machineId, amount, handledBy) => api.post(`/machines/${machineId}/complete-refill`, { amount, handledBy });

export default api;
