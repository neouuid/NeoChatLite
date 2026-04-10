import React from 'react';
import { View, StyleSheet } from 'react-native';

export const ChatListPanel: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBar} />
      </View>

      {/* Chat List */}
      <View style={styles.list}>
        <View style={styles.chatItem} />
        <View style={styles.chatItem} />
        <View style={[styles.chatItem, styles.chatItemActive]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 320,
    backgroundColor: '#1a1a2e',
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 12,
  },
  searchBar: {
    height: 44,
    backgroundColor: '#252542',
    borderRadius: 10,
  },
  list: {
    flex: 1,
    gap: 8,
  },
  chatItem: {
    height: 70,
    backgroundColor: '#252542',
    borderRadius: 12,
  },
  chatItemActive: {
    backgroundColor: '#6366f120',
  },
});
