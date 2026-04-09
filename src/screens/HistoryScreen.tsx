import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { AnalysisResult } from '../types/analysis';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

type ScanRow = {
  id: string;
  created_at: string;
  product_type: string;
  category: string;
  overall_score: number;
  one_line_verdict: string | null;
  product_type_match: boolean | null;
  dermatologist_note: string | null;
  ingredients: AnalysisResult['ingredients'];
  skin_type: string | null;
  hair_types: string[];
  skin_concerns: string[];
};

function scoreColor(score: number): string {
  if (score >= 7) return '#34C759';
  if (score >= 4) return '#FF9500';
  return '#FF3B30';
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function ScanCard({
  scan,
  onPress,
  onLongPress,
}: {
  scan: ScanRow;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const color = scoreColor(scan.overall_score);
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}>
      <View style={[styles.cardStrip, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardMeta}>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>
                {scan.product_type} • {scan.category === 'haircare' ? 'Hair Care' : 'Skincare'}
              </Text>
            </View>
            <Text style={styles.cardDate}>{relativeTime(scan.created_at)}</Text>
          </View>
          <View style={styles.scoreBlock}>
            <Text style={[styles.scoreNumber, { color }]}>{scan.overall_score}</Text>
            <Text style={styles.scoreOutOf}>/10</Text>
          </View>
        </View>
        {scan.one_line_verdict ? (
          <Text style={styles.cardVerdict} numberOfLines={1}>
            {scan.one_line_verdict}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ onScanNow }: { onScanNow: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>✦</Text>
      <Text style={styles.emptyTitle}>No scans yet</Text>
      <Text style={styles.emptySubtitle}>
        Start scanning products to build your history
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onScanNow} activeOpacity={0.85}>
        <Text style={styles.emptyButtonText}>Scan Now</Text>
      </TouchableOpacity>
    </View>
  );
}

export function HistoryScreen({ navigation }: Props) {
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScans = useCallback(async () => {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setScans(data as ScanRow[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchScans();
  }, [fetchScans]);

  const onDeleteScan = useCallback((id: string) => {
    Alert.alert('Delete this scan?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('scans').delete().eq('id', id);
          setScans(prev => prev.filter(s => s.id !== id));
        },
      },
    ]);
  }, []);

  const onPressScan = useCallback(
    (scan: ScanRow) => {
      const result: AnalysisResult = {
        ingredients: scan.ingredients,
        overall_score: scan.overall_score,
        one_line_verdict: scan.one_line_verdict ?? undefined,
        product_type: scan.product_type,
        product_type_match: scan.product_type_match ?? undefined,
        dermatologist_note: scan.dermatologist_note ?? undefined,
      };
      navigation.navigate('QuickResults', {
        result,
        productType: scan.product_type,
        category: scan.category,
      });
    },
    [navigation],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Scan History</Text>
          {!loading && (
            <Text style={styles.headerSubtitle}>
              {scans.length} {scans.length === 1 ? 'scan' : 'scans'} saved
            </Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : scans.length === 0 ? (
        <EmptyState onScanNow={() => navigation.navigate('Home')} />
      ) : (
        <FlatList
          data={scans}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1D9E75"
            />
          }
          renderItem={({ item }) => (
            <ScanCard
              scan={item}
              onPress={() => onPressScan(item)}
              onLongPress={() => onDeleteScan(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 36,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerSpacer: {
    width: 36,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardStrip: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardMeta: {
    flex: 1,
    gap: 6,
  },
  typePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5F0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D9E75',
  },
  cardDate: {
    fontSize: 11,
    color: '#8E8E93',
  },
  scoreBlock: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
  },
  scoreOutOf: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  cardVerdict: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  separator: {
    height: 10,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#D1D1D6',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
  },
  emptyButton: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
