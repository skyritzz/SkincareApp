/**
 * SkinScan — Skincare ingredient analyzer
 *
 * @format
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { ErrorBoundary } from './src/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <>
        <GestureHandlerRootView style={styles.root}>
          <SafeAreaProvider>
            <AppNavigator />
          </SafeAreaProvider>
        </GestureHandlerRootView>
        <Toast />
      </>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
