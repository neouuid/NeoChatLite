import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar, Alert } from 'react-native';

import { AppNavigator } from './navigation/AppNavigator';
import { CallInviteModal } from './components';
import { useWebRTC, useWebSocket, useAuthStore, useUserStore } from '@neochat/shared';

const App: React.FC = () => {
  const { callState } = useWebRTC();
  const { isAuthenticated, user } = useAuthStore();
  const { addFriendRequest, addFriend } = useUserStore();
  const isCallModalVisible = callState.status === 'incoming' || callState.status === 'calling';

  // WebSocket 好友请求监听
  useWebSocket({
    onFriendRequest: (data) => {
      // 添加到好友请求列表
      addFriendRequest({
        id: data.user_id,
        user_id: user?.id || '',
        friend_id: data.user_id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        friend: {
          id: data.user_id,
          username: data.username,
          nickname: data.username,
          status: 'online',
          avatar: data.avatar,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
      // 显示通知
      Alert.alert('好友请求', `${data.username} 请求添加你为好友`);
    },
    onFriendAccepted: (data) => {
      // 添加到好友列表
      addFriend({
        id: data.user_id,
        user_id: user?.id || '',
        friend_id: data.user_id,
        status: 'accepted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        friend: {
          id: data.user_id,
          username: data.username,
          nickname: data.username,
          status: 'online',
          avatar: data.avatar,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
      // 显示通知
      Alert.alert('好友已添加', `${data.username} 已接受你的好友请求`);
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <AppNavigator />
          <CallInviteModal visible={isCallModalVisible} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
