import RNFS from 'react-native-fs';
import type { AnalysisResult, IngredientAnalysis } from '../types/analysis';
import { getUserProfile } from '../utils/userProfile';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { validateClaudeResponse, validateIngredientText } from '../utils/validateApiResponse';

export interface SaveScanParams {
  productType: string;
  category: string;
  analysis: AnalysisResult;
}

export async function saveScan({ productType, category, analysis }: SaveScanParams): Promise<void> {
  const attemptSave = async (retry: boolean) => {
    try {
      logger.info('ClaudeService', 'Starting saveScan');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { skinType, hairTypes, skinConcerns } = await getUserProfile();
      await supabase.from('scans').insert({
        user_id: user.id,
        product_type: productType,
        category,
        overall_score: analysis.overall_score,
        one_line_verdict: analysis.one_line_verdict ?? null,
        product_type_match: analysis.product_type_match ?? null,
        dermatologist_note: analysis.dermatologist_note ?? null,
        ingredients: analysis.ingredients,
        skin_type: skinType,
        hair_types: hairTypes,
        skin_concerns: skinConcerns,
      });
      logger.info('ClaudeService', 'Successfully saved scan history');
    } catch (err: any) {
      logger.error('ClaudeService', 'Failed to save scan history', err.message);
      if (retry) {
        setTimeout(() => attemptSave(false), 3000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Scan saved locally. History sync failed.',
          position: 'bottom',
        });
      }
    }
  };
  attemptSave(true);
}

const MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeApiKey(raw: string): string {
  return raw.replace(/^\uFEFF/, '').trim().replace(/^['"]|['"]$/g, '');
}

function normalizePath(path: string): string {
  return path.replace(/^file:\/\//, '');
}

function guessMediaType(filePath: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function stripCodeFences(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '');
    t = t.replace(/```\s*$/, '');
  }
  return t.trim();
}

function parseAnalysisJson(text: string, productType?: string): AnalysisResult {
  const cleaned = stripCodeFences(text);
  const parsed: unknown = JSON.parse(cleaned);

  if (Array.isArray(parsed)) {
    return {
      ingredients: (parsed as IngredientAnalysis[]).map(i => ({
        ...i,
        good_for_product_type: i.good_for_product_type ?? true,
      })),
      overall_score: 5,
      one_line_verdict: '',
      product_type: productType,
    };
  }

  if (
    parsed &&
    typeof parsed === 'object' &&
    'ingredients' in parsed &&
    Array.isArray((parsed as { ingredients: unknown }).ingredients)
  ) {
    const obj = parsed as {
      ingredients: IngredientAnalysis[];
      overall_score?: unknown;
      one_line_verdict?: unknown;
      product_type_match?: unknown;
      dermatologist_note?: unknown;
    };
    const score =
      typeof obj.overall_score === 'number' && !Number.isNaN(obj.overall_score)
        ? Math.min(10, Math.max(0, obj.overall_score))
        : 5;
    return {
      ingredients: obj.ingredients.map(i => ({
        ...i,
        good_for_product_type: i.good_for_product_type ?? true,
      })),
      overall_score: score,
      one_line_verdict: typeof obj.one_line_verdict === 'string' ? obj.one_line_verdict : '',
      product_type: productType,
      product_type_match:
        typeof obj.product_type_match === 'boolean' ? obj.product_type_match : undefined,
      dermatologist_note:
        typeof obj.dermatologist_note === 'string' ? obj.dermatologist_note : undefined,
    };
  }

  throw new Error('Could not parse analysis from model response');
}

async function buildSystemPrompt(productType: string, category: string): Promise<string> {
  const { skinType, hairTypes, skinConcerns } = await getUserProfile();

  const profileSection = `
User profile:
- Skin type: ${skinType ?? 'Unknown'}
- Hair types: ${hairTypes.length > 0 ? hairTypes.join(', ') : 'Not specified'}
- Skin concerns: ${skinConcerns.length > 0 ? skinConcerns.join(', ') : 'None'}
- Product being analyzed: ${productType}
- Category: ${category} (${category === 'haircare' ? 'hair care' : 'skincare'})
`.trim();

  const skincareRules = `
SKINCARE PRODUCT RULES:

EYE CREAM rules (most strict):
- Eye area skin is 40% thinner than face skin
- Zero tolerance for: fragrances, essential oils, alcohol denat, chemical sunscreen filters (oxybenzone, avobenzone, octinoxate), strong exfoliants (AHA/BHA), formaldehyde releasers
- Flag anything that can migrate into eyes as harmful
- Score harshly — a product with even 2-3 unsuitable ingredients should score below 5

SUNSCREEN rules:
- Must check for adequate UV filters
- Flag if no broad spectrum protection ingredients
- Alcohol denat in high concentration is concerning
- Fragrance is caution level
- Score based on both safety AND efficacy for sun protection

MOISTURISER rules:
- Check for comedogenic ingredients
- Flag harsh alcohols (denat) as caution
- Fragrance is caution
- Check for skin barrier supporting ingredients

TONER rules:
- High alcohol content should be flagged as harmful for sensitive or dry skin
- Fragrance is caution to harmful
- Check for irritating preservatives

SERUM rules:
- Active ingredients must be at appropriate concentrations — flag if too many actives combined
- Check for ingredient conflicts (e.g. Vitamin C + Niacinamide debate)
- Fragrance is harmful in serums

CLEANSER rules:
- Flag harsh sulfates (SLS/SLES) as caution
- Check pH appropriateness
- Fragrance is caution`.trim();

  const haircareRules = `
HAIR CARE PRODUCT RULES:

SHAMPOO rules:
- Flag sulfates (SLS/SLES) as caution for dry/damaged/color-treated hair
- Flag high alcohol content
- Check for scalp-friendly ingredients
- For color-treated hair: flag anything that strips color

CONDITIONER rules:
- Flag heavy silicones for fine/oily hair
- Check for protein-moisture balance
- Cationic ingredients are expected and safe

HAIR MASK rules:
- Check protein vs moisture balance
- Too much protein can cause breakage
- Flag for color-treated compatibility

HAIR OIL rules:
- Flag comedogenic oils for oily scalp
- Check for heat protection if styling oil
- Mineral oil is caution for fine hair

HAIR SERUM rules:
- Check for alcohol content (drying)
- Silicones: fine for frizz but flag buildup risk
- Flag anything not suitable for their hair type

SCALP TREATMENT rules:
- Extra strict — scalp absorbs more than hair shaft
- Flag potential irritants aggressively
- Check for salicylic acid % if present`.trim();

  const skinConcernRules = skinConcerns.length > 0 ? `
PERSONALISATION BY SKIN CONCERN:

${skinConcerns.includes('Acne-prone') ? `ACNE-PRONE skin — apply these rules strictly:
- Flag ALL comedogenic ingredients as harmful:
  Coconut oil, Cocoa butter, Wheat germ oil, Isopropyl myristate, Isopropyl palmitate, Sodium lauryl sulfate, Algae extract, Flaxseed oil
- Flag as caution (moderately comedogenic):
  Soybean oil, Sweet almond oil, Shea butter, Jojoba oil
- Mark as good for acne-prone: Salicylic acid, Niacinamide, Zinc oxide, Tea tree oil (low concentration), Benzoyl peroxide, Retinol, Hyaluronic acid, Centella asiatica
- In concern field: "Comedogenic — may clog pores and trigger breakouts for acne-prone skin"
- If product contains 3+ comedogenic ingredients: maximum overall_score is 3/10` : ''}

${skinConcerns.includes('Anti-aging') ? `ANTI-AGING concern:
- Flag absence of antioxidants
- Mark retinol, peptides, vitamin C as good
- Flag high fragrance as aging accelerator` : ''}

${skinConcerns.includes('Hyperpigmentation') ? `HYPERPIGMENTATION concern:
- Flag ingredients that worsen dark spots
- Mark vitamin C, niacinamide, kojic acid as good
- Flag photosensitizing ingredients and note if SPF is absent` : ''}

${skinConcerns.includes('Redness') ? `REDNESS/ROSACEA concern:
- Extra strict on fragrances and essential oils
- Flag mint, eucalyptus, citrus as harmful
- Mark centella, green tea, azelaic acid as good
- If product contains known redness triggers: reduce overall_score by 2` : ''}

${skinConcerns.includes('Dehydrated') ? `DEHYDRATED skin concern:
- Flag ingredients that disrupt the moisture barrier (high alcohol, strong surfactants)
- Mark hyaluronic acid, glycerin, ceramides as good` : ''}`.trim() : '';

  const profilePersonalisation = `
PERSONALISE BASED ON USER PROFILE:
${skinType === 'Sensitive' ? '- Skin type is Sensitive: be extra strict about fragrances and preservatives — flag at caution minimum.' : ''}
${hairTypes.includes('Color-treated') ? '- Hair is Color-treated: flag anything that fades color or affects hair dye as harmful.' : ''}
${hairTypes.includes('Damaged') ? '- Hair is Damaged: flag anything with high alcohol or harsh surfactants as harmful.' : ''}
- Always mention in the concern field if an ingredient is specifically problematic for THEIR skin/hair type.`.trim();

  const outputFormat = `
For EACH ingredient return a JSON object with these exact fields:
{
  "name": string,
  "status": "safe" | "caution" | "harmful",
  "what_it_does": string (one line, simple language),
  "concern": string | null (specific concern for use in ${productType} by someone with ${skinType ?? 'unknown'} skin, not generic),
  "good_for_product_type": boolean,
  "reason_for_rating": string (one line explaining WHY this rating for THIS product type and user profile)
}

Also return:
{
  "ingredients": [...],
  "overall_score": number (1-10, be strict and realistic. Do not give high scores if product type mismatch. Eye cream with sunscreen filters = max 4/10. Product with many harmful ingredients = 1-3/10),
  "one_line_verdict": string (be honest, specific to the product type AND user's skin concerns, e.g. "Not suitable for acne-prone skin — contains 3 comedogenic ingredients"),
  "product_type_match": boolean (is this product actually suitable for use as ${productType}?),
  "dermatologist_note": string (one key professional tip referencing their specific skin type: ${skinType ?? 'unknown'} and concerns: ${skinConcerns.join(', ') || 'none'})
}

Return ONLY valid JSON. No markdown. No explanation. Be strict. User safety depends on your accuracy.`.trim();

  return [
    `You are a strict dermatologist and cosmetic chemist specializing in skincare and hair care safety.\n`,
    profileSection,
    `\nYou must evaluate EVERY ingredient specifically for use in a ${productType}. Do not give generic safety ratings — your ratings must reflect whether this ingredient is appropriate for this SPECIFIC product type and this user's profile.\n`,
    category === 'haircare' ? haircareRules : skincareRules,
    skinConcernRules ? `\n\n${skinConcernRules}` : '',
    `\n\n${profilePersonalisation}`,
    `\n\n${outputFormat}`,
  ].join('\n');
}

export let isApiLimitReached = false;

export function resetApiLimit() {
  isApiLimitReached = false;
}

async function analyzeIngredientImageBase64(
  base64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  productType: string,
  category: string,
): Promise<AnalysisResult> {
  logger.info('ClaudeService', 'Starting analysis');

  const netInfo = await NetInfo.fetch();
  logger.info('ClaudeService', 'Network type: ' + netInfo.type);
  if (!netInfo.isConnected) {
    throw new Error('No internet connection. Please check your network and try again.');
  }
  if (netInfo.type === 'cellular') {
    Toast.show({
      type: 'info',
      text1: 'You are on mobile data. Analysis may be slower.',
      position: 'bottom',
    });
  }

  const rawKey = process.env.ANTHROPIC_API_KEY;
  const key = normalizeApiKey(typeof rawKey === 'string' ? rawKey : '');
  if (!key) {
    logger.error('ClaudeService', 'Missing API Key');
    throw new Error('Something went wrong. Please restart the app.');
  }

  const systemPrompt = await buildSystemPrompt(productType, category);

  const body = {
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user' as const,
        content: [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text' as const,
            text: 'Analyze this product label and respond with only the JSON as instructed.',
          },
        ],
      },
    ],
  };

  const payload = JSON.stringify(body);
  let rawText = '';
  let lastStatus = 0;
  let attempt = 1;
  const maxAttempts = 2;

  while (attempt <= maxAttempts) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: payload,
        signal: controller.signal,
      });
      clearTimeout(id);

      rawText = await res.text();
      lastStatus = res.status;

      if (res.ok) break;

      if (res.status === 429) {
        isApiLimitReached = true;
        logger.warn('ClaudeService', 'API limit reached (429)');
        throw new Error('Our AI analyzer is taking a break. Please try again in a few hours.');
      }
      if (res.status === 401) {
        logger.error('ClaudeService', 'Unauthorized API access (401)');
        throw new Error('Something went wrong. Please restart the app.');
      }
      if (res.status >= 500) {
        if (attempt < maxAttempts) {
          logger.warn('ClaudeService', `Server error (${res.status}), retrying...`);
          await sleep(2000);
          attempt++;
          continue;
        } else {
          logger.error('ClaudeService', `Server error (${res.status}) after retry`);
          throw new Error('Analysis failed. Please try again.');
        }
      }

      logger.error('ClaudeService', `API failed with status ${res.status}`);
      throw new Error('Analysis failed. Please try again.');

    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (attempt < maxAttempts) {
          logger.warn('ClaudeService', 'Request timed out, retrying...');
          Toast.show({
            type: 'info',
            text1: 'Still analyzing, please wait...',
            position: 'bottom',
          });
          attempt++;
          continue;
        } else {
          logger.error('ClaudeService', 'Request timed out after retry');
          throw new Error('Request timed out. Check your internet connection.');
        }
      }
      if (
        err.message === 'Our AI analyzer is taking a break. Please try again in a few hours.' ||
        err.message === 'Something went wrong. Please restart the app.' ||
        err.message === 'Analysis failed. Please try again.' ||
        err.message === 'Request timed out. Check your internet connection.'
      ) {
        throw err;
      }
      logger.error('ClaudeService', 'Unexpected fetch error', err.message);
      throw new Error('Analysis failed. Please try again.');
    }
  }

  if (!rawText) {
    logger.error('ClaudeService', 'Empty response from API');
    throw new Error("Couldn't read the analysis. Please try again.");
  }

  try {
    const data = JSON.parse(rawText) as { content?: Array<{ type: string; text?: string }> };
    const textBlock = data.content?.find(c => c.type === 'text');
    const text = textBlock?.text;
    if (!text) throw new Error('No text content in Claude response');
    
    const parsed = parseAnalysisJson(text, productType);
    const validated = validateClaudeResponse(parsed);
    logger.info('ClaudeService', 'Analysis complete');
    return validated;
  } catch (err: any) {
    logger.error('ClaudeService', 'Failed to parse JSON response', err.message);
    throw new Error("Couldn't read the analysis. Please try again.");
  }
}

export async function analyzeIngredientPhoto(
  photoPath: string,
  productType: string,
  category: string,
): Promise<AnalysisResult> {
  const path = normalizePath(photoPath);
  const base64 = await RNFS.readFile(path, 'base64');
  const mediaType = guessMediaType(path);
  return analyzeIngredientImageBase64(base64, mediaType, productType, category);
}

export async function analyzeIngredientBase64Jpeg(
  base64: string,
  productType: string,
  category: string,
): Promise<AnalysisResult> {
  return analyzeIngredientImageBase64(base64, 'image/jpeg', productType, category);
}

export async function analyzeIngredientText(
  ingredientsText: string,
  productType: string,
  category: string,
): Promise<AnalysisResult> {
  // 1. Validate input BEFORE doing anything else
  const validatedText = validateIngredientText(ingredientsText);

  logger.info('ClaudeService', 'Starting text analysis');

  const netInfo = await NetInfo.fetch();
  logger.info('ClaudeService', 'Network type: ' + netInfo.type);
  if (!netInfo.isConnected) {
    throw new Error('No internet connection. Please check your network and try again.');
  }
  if (netInfo.type === 'cellular') {
    Toast.show({
      type: 'info',
      text1: 'You are on mobile data. Analysis may be slower.',
      position: 'bottom',
    });
  }

  const rawKey = process.env.ANTHROPIC_API_KEY;
  const key = normalizeApiKey(typeof rawKey === 'string' ? rawKey : '');
  if (!key) {
    logger.error('ClaudeService', 'Missing API Key');
    throw new Error('Something went wrong. Please restart the app.');
  }

  const systemPrompt = await buildSystemPrompt(productType, category);

  const body = {
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `Analyze this product ingredient list and respond with only the JSON as instructed.\n\nIngredients:\n${validatedText}`,
          },
        ],
      },
    ],
  };

  const payload = JSON.stringify(body);
  let rawText = '';
  let lastStatus = 0;
  let attempt = 1;
  const maxAttempts = 2;

  while (attempt <= maxAttempts) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: payload,
        signal: controller.signal,
      });
      clearTimeout(id);

      rawText = await res.text();
      lastStatus = res.status;

      if (res.ok) break;

      if (res.status === 429) {
        isApiLimitReached = true;
        logger.warn('ClaudeService', 'API limit reached (429)');
        throw new Error('Our AI analyzer is taking a break. Please try again in a few hours.');
      }
      if (res.status === 401) {
        logger.error('ClaudeService', 'Unauthorized API access (401)');
        throw new Error('Something went wrong. Please restart the app.');
      }
      if (res.status >= 500) {
        if (attempt < maxAttempts) {
          logger.warn('ClaudeService', `Server error (${res.status}), retrying...`);
          await sleep(2000);
          attempt++;
          continue;
        }
      }
      logger.error('ClaudeService', `API failed with status ${res.status}`);
      throw new Error('Analysis failed. Please try again.');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (attempt < maxAttempts) {
          logger.warn('ClaudeService', 'Request timed out, retrying...');
          Toast.show({
            type: 'info',
            text1: 'Still analyzing, please wait...',
            position: 'bottom',
          });
          attempt++;
          continue;
        } else {
          logger.error('ClaudeService', 'Request timed out after retry');
          throw new Error('Request timed out. Check your internet connection.');
        }
      }
      if (err.message.includes('analyzer') || err.message.includes('wrong') || err.message.includes('failed') || err.message.includes('timed out')) {
        throw err;
      }
      logger.error('ClaudeService', 'Unexpected fetch error', err.message);
      throw new Error('Analysis failed. Please try again.');
    }
  }

  if (!rawText) {
    logger.error('ClaudeService', 'Empty response from API');
    throw new Error("Couldn't read the analysis. Please try again.");
  }

  try {
    const data = JSON.parse(rawText) as { content?: Array<{ type: string; text?: string }> };
    const textBlock = data.content?.find(c => c.type === 'text');
    const text = textBlock?.text;
    if (!text) throw new Error('No text content in Claude response');
    
    const parsed = parseAnalysisJson(text, productType);
    const validated = validateClaudeResponse(parsed);
    logger.info('ClaudeService', 'Analysis complete');
    return validated;
  } catch (err: any) {
    logger.error('ClaudeService', 'Failed to parse JSON response', err.message);
    throw new Error("Couldn't read the analysis. Please try again.");
  }
}
