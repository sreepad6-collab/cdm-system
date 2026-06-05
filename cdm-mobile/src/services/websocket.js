import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = 'http://10.0.2.2:8080/ws';  // Change for physical device

let stompClient = null;
const subscribers = {};

export const connectWebSocket = (onAlert, onRefillStatus) => {
  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log('WebSocket connected');

      stompClient.subscribe('/topic/alerts', (message) => {
        const payload = JSON.parse(message.body);
        onAlert && onAlert(payload);
      });

      stompClient.subscribe('/topic/refill-requests', (message) => {
        const payload = JSON.parse(message.body);
        onAlert && onAlert(payload);
      });

      stompClient.subscribe('/topic/refill-status', (message) => {
        const payload = JSON.parse(message.body);
        onRefillStatus && onRefillStatus(payload);
      });
    },
    onDisconnect: () => console.log('WebSocket disconnected'),
    onStompError: (frame) => console.error('STOMP error', frame),
  });

  stompClient.activate();
  return stompClient;
};

export const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};
