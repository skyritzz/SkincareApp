export type IngredientStatus = 'safe' | 'caution' | 'harmful';

export interface IngredientAnalysis {
  name: string;
  status: IngredientStatus | string;
  what_it_does: string;
  concern: string | null;
  good_for_product_type?: boolean;
  reason_for_rating?: string;
}

export interface AnalysisResult {
  ingredients: IngredientAnalysis[];
  overall_score: number;
  one_line_verdict?: string;
  product_type?: string;
  product_type_match?: boolean;
  dermatologist_note?: string;
}
