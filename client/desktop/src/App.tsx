import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useAuthStore } from '@neochat/shared';
import { LoginWindow } from './screens/LoginWindow';
import { MainWindow } from './screens/MainWindow';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <View style={styles.container}>
      {!isAuthenticated ? <LoginWindow /> : <MainWindow />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#131324',
  },
});

export default App;
