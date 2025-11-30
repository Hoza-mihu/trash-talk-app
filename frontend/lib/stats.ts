export const CATEGORY_KEYS = [
  'Glass',
  'Metal',
  'Organic Waste',
  'Paper',
  'Plastic',
  'Textiles',
  'Other'
] as const;

export type WasteCategoryKey = (typeof CATEGORY_KEYS)[number];

export interface CategoryMetric {
  count: number;
  co2: number;
}

export interface UserStats {
  totalItems: number;
  recyclableItems: number;
  compostableItems: number;
  co2Saved: number;
  categories: Record<WasteCategoryKey, CategoryMetric>;
}

export const CATEGORY_COLORS: Record<WasteCategoryKey, string> = {
  Glass: '#8B5CF6',
  Metal: '#EF4444',
  'Organic Waste': '#F59E0B',
  Paper: '#10B981',
  Plastic: '#3B82F6',
  Textiles: '#EC4899',
  Other: '#6B7280'
};

const createCategoryMetric = (): CategoryMetric => ({
  count: 0,
  co2: 0
});

export const createDefaultCategoryStats = (): Record<WasteCategoryKey, CategoryMetric> => ({
  Glass: createCategoryMetric(),
  Metal: createCategoryMetric(),
  'Organic Waste': createCategoryMetric(),
  Paper: createCategoryMetric(),
  Plastic: createCategoryMetric(),
  Textiles: createCategoryMetric(),
  Other: createCategoryMetric()
});

export const createDefaultUserStats = (): UserStats => ({
  totalItems: 0,
  recyclableItems: 0,
  compostableItems: 0,
  co2Saved: 0,
  categories: createDefaultCategoryStats()
});

export const HISTORICAL_STATS: UserStats = {
  totalItems: 845,
  recyclableItems: 695,
  compostableItems: 110,
  co2Saved: 373,
  categories: {
    Glass: { count: 125, co2: 50 },
    Metal: { count: 140, co2: 84 },
    'Organic Waste': { count: 110, co2: 22 },
    Paper: { count: 160, co2: 48 },
    Plastic: { count: 190, co2: 95 },
    Textiles: { count: 80, co2: 56 },
    Other: { count: 40, co2: 18 }
  }
};

const mergeCategoryStats = (
  stored?: Record<string, Partial<CategoryMetric>>
): Record<WasteCategoryKey, CategoryMetric> => {
  const merged = createDefaultCategoryStats();

  if (!stored) {
    return merged;
  }

  Object.entries(stored).forEach(([rawKey, value]) => {
    const metric: CategoryMetric = {
      count: value?.count ?? 0,
      co2: value?.co2 ?? 0
    };

    if ((CATEGORY_KEYS as readonly string[]).includes(rawKey)) {
      merged[rawKey as WasteCategoryKey] = metric;
    } else {
      merged.Other.count += metric.count;
      merged.Other.co2 += metric.co2;
    }
  });

  return merged;
};

export const mergeWithDefaultStats = (stats?: Partial<UserStats>): UserStats => {
  const defaults = createDefaultUserStats();

  if (!stats) {
    return defaults;
  }

  return {
    ...defaults,
    ...stats,
    categories: mergeCategoryStats(stats.categories as Record<string, Partial<CategoryMetric>>)
  };
};

const normalizeCategoryKey = (categoryName: string): WasteCategoryKey => {
  const normalized = CATEGORY_KEYS.find(
    (key) => key.toLowerCase() === categoryName.toLowerCase()
  );

  return normalized ?? 'Other';
};

export const recordCategorySample = (
  stats: UserStats,
  categoryName: string,
  wasteType: string,
  co2: number
): UserStats => {
  const safeKey = normalizeCategoryKey(categoryName);
  const safeCo2 = Number.isFinite(co2) ? co2 : 0;

  stats.totalItems += 1;
  stats.co2Saved += safeCo2;

  if (wasteType === 'Recyclable') {
    stats.recyclableItems += 1;
  }

  if (wasteType === 'Compostable') {
    stats.compostableItems += 1;
  }

  stats.categories[safeKey].count += 1;
  stats.categories[safeKey].co2 += safeCo2;

  return stats;
};

export const combineStats = (current: UserStats, addition: UserStats): UserStats => {
  const combined = createDefaultUserStats();

  combined.totalItems = current.totalItems + addition.totalItems;
  combined.recyclableItems = current.recyclableItems + addition.recyclableItems;
  combined.compostableItems = current.compostableItems + addition.compostableItems;
  combined.co2Saved = current.co2Saved + addition.co2Saved;

  CATEGORY_KEYS.forEach((key) => {
    combined.categories[key] = {
      count: current.categories[key].count + addition.categories[key].count,
      co2: current.categories[key].co2 + addition.categories[key].co2
    };
  });

  return combined;
};

