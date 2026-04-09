import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { UserProfile } from '../utils/userProfile';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const SKIN_TYPES = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'];
const HAIR_TYPES = ['Oily', 'Dry', 'Damaged', 'Color-treated', 'Curly'];
const CONCERNS = ['Acne-prone', 'Anti-aging', 'Hyperpigmentation', 'Redness', 'Dehydrated', 'None'];

function SectionCard({
  label,
  value,
  editable,
  onEdit,
}: {
  label: string;
  value: string | string[];
  editable: boolean;
  onEdit?: () => void;
}) {
  const displayValue = Array.isArray(value)
    ? value.length > 0 ? value.join(', ') : '—'
    : value || '—';

  return (
    <TouchableOpacity
      style={styles.sectionCard}
      onPress={editable ? onEdit : undefined}
      activeOpacity={editable ? 0.75 : 1}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={[styles.sectionValue, editable && styles.sectionValueEditable]}>
        {displayValue}
      </Text>
      {editable && <Text style={styles.editIcon}>›</Text>}
    </TouchableOpacity>
  );
}

function OptionCard({
  label,
  selected,
  onToggle,
  isMulti = false,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  isMulti?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onToggle}
      activeOpacity={0.75}>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
        {label}
      </Text>
      {selected && <Text style={styles.optionCheck}>{isMulti ? '✓' : '✓'}</Text>}
    </TouchableOpacity>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile>({
    skinType: null,
    hairTypes: [],
    skinConcerns: [],
  });

  const [editMode, setEditMode] = useState(false);
  const [editSkinType, setEditSkinType] = useState<string | null>(null);
  const [editHairTypes, setEditHairTypes] = useState<string[]>([]);
  const [editConcerns, setEditConcerns] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, []),
  );

  const loadProfile = async () => {
    const [st, ht, sc] = await Promise.all([
      AsyncStorage.getItem('skin_type'),
      AsyncStorage.getItem('hair_types'),
      AsyncStorage.getItem('skin_concerns'),
    ]);
    const newProfile = {
      skinType: st,
      hairTypes: ht ? (JSON.parse(ht) as string[]) : [],
      skinConcerns: sc ? (JSON.parse(sc) as string[]) : [],
    };
    setProfile(newProfile);
    setEditSkinType(st);
    setEditHairTypes(ht ? (JSON.parse(ht) as string[]) : []);
    setEditConcerns(sc ? (JSON.parse(sc) as string[]) : []);
  };

  const onEditPress = () => {
    if (editMode) {
      saveChanges();
    } else {
      setEditMode(true);
      setExpandedSection(null);
    }
  };

  const saveChanges = async () => {
    if (editSkinType) {
      await AsyncStorage.setItem('skin_type', editSkinType);
    }
    await AsyncStorage.setItem('hair_types', JSON.stringify(editHairTypes));
    await AsyncStorage.setItem('skin_concerns', JSON.stringify(editConcerns));

    setProfile({
      skinType: editSkinType,
      hairTypes: editHairTypes,
      skinConcerns: editConcerns,
    });
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const onSignOut = () => {
    Alert.alert('Sign out?', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const onRedoSetup = () => {
    Alert.alert(
      'Redo initial setup?',
      'This will restart the setup process. Continue?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await AsyncStorage.removeItem('onboarding_complete');
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
          },
          style: 'destructive',
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header with custom back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={onEditPress} activeOpacity={0.7}>
          <Text style={styles.editButton}>{editMode ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Summary card */}
        {!editMode && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>✦</Text>
            <View style={styles.summaryContent}>
              {profile.skinType && (
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryPillText}>{profile.skinType}</Text>
                </View>
              )}
              {profile.hairTypes.length > 0 && (
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryPillText}>{profile.hairTypes.join(' • ')}</Text>
                </View>
              )}
              {profile.skinConcerns.length > 0 && (
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryPillText}>{profile.skinConcerns.join(' • ')}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Saved message */}
        {saved && (
          <View style={styles.savedMessage}>
            <Text style={styles.savedText}>✓ Profile updated!</Text>
          </View>
        )}

        {/* Skin Type Section */}
        <View>
          {editMode && expandedSection === 'skin' ? (
            <View style={styles.editSection}>
              <Text style={styles.editSectionLabel}>SKIN TYPE</Text>
              <View style={styles.optionsGrid}>
                {SKIN_TYPES.map(type => (
                  <OptionCard
                    key={type}
                    label={type}
                    selected={editSkinType === type}
                    onToggle={() => setEditSkinType(type)}
                  />
                ))}
              </View>
            </View>
          ) : (
            <SectionCard
              label="SKIN TYPE"
              value={editMode ? editSkinType || '—' : profile.skinType || '—'}
              editable={editMode}
              onEdit={() => setExpandedSection(expandedSection === 'skin' ? null : 'skin')}
            />
          )}
        </View>

        {/* Hair Type Section */}
        <View>
          {editMode && expandedSection === 'hair' ? (
            <View style={styles.editSection}>
              <Text style={styles.editSectionLabel}>HAIR TYPE</Text>
              <View style={styles.optionsGrid}>
                {HAIR_TYPES.map(type => (
                  <OptionCard
                    key={type}
                    label={type}
                    selected={editHairTypes.includes(type)}
                    onToggle={() => {
                      setEditHairTypes(prev =>
                        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type],
                      );
                    }}
                    isMulti
                  />
                ))}
              </View>
            </View>
          ) : (
            <SectionCard
              label="HAIR TYPE"
              value={editMode ? editHairTypes : profile.hairTypes}
              editable={editMode}
              onEdit={() => setExpandedSection(expandedSection === 'hair' ? null : 'hair')}
            />
          )}
        </View>

        {/* Skin Concerns Section */}
        <View>
          {editMode && expandedSection === 'concerns' ? (
            <View style={styles.editSection}>
              <Text style={styles.editSectionLabel}>SKIN CONCERNS</Text>
              <View style={styles.optionsGrid}>
                {CONCERNS.map(concern => (
                  <OptionCard
                    key={concern}
                    label={concern}
                    selected={editConcerns.includes(concern)}
                    onToggle={() => {
                      if (concern === 'None') {
                        setEditConcerns(prev => (prev.includes('None') ? [] : ['None']));
                      } else {
                        setEditConcerns(prev => {
                          const withoutNone = prev.filter(c => c !== 'None');
                          return withoutNone.includes(concern)
                            ? withoutNone.filter(c => c !== concern)
                            : [...withoutNone, concern];
                        });
                      }
                    }}
                    isMulti
                  />
                ))}
              </View>
            </View>
          ) : (
            <SectionCard
              label="SKIN CONCERNS"
              value={editMode ? editConcerns : profile.skinConcerns}
              editable={editMode}
              onEdit={() => setExpandedSection(expandedSection === 'concerns' ? null : 'concerns')}
            />
          )}
        </View>

        {/* Redo setup */}
        <TouchableOpacity
          style={styles.redoLink}
          onPress={onRedoSetup}
          activeOpacity={0.7}>
          <Text style={styles.redoLinkText}>Redo initial setup</Text>
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={onSignOut}
          activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    fontSize: 28,
    color: '#1C1C1E',
    fontWeight: '600',
    width: 40,
    textAlign: 'left',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D9E75',
    width: 40,
    textAlign: 'right',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#E8F5F0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 28,
  },
  summaryIcon: {
    fontSize: 40,
    color: '#1D9E75',
    marginBottom: 14,
  },
  summaryContent: {
    gap: 8,
    alignItems: 'center',
  },
  summaryPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  summaryPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1D9E75',
  },
  sectionCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    position: 'absolute',
    top: 12,
    left: 16,
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginTop: 20,
    flex: 1,
  },
  sectionValueEditable: {
    color: '#1D9E75',
    fontWeight: '600',
  },
  editIcon: {
    fontSize: 18,
    color: '#8E8E93',
  },
  editSection: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  editSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  optionsGrid: {
    gap: 8,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: '#E8F5F0',
    borderColor: '#1D9E75',
    borderLeftWidth: 4,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  optionLabelSelected: {
    color: '#1D9E75',
    fontWeight: '600',
  },
  optionCheck: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D9E75',
  },
  savedMessage: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  savedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  redoLink: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  redoLinkText: {
    fontSize: 13,
    color: '#8E8E93',
    textDecorationLine: 'underline',
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
