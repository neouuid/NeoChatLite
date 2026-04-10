import React from 'react';
import { View, StyleSheet } from 'react-native';

export const Sidebar: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {/* User Avatar */}
        <View style={styles.avatar} />
        {/* Icons */}
        <View style={styles.icon} />
        <View style={styles.icon} />
        <View style={styles.icon} />
      </View>
      <View style={styles.bottomSection}>
        <View style={styles.icon} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 72,
    backgroundColor: '#131324',
    paddingVertical: 24,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSection: {
    gap: 16,
    alignItems: 'center',
  },
  bottomSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#252542',
  },
});
