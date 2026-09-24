import type { ImageModel, ImageQuality, ImageSize } from '../types';

export interface PricingTier {
  model: ImageModel;
  name: string;
  badge?: string;
  quality?: ImageQuality;
  size?: ImageSize | string;
  costPerImage: number;
  imagesPerDollar: number;
  imagesPerFiveDollars: number;
  description: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    model: 'gpt-image-1-mini',
    name: 'GPT Image 1 Mini',
    badge: 'الأرخص والاقتصادي 🔥',
    costPerImage: 0.005,
    imagesPerDollar: 200,
    imagesPerFiveDollars: 1000,
    description: 'سعر مذهل ($0.005 فقط)، مثالي لإنتاج كميات ضخمة من الصور بأقل تكلفة ممكنة.',
  },
  {
    model: 'gpt-image-1.5',
    name: 'GPT Image 1.5',
    badge: 'الرائد والأحدث ⚡',
    costPerImage: 0.04,
    imagesPerDollar: 25,
    imagesPerFiveDollars: 125,
    description: 'الجيل الأحدث تكلفة وكفاءة وتماسكاً في اتباع الأوصاف المعقدة.',
  },
  {
    model: 'gpt-image-1',
    name: 'GPT Image 1 (الجودة المتوازنة)',
    badge: 'جودة متوازنة',
    quality: 'standard',
    costPerImage: 0.042,
    imagesPerDollar: 23.8,
    imagesPerFiveDollars: 119,
    description: 'موديل قياسي متوازن يعطي جودة ممتازة وسرعة توليد عالية.',
  },
  {
    model: 'gpt-image-1',
    name: 'GPT Image 1 (الجودة العالية الفائقة)',
    badge: 'أعلى دقة تفاصيل ✨',
    quality: 'high',
    costPerImage: 0.167,
    imagesPerDollar: 6.0,
    imagesPerFiveDollars: 29,
    description: 'أعلى جودة ممكنة للتصاميم الفنية المعقدة والإعلانات عالية الدقة.',
  },
  {
    model: 'dall-e-3',
    name: 'DALL·E 3 (Standard 1024×1024)',
    badge: 'DALL·E الكلاسيكي',
    quality: 'standard',
    size: '1024x1024',
    costPerImage: 0.04,
    imagesPerDollar: 25,
    imagesPerFiveDollars: 125,
    description: 'الموديل الشهير بفهم الأوصاف الطويلة ودعم أبعاد 16:9 و 9:16.',
  },
  {
    model: 'dall-e-3',
    name: 'DALL·E 3 (HD فائقة 1024×1024)',
    badge: 'DALL·E HD',
    quality: 'hd',
    size: '1024x1024',
    costPerImage: 0.08,
    imagesPerDollar: 12.5,
    imagesPerFiveDollars: 62.5,
    description: 'نسخة HD فائقة النقاء للأعمال التي تتطلب وضوحاً إضافياً.',
  },
  {
    model: 'dall-e-2',
    name: 'DALL·E 2 (1024×1024)',
    badge: 'توليد سريع',
    size: '1024x1024',
    costPerImage: 0.02,
    imagesPerDollar: 50,
    imagesPerFiveDollars: 250,
    description: 'خيار اقتصادي وسريع جداً للمسودات.',
  },
];

export function getPricePerImage(
  model: ImageModel,
  size?: ImageSize,
  quality: ImageQuality = 'standard'
): { cost: number; imagesPerDollar: number; imagesPerFiveDollars: number } {
  // Check exact matches in tiers first
  if (model === 'gpt-image-1-mini') {
    return { cost: 0.005, imagesPerDollar: 200, imagesPerFiveDollars: 1000 };
  }
  if (model === 'gpt-image-1.5') {
    return { cost: 0.04, imagesPerDollar: 25, imagesPerFiveDollars: 125 };
  }
  if (model === 'gpt-image-1') {
    if (quality === 'high' || quality === 'hd') {
      return { cost: 0.167, imagesPerDollar: 6.0, imagesPerFiveDollars: 29 };
    }
    return { cost: 0.042, imagesPerDollar: 23.8, imagesPerFiveDollars: 119 };
  }

  if (model === 'dall-e-3') {
    const isWidescreen = size === '1792x1024' || size === '1024x1792';
    if (quality === 'hd') {
      const cost = isWidescreen ? 0.12 : 0.08;
      return {
        cost,
        imagesPerDollar: Math.floor((1 / cost) * 10) / 10,
        imagesPerFiveDollars: Math.floor((5 / cost) * 10) / 10,
      };
    } else {
      const cost = isWidescreen ? 0.08 : 0.04;
      return {
        cost,
        imagesPerDollar: Math.floor((1 / cost) * 10) / 10,
        imagesPerFiveDollars: Math.floor((5 / cost) * 10) / 10,
      };
    }
  }

  // DALL-E 2
  if (size === '512x512') return { cost: 0.018, imagesPerDollar: 55, imagesPerFiveDollars: 277 };
  if (size === '256x256') return { cost: 0.016, imagesPerDollar: 62, imagesPerFiveDollars: 312 };
  if (model === 'dall-e-2') return { cost: 0.02, imagesPerDollar: 50, imagesPerFiveDollars: 250 };

  // Default fallback for custom model
  return { cost: 0.04, imagesPerDollar: 25, imagesPerFiveDollars: 125 };
}
