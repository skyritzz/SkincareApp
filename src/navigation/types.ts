import type { AnalysisResult } from '../types/analysis';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  // Auth
  Login: undefined;
  SignUp: undefined;
  // Onboarding
  Welcome: undefined;
  SkinType: undefined;
  HairType: undefined;
  SkinConcerns: undefined;
  AllSet: undefined;
  // Main
  Home: undefined;
  Profile: undefined;
  History: undefined;
  Camera: { productType: string; category: string };
  QuickResults:
    | { photoPath: string; productType: string; category: string; result?: undefined }
    | { result: AnalysisResult; productType: string; category: string; photoPath?: undefined };
  IngredientBreakdown: { result: AnalysisResult; productType: string; category: string };
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type CameraScreenProps = NativeStackScreenProps<RootStackParamList, 'Camera'>;
export type QuickResultsScreenProps = NativeStackScreenProps<RootStackParamList, 'QuickResults'>;
export type IngredientBreakdownScreenProps = NativeStackScreenProps<RootStackParamList, 'IngredientBreakdown'>;
