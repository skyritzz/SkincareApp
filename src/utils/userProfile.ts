import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  skinType: string | null;
  hairTypes: string[];
  skinConcerns: string[];
}

export async function getUserProfile(): Promise<UserProfile> {
  const [skinType, hairTypesRaw, skinConcernsRaw] = await Promise.all([
    AsyncStorage.getItem('skin_type'),
    AsyncStorage.getItem('hair_types'),
    AsyncStorage.getItem('skin_concerns'),
  ]);
  return {
    skinType,
    hairTypes: hairTypesRaw ? (JSON.parse(hairTypesRaw) as string[]) : [],
    skinConcerns: skinConcernsRaw ? (JSON.parse(skinConcernsRaw) as string[]) : [],
  };
}

export async function isOnboardingComplete(): Promise<boolean> {
  const val = await AsyncStorage.getItem('onboarding_complete');
  return val === 'true';
}
