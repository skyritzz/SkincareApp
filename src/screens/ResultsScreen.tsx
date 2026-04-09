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
import { analyzeIngredientPhoto } from '../services/claudeService';
import type { AnalysisResult, IngredientAnalysis } from '../types/analysis';
import type { ResultsScreenProps } from '../navigation/types';

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'harmful') {
    return '#ef4444';
  }
  if (s === 'caution') {
    return '#eab308';
  }
  return '#22c55e';
}

function statusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === 'harmful') {
    return 'Harmful';
  }
  if (s === 'caution') {
    return 'Caution';
  }
  return 'Safe';
}

function IngredientCard({ item }: { item: IngredientAnalysis }) {
  const color = statusColor(item.status);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.ingredientName}>{item.name}</Text>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{statusLabel(String(item.status))}</Text>
        </View>
      </View>
      <Text style={styles.whatItDoes}>{item.what_it_does}</Text>
      {item.good_for_product_type !== undefined ? (
        <View style={styles.productTypeBadgeRow}>
          <View
            style={[
              styles.productTypeBadge,
              item.good_for_product_type
                ? styles.productTypeBadgeGood
                : styles.productTypeBadgeNeutral,
            ]}>
            <Text style={styles.productTypeBadgeText}>
              {item.good_for_product_type ? 'Good for product type' : 'Not ideal for product type'}
            </Text>
          </View>
        </View>
      ) : null}
      {item.concern ? (
        <Text style={styles.concern}>Note: {item.concern}</Text>
      ) : null}
    </View>
  );
}

export function ResultsScreen({ navigation, route }: ResultsScreenProps) {
  const { photoPath, result: initialResult, productType } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (initialResult) {
          if (!cancelled) {
            setResult(initialResult);
          }
          return;
        }
        if (!photoPath) {
          throw new Error('Missing photo for analysis');
        }
        const data = await analyzeIngredientPhoto(photoPath, productType);
        if (!cancelled) {
          setResult(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Analysis failed');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialResult, photoPath, productType]);

  const scanAnother = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }, [navigation]);

  const displayProductType = result?.product_type ?? productType;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>Analyzing ingredients…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Could not analyze</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}>
            <Text style={styles.footerButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : result ? (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {displayProductType ? (
              <Text style={styles.analysisFor}>
                Analysis for: <Text style={styles.analysisForType}>{displayProductType}</Text>
              </Text>
            ) : null}
            <Text style={styles.screenTitle}>Ingredients</Text>
            {result.ingredients.map((item, index) => (
              <IngredientCard
                key={`${item.name}-${index}`}
                item={item}
              />
            ))}
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Overall safety score</Text>
              <Text style={styles.scoreValue}>
                {result.overall_score}
                <Text style={styles.scoreOutOf}>/10</Text>
              </Text>
              {result.one_line_verdict ? (
                <Text style={styles.verdict}>{result.one_line_verdict}</Text>
              ) : null}
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={scanAnother}
              activeOpacity={0.85}>
              <Text style={styles.footerButtonText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4b5563',
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  analysisFor: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  analysisForType: {
    color: '#0d9488',
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  ingredientName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  whatItDoes: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  productTypeBadgeRow: {
    marginTop: 8,
    flexDirection: 'row',
  },
  productTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  productTypeBadgeGood: {
    backgroundColor: '#ccfbf1',
  },
  productTypeBadgeNeutral: {
    backgroundColor: '#f3f4f6',
  },
  productTypeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  concern: {
    marginTop: 8,
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
  },
  scoreBox: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
  },
  scoreOutOf: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
  },
  verdict: {
    marginTop: 10,
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
