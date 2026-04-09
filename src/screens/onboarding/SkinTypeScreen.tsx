import React, { useState } from 'react';
import {
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

type Props = NativeStackScreenProps<RootStackParamList, 'SkinType'>;

const SKIN_TYPES = [
  { id: 'Oily', icon: '💧', description: 'Excess shine, enlarged pores' },
  { id: 'Dry', icon: '🌵', description: 'Tight, flaky, needs hydration' },
  { id: 'Combination', icon: '⚖️', description: 'Oily T-zone, dry cheeks' },
  { id: 'Sensitive', icon: '🌸', description: 'Easily irritated, reactive' },
  { id: 'Normal', icon: '✨', description: 'Balanced, few concerns' },
];

export function SkinTypeScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const onContinue = async () => {
    if (!selected) return;
    await AsyncStorage.setItem('skin_type', selected);
    navigation.navigate('HairType');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What's your skin type?</Text>
        <Text style={styles.subtitle}>This helps us personalise every analysis</Text>
        <View style={styles.cards}>
          {SKIN_TYPES.map(item => {
            const isSelected = selected === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelected(item.id)}
                activeOpacity={0.75}>
                <Text style={styles.cardIcon}>{item.icon}</Text>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.id}</Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                </View>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={onContinue}
          disabled={!selected}
          activeOpacity={0.85}>
          <Text style={styles.buttonText}>Continue</Text>
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
    paddingTop: 32,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 28,
  },
  cards: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    padding: 16,
    gap: 14,
  },
  cardSelected: {
    backgroundColor: '#E8F5F0',
    borderColor: '#1D9E75',
    borderLeftWidth: 4,
  },
  cardIcon: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#8E8E93',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D9E75',
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
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
