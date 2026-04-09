import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { analyzeIngredientPhoto, saveScan, resetApiLimit } from '../services/claudeService';
import { getUserProfile } from '../utils/userProfile';
import type { AnalysisResult } from '../types/analysis';
import type { UserProfile } from '../utils/userProfile';
import type { QuickResultsScreenProps } from '../navigation/types';

const GREEN = '#34C759';
const YELLOW = '#FF9500';
const RED = '#FF3B30';
const BG = '#FFFFFF';
const PRIMARY_TEXT = '#1C1C1E';
const SECONDARY_TEXT = '#8E8E93';
const CARD_BG = '#F2F2F7';

function scoreColor(score: number): string {
  if (score >= 7) return GREEN;
  if (score >= 4) return YELLOW;
  return RED;
}

function defaultVerdict(score: number): string {
  if (score >= 8) return 'Great choice for your skin';
  if (score >= 7) return 'Good choice with minor concerns';
  if (score >= 4) return 'Use with caution';
  return 'Potentially harmful ingredients found';
}

function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <View style={[styles.gaugeOuter, { borderColor: color }]}>
      <Text style={[styles.gaugeScore, { color }]}>{score}</Text>
      <Text style={styles.gaugeOutOf}>/10</Text>
    </View>
  );
}

function StatPill({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statPillCount, { color }]}>{count}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

function ProfilePills({ profile }: { profile: UserProfile }) {
  const tags: string[] = [];
  if (profile.skinType) tags.push(`${profile.skinType} skin`);
  if (profile.hairTypes.length > 0) tags.push(...profile.hairTypes.map(h => `${h} hair`));
  if (tags.length === 0) return null;
  return (
    <View style={styles.profilePillsRow}>
      {tags.map(tag => (
        <View key={tag} style={styles.profilePill}>
          <Text style={styles.profilePillText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

export function QuickResultsScreen({ navigation, route }: QuickResultsScreenProps) {
  const { photoPath, result: initialResult, productType, category } = route.params;
  const [loading, setLoading] = useState(!initialResult);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(initialResult ?? null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  useEffect(() => {
    getUserProfile().then(setProfile);
  }, []);

  useEffect(() => {
    if (netInfo.isConnected) {
      resetApiLimit();
    }
  }, [netInfo.isConnected]);

  useEffect(() => {
    if (initialResult || result) return;
    if (isOffline) {
      setLoading(false);
      setError("No internet connection");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!photoPath) throw new Error('Missing photo for analysis');
        const data = await analyzeIngredientPhoto(photoPath, productType, category);
        if (!cancelled) {
          setResult(data);
          saveScan({ productType, category, analysis: data });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Analysis failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initialResult, isOffline, result, photoPath, productType, category]);

  const scanAnother = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }, [navigation]);

  const seeBreakdown = useCallback(() => {
    if (!result) return;
    navigation.navigate('IngredientBreakdown', { result, productType, category });
  }, [navigation, result, productType, category]);

  if (loading) {
    return (
      <View style={styles.centeredFill}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <ActivityIndicator size="large" color={PRIMARY_TEXT} />
        <Text style={styles.loadingText}>Analyzing ingredients…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredFill}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <Text style={styles.errorTitle}>Could not analyze</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!result) return null;

  const safeCount = result.ingredients.filter(i => i.status.toLowerCase() === 'safe').length;
  const cautionCount = result.ingredients.filter(i => i.status.toLowerCase() === 'caution').length;
  const harmfulCount = result.ingredients.filter(i => i.status.toLowerCase() === 'harmful').length;
  const verdict = result.one_line_verdict ?? defaultVerdict(result.overall_score);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>No internet connection</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.typeBadgeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{productType}</Text>
          </View>
        </View>

        {profile && <ProfilePills profile={profile} />}

        <View style={styles.gaugeSection}>
          <ScoreGauge score={result.overall_score} />
          <Text style={styles.scoreLabel}>Safety Score</Text>
          <Text style={styles.verdict}>{verdict}</Text>
        </View>

        {result.product_type_match !== undefined && (
          <View style={[
            styles.matchBanner,
            { backgroundColor: result.product_type_match ? '#D1FAE5' : '#FEE2E2' },
          ]}>
            <Text style={[
              styles.matchBannerText,
              { color: result.product_type_match ? '#065F46' : '#991B1B' },
            ]}>
              {result.product_type_match
                ? `✓  Good choice for ${productType}`
                : `✕  Not recommended as ${productType}`}
            </Text>
          </View>
        )}

        <View style={styles.pillsRow}>
          <StatPill count={safeCount} label="Safe" color={GREEN} />
          <View style={styles.pillDivider} />
          <StatPill count={cautionCount} label="Caution" color={YELLOW} />
          <View style={styles.pillDivider} />
          <StatPill count={harmfulCount} label="Harmful" color={RED} />
        </View>

        {result.dermatologist_note ? (
          <View style={styles.dermNote}>
            <Text style={styles.dermNoteLabel}>Dermatologist note</Text>
            <Text style={styles.dermNoteText}>{result.dermatologist_note}</Text>
          </View>
        ) : null}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={seeBreakdown} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>See Full Breakdown</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.textButton} onPress={scanAnother} activeOpacity={0.7}>
          <Text style={styles.textButtonLabel}>Scan Another</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  offlineBanner: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  centeredFill: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: SECONDARY_TEXT,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY_TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 15,
    color: SECONDARY_TEXT,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
  },
  typeBadgeRow: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: SECONDARY_TEXT,
    letterSpacing: 0.2,
  },
  profilePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignSelf: 'stretch',
    marginBottom: 28,
  },
  profilePill: {
    backgroundColor: '#E8F5F0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  profilePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1D9E75',
  },
  gaugeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  gaugeOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gaugeScore: {
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 48,
  },
  gaugeOutOf: {
    fontSize: 14,
    fontWeight: '500',
    color: SECONDARY_TEXT,
    marginTop: -2,
  },
  scoreLabel: {
    fontSize: 13,
    color: SECONDARY_TEXT,
    marginBottom: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  verdict: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY_TEXT,
    textAlign: 'center',
    lineHeight: 24,
  },
  matchBanner: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  matchBannerText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  pillsRow: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    alignSelf: 'stretch',
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
  },
  statPillCount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statPillLabel: {
    fontSize: 13,
    color: SECONDARY_TEXT,
    fontWeight: '500',
  },
  pillDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#D1D1D6',
  },
  dermNote: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    alignSelf: 'stretch',
    marginTop: 4,
  },
  dermNoteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: SECONDARY_TEXT,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dermNoteText: {
    fontSize: 14,
    color: PRIMARY_TEXT,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 4,
  },
  primaryButton: {
    backgroundColor: PRIMARY_TEXT,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  textButtonLabel: {
    fontSize: 15,
    color: SECONDARY_TEXT,
    fontWeight: '500',
  },
});
