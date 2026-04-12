import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';

import { AppNavigator } from './navigation/AppNavigator';
import { CallInviteModal } from './components';
import { useWebRTC } from '@neochat/shared';

const App: React.FC = () => {
  const { callState } = useWebRTC();
  const isCallModalVisible = callState.status === 'incoming' || callState.status === 'calling';

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
