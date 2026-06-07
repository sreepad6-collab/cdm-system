import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

export const connectWebSocket = (onAlert, onRefillStatus) => {
  stompClient = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log('WebSocket connected');
      stompClient.subscribe('/topic/alerts', (msg) => onAlert && onAlert(JSON.parse(msg.body)));
      stompClient.subscribe('/topic/refill-requests', (msg) => onAlert && onAlert(JSON.parse(msg.body)));
      stompClient.subscribe('/topic/refill-status', (msg) => onRefillStatus && onRefillStatus(JSON.parse(msg.body)));
    },
    onDisconnect: () => console.log('WebSocket disconnected'),
    onStompError: (f) => console.error('STOMP error', f),
  });
  stompClient.activate();
  return stompClient;
};

export const disconnectWebSocket = () => {
  if (stompClient) { stompClient.deactivate(); stompClient = null; }
};
