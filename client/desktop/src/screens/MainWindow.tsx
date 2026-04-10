import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Sidebar } from '../components/Sidebar';
import { ChatListPanel } from '../components/ChatListPanel';
import { ChatPanel } from '../components/ChatPanel';

export const MainWindow: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 左侧图标栏 */}
      <Sidebar />

      {/* 中间聊天列表 */}
      <ChatListPanel />

      {/* 右侧聊天区域 */}
      <ChatPanel />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
});
