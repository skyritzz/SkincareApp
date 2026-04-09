import React, { useCallback, useEffect, useState } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { getUserProfile } from '../utils/userProfile';
import type { UserProfile } from '../utils/userProfile';
import type { IngredientAnalysis } from '../types/analysis';
import type { IngredientBreakdownScreenProps } from '../navigation/types';

const GREEN = '#34C759';
const YELLOW = '#FF9500';
const RED = '#FF3B30';
const BG = '#FFFFFF';
const PRIMARY_TEXT = '#1C1C1E';
const SECONDARY_TEXT = '#8E8E93';
const CARD_BG = '#F2F2F7';

function borderColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'harmful') return RED;
  if (s === 'caution') return YELLOW;
  return GREEN;
}

function IngredientCard({ item }: { item: IngredientAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const color = borderColor(item.status);
  const toggle = useCallback(() => setExpanded(e => !e), []);
  const hasExpandable = Boolean(item.concern) || Boolean(item.reason_for_rating);
  const hasFitFlag = item.good_for_product_type !== undefined;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color }]}
      onPress={hasExpandable ? toggle : undefined}
      activeOpacity={hasExpandable ? 0.75 : 1}>
      <View style={styles.cardRow}>
        <View style={styles.cardMain}>
          <Text style={styles.ingredientName}>{item.name}</Text>
          <Text style={styles.whatItDoes}>{item.what_it_does}</Text>
          {expanded && item.reason_for_rating ? (
            <Text style={styles.reasonText}>{item.reason_for_rating}</Text>
          ) : null}
          {expanded && item.concern ? (
            <Text style={styles.concernText}>{item.concern}</Text>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          {hasFitFlag ? (
            <Text style={item.good_for_product_type ? styles.tickGreen : styles.crossRed}>
              {item.good_for_product_type ? '✓' : '✕'}
            </Text>
          ) : null}
          {hasExpandable ? (
            <Text style={styles.chevron}>{expanded ? '∧' : '∨'}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

type Section = {
  title: string;
  color: string;
  data: IngredientAnalysis[];
};

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

export function IngredientBreakdownScreen({ route }: IngredientBreakdownScreenProps) {
  const { result, productType } = route.params;
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUserProfile().then(setProfile);
  }, []);

  const safe = result.ingredients.filter(i => i.status.toLowerCase() === 'safe');
  const caution = result.ingredients.filter(i => i.status.toLowerCase() === 'caution');
  const harmful = result.ingredients.filter(i => i.status.toLowerCase() === 'harmful');

  const sections: Section[] = [];
  if (harmful.length > 0) sections.push({ title: 'Harmful', color: RED, data: harmful });
  if (caution.length > 0) sections.push({ title: 'Caution', color: YELLOW, data: caution });
  if (safe.length > 0) sections.push({ title: 'Safe', color: GREEN, data: safe });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{productType}</Text>
            </View>
            {profile && <ProfilePills profile={profile} />}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        renderItem={({ item }) => <IngredientCard item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderSectionFooter={() => <View style={styles.sectionFooter} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listHeader: {
    paddingTop: 20,
    paddingBottom: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
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
    marginBottom: 8,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 10,
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY_TEXT,
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: SECONDARY_TEXT,
    fontWeight: '500',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardMain: {
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
    paddingTop: 2,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
    color: PRIMARY_TEXT,
    marginBottom: 4,
  },
  whatItDoes: {
    fontSize: 13,
    color: SECONDARY_TEXT,
    lineHeight: 18,
  },
  reasonText: {
    marginTop: 8,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    padding: 8,
    overflow: 'hidden',
  },
  concernText: {
    marginTop: 6,
    fontSize: 13,
    color: '#8B5C1E',
    lineHeight: 18,
    backgroundColor: '#FFF7ED',
    borderRadius: 6,
    padding: 8,
    overflow: 'hidden',
  },
  tickGreen: {
    fontSize: 15,
    fontWeight: '700',
    color: GREEN,
  },
  crossRed: {
    fontSize: 15,
    fontWeight: '700',
    color: RED,
  },
  chevron: {
    fontSize: 12,
    color: SECONDARY_TEXT,
    marginTop: 2,
  },
  separator: {
    height: 8,
  },
  sectionFooter: {
    height: 4,
  },
});
