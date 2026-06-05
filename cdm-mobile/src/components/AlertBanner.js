import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AlertBanner({ alert }) {
  if (!alert) return null;

  const isUrgent = alert.alertType === 'EMPTY';

  return (
    <View style={[styles.banner, isUrgent ? styles.urgent : styles.warning]}>
      <Ionicons
        name={isUrgent ? 'alert-circle' : 'warning'}
        size={20}
        color={isUrgent ? '#fff' : '#212121'}
      />
      <Text style={[styles.text, isUrgent ? styles.urgentText : styles.warnText]}
            numberOfLines={2}>
        {alert.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  urgent: { backgroundColor: '#c62828' },
  warning: { backgroundColor: '#fff8e1', borderWidth: 1, borderColor: '#f9a825' },
  text: { flex: 1, fontSize: 13, fontWeight: '500' },
  urgentText: { color: '#fff' },
  warnText: { color: '#212121' },
});
