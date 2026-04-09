import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { isOnboardingComplete } from '../utils/userProfile';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { SkinTypeScreen } from '../screens/onboarding/SkinTypeScreen';
import { HairTypeScreen } from '../screens/onboarding/HairTypeScreen';
import { SkinConcernsScreen } from '../screens/onboarding/SkinConcernsScreen';
import { AllSetScreen } from '../screens/onboarding/AllSetScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { QuickResultsScreen } from '../screens/QuickResultsScreen';
import { IngredientBreakdownScreen } from '../screens/IngredientBreakdownScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const SCREEN_OPTIONS = {
  headerStyle: { backgroundColor: '#FFFFFF' },
  headerTintColor: '#1C1C1E',
  headerShadowVisible: false,
  headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
  contentStyle: { backgroundColor: '#FFFFFF' },
};

type InitialRoute = 'Login' | 'Welcome' | 'Home';

export function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setInitialRoute('Login');
        return;
      }
      const done = await isOnboardingComplete();
      setInitialRoute(done ? 'Home' : 'Welcome');
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setInitialRoute('Login');
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={SCREEN_OPTIONS}>
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        {/* Onboarding */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SkinType" component={SkinTypeScreen} options={{ title: 'Skin Type', headerBackTitle: 'Back' }} />
        <Stack.Screen name="HairType" component={HairTypeScreen} options={{ title: 'Hair Type', headerBackTitle: 'Back' }} />
        <Stack.Screen name="SkinConcerns" component={SkinConcernsScreen} options={{ title: 'Skin Concerns', headerBackTitle: 'Back' }} />
        <Stack.Screen name="AllSet" component={AllSetScreen} options={{ headerShown: false }} />
        {/* Main app */}
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Camera" component={CameraScreen} options={{ title: 'Scan label', headerBackTitle: 'Back' }} />
        <Stack.Screen name="QuickResults" component={QuickResultsScreen} options={{ title: 'Results', headerBackTitle: 'Back' }} />
        <Stack.Screen name="IngredientBreakdown" component={IngredientBreakdownScreen} options={{ title: 'Ingredient Breakdown', headerBackTitle: 'Results' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
