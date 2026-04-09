import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  FlatList,
  Dimensions,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import type { HomeScreenProps } from '../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 48 = scrollContent paddingHorizontal (24*2), 8 = gap between the two cards
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 48 - 8) / 2);

type ProductItem = {
  id: string;
  name: string;
  icon: string;
  description: string;
  bgColor: string;
};

const SKINCARE_PRODUCTS: ProductItem[] = [
  { id: 'moisturiser', name: 'Moisturiser', icon: '💧', description: 'Hydration & barrier', bgColor: '#E8F4FD' },
  { id: 'sunscreen', name: 'Sunscreen', icon: '☀️', description: 'UV protection', bgColor: '#FFF8E8' },
  { id: 'toner', name: 'Toner', icon: '🌿', description: 'Balance & prep', bgColor: '#E8F5F0' },
  { id: 'serum', name: 'Serum', icon: '✨', description: 'Targeted treatment', bgColor: '#F5E8FF' },
  { id: 'cleanser', name: 'Cleanser', icon: '🫧', description: 'Cleanse & purify', bgColor: '#E8F0FF' },
  { id: 'eye-cream', name: 'Eye Cream', icon: '👁️', description: 'Delicate eye area', bgColor: '#FFF0E8' },
];

const HAIRCARE_PRODUCTS: ProductItem[] = [
  { id: 'shampoo', name: 'Shampoo', icon: '🚿', description: 'Cleanse scalp', bgColor: '#E8F4FD' },
  { id: 'conditioner', name: 'Conditioner', icon: '💆', description: 'Smooth & detangle', bgColor: '#F5E8FF' },
  { id: 'hair-mask', name: 'Hair Mask', icon: '🫙', description: 'Deep treatment', bgColor: '#FFF8E8' },
  { id: 'hair-oil', name: 'Hair Oil', icon: '💫', description: 'Nourish & shine', bgColor: '#E8F5F0' },
  { id: 'hair-serum', name: 'Hair Serum', icon: '✨', description: 'Frizz & protection', bgColor: '#F0E8FF' },
  { id: 'scalp-treatment', name: 'Scalp Treatment', icon: '🌱', description: 'Scalp health', bgColor: '#E8FFF0' },
];

type Category = 'skincare' | 'haircare';

function darkenColor(color: string): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - 20);
  const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - 20);
  const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - 20);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function ProductCard({
  item,
  selected,
  onPress,
  cardWidth,
}: {
  item: ProductItem;
  selected: boolean;
  onPress: () => void;
  cardWidth: number;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: selected ? darkenColor(item.bgColor) : item.bgColor, width: cardWidth },
        selected && styles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.75}>
      <Text style={styles.cardIcon}>{item.icon}</Text>
      <Text style={[styles.cardName, selected && styles.cardNameSelected]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.cardDescription} numberOfLines={1}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [category, setCategory] = useState<Category>('skincare');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const productList = category === 'skincare' ? SKINCARE_PRODUCTS : HAIRCARE_PRODUCTS;
  const selectedProduct = productList.find(p => p.id === selectedProductId);
  const selectedProductType = selectedProduct?.name ?? null;

  const onCategoryChange = (next: Category) => {
    setCategory(next);
    setSelectedProductId(null);
  };

  const requireProductType = useCallback((): boolean => {
    if (!selectedProductType) {
      Alert.alert('Select a product type', 'Please choose what you are scanning first.');
      return false;
    }
    return true;
  }, [selectedProductType]);

  const scanProduct = useCallback(() => {
    if (!requireProductType()) return;
    navigation.navigate('Camera', { productType: selectedProductType!, category });
  }, [navigation, selectedProductType, category, requireProductType]);

  const pickFromGallery = useCallback(async () => {
    if (!requireProductType()) return;
    setPicking(true);
    try {
      const response = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
      if (response.didCancel || !response.assets || response.assets.length === 0) return;
      const uri = response.assets[0].uri;
      if (!uri) return;
      navigation.navigate('QuickResults', {
        photoPath: uri,
        productType: selectedProductType!,
        category,
      });
    } finally {
      setPicking(false);
    }
  }, [navigation, selectedProductType, category, requireProductType]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.7}>
            <Text style={styles.headerIconText}>🕐</Text>
          </TouchableOpacity>
          <View style={styles.header}>
            <Text style={styles.icon}>✦</Text>
            <Text style={styles.title}>SkinScan</Text>
            <Text style={styles.headerSubtitle}>AI-powered ingredient analysis</Text>
          </View>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}>
            <Text style={styles.headerIconText}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Category tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => onCategoryChange('skincare')}
            activeOpacity={0.75}>
            <Text style={[styles.tabText, category === 'skincare' && styles.tabTextActive]}>
              Skincare
            </Text>
            {category === 'skincare' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => onCategoryChange('haircare')}
            activeOpacity={0.75}>
            <Text style={[styles.tabText, category === 'haircare' && styles.tabTextActive]}>
              Hair Care
            </Text>
            {category === 'haircare' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        </View>

        {/* Product type selector */}
        <View style={styles.selectorSection}>
          <Text style={styles.selectorLabel}>Select product type</Text>
          <FlatList
            data={productList}
            numColumns={2}
            scrollEnabled={false}
            keyExtractor={item => item.id}
            style={{ width: '100%' }}
            columnWrapperStyle={{
              justifyContent: 'space-between',
              gap: 8,
            }}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                selected={selectedProductId === item.id}
                onPress={() => setSelectedProductId(item.id)}
                cardWidth={CARD_WIDTH}
              />
            )}
          />
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={scanProduct}
            activeOpacity={0.85}>
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.primaryButtonText}>Scan a Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={pickFromGallery}
            disabled={picking}
            activeOpacity={0.85}>
            {picking ? (
              <ActivityIndicator color="#1C1C1E" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>🖼️</Text>
                <Text style={styles.secondaryButtonText}>Pick from Gallery</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            Scan any skincare product label to get an instant AI analysis
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  header: {
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    color: '#1D9E75',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#8E8E93',
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 22,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 22,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 28,
  },
  tab: {
    marginRight: 24,
    paddingBottom: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#1D9E75',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#1D9E75',
    borderRadius: 1,
  },

  // Product selector
  selectorSection: {
    marginBottom: 28,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  card: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: '#1D9E75',
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  cardNameSelected: {
    color: '#1D9E75',
  },
  cardDescription: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Buttons
  actions: {
    gap: 0,
  },
  primaryButton: {
    height: 54,
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1C1C1E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    fontSize: 18,
  },
  hint: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 19,
  },
});
