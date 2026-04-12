import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { useAuthStore, COLORS } from '@neochat/shared';
import { LoginWindow } from './screens/LoginWindow';
import { RegisterWindow } from './screens/RegisterWindow';
import { MainWindow } from './screens/MainWindow';

type AuthView = 'login' | 'register';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [authView, setAuthView] = useState<AuthView>('login');

  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <View style={styles.container}>
      {!isAuthenticated ? (
        authView === 'login' ? (
          <LoginWindow onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <RegisterWindow onSwitchToLogin={() => setAuthView('login')} />
        )
      ) : (
        <MainWindow />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
});

export default App;
