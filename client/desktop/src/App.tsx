import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar, Alert, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { AppNavigator } from './navigation/AppNavigator';
import { CallInviteModal } from './components';
import { useWebRTC, useWebSocket, useAuth, useAuthStore, useUserStore, COLORS, SPACING, TYPOGRAPHY } from 'neochat-shared';

const App: React.FC = () => {
  const { callState } = useWebRTC();
  const { isLoading: isAuthLoading } = useAuth();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const { addFriendRequest, addFriend } = useUserStore();
  const isCallModalVisible = callState.status === 'incoming' || callState.status === 'calling';

  // Loading screen component
  const LoadingScreen = () => (
    <View style={loadingStyles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={loadingStyles.text}>加载�?..</Text>
    </View>
  );

  // WebSocket 好友请求监听
  useWebSocket({
    onFriendRequest: (data) => {
      // 添加到好友请求列�?
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
      // 添加到好友列�?
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
      Alert.alert('好友已添�?, `${data.username} 已接受你的好友请求`);
    },
  });

  // Show loading screen while auth is initializing
  if (isLoading || isAuthLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LoadingScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

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

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  text: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
});

export default App;
