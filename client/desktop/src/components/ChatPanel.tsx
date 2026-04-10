import React from 'react';
import { View, StyleSheet } from 'react-native';

export const ChatPanel: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header} />

      {/* Messages */}
      <View style={styles.messagesContainer} />

      {/* Input */}
      <View style={styles.inputContainer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    flexDirection: 'column',
  },
  header: {
    height: 72,
    backgroundColor: '#ffffff',
  },
  messagesContainer: {
    flex: 1,
  },
  inputContainer: {
    height: 100,
    backgroundColor: '#ffffff',
  },
});
