import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AllSet'>;

export function AllSetScreen({ navigation }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const [skinType, setSkinType] = useState<string | null>(null);
  const [hairTypes, setHairTypes] = useState<string[]>([]);
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.18,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    (async () => {
      const [st, ht, sc] = await Promise.all([
        AsyncStorage.getItem('skin_type'),
        AsyncStorage.getItem('hair_types'),
        AsyncStorage.getItem('skin_concerns'),
      ]);
      setSkinType(st);
      setHairTypes(ht ? (JSON.parse(ht) as string[]) : []);
      setSkinConcerns(sc ? (JSON.parse(sc) as string[]) : []);
    })();
  }, []);

  const onStart = useCallback(async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Animated.Text style={[styles.icon, { transform: [{ scale: pulse }] }]}>
            ✦
          </Animated.Text>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>Your analyses will now be personalised</Text>
        </View>

        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Skin type</Text>
            <Text style={styles.summaryCardValue}>{skinType ?? '—'}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Hair type</Text>
            <Text style={styles.summaryCardValue}>
              {hairTypes.length > 0 ? hairTypes.join(', ') : '—'}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Skin concerns</Text>
            <Text style={styles.summaryCardValue}>
              {skinConcerns.length > 0 ? skinConcerns.join(', ') : '—'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={onStart}
          activeOpacity={0.85}>
          <Text style={styles.buttonText}>Start Scanning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  icon: {
    fontSize: 52,
    color: '#1D9E75',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
  summaryCards: {
    gap: 10,
  },
  summaryCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  summaryCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  summaryCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
  },
  button: {
    height: 54,
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
