import { Response } from 'express';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { AuthenticatedRequest } from '../types';
import { 
  AdBriefQuestionnaire, 
  CreativeDirection, 
  GeneratedAdResult 
} from '../../src/types';

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Helper for aspect ratio mapping
function mapPlacementToAspectRatio(placement: string): '9:16' | '1:1' | '16:9' | '4:5' {
  switch (placement) {
    case 'instagram_story':
    case 'tiktok_9_16':
      return '9:16';
    case 'youtube_landscape':
      return '16:9';
    case 'facebook_feed':
      return '4:5';
    case 'instagram_feed':
    case 'billboard_display':
    default:
      return '1:1';
  }
}

// ---------------------------------------------------------------------------
// 1. PROPOSE 2 CREATIVE DIRECTIONS VIA GEMINI 3.8 FLASH
// ---------------------------------------------------------------------------
export async function handleProposeDirections(req: AuthenticatedRequest, res: Response) {
  try {
    const brief: AdBriefQuestionnaire = req.body.brief;
    const brandProfile = req.body.brandProfile || {};

    if (!brief || !brief.productOrService || !brief.targetCustomer) {
      return res.status(400).json({ error: 'Missing essential brief information.' });
    }

    const systemInstruction = `You are an elite Creative Director at a world-class advertising agency.
Your task is to analyze a client advertising brief and propose TWO distinct, high-converting creative directions.
Do NOT fabricate exaggerated claims, fake discounts, or false testimonials.
Design each direction around real human psychology, clear visual hierarchy, and actionable benefit.

Format your response strictly as JSON conforming to the requested schema.`;

    const prompt = `Client Advertising Brief:
- Product/Service: ${brief.productOrService} (${brief.category || 'General'})
- Target Customer: ${brief.targetCustomer}
- Core Problem to Solve: ${brief.customerProblem}
- Offer & Price: ${brief.offerAndPrice || 'Standard offering'}
- Main Key Benefit: ${brief.mainBenefit}
- Primary Ad Placement: ${brief.placement} (${mapPlacementToAspectRatio(brief.placement)})
- Desired Action / CTA: ${brief.actionOrCta}
- Language: ${brief.language || 'English'}
- Visual Aesthetic Style: ${brief.visualStyle}
- Brand Name: ${brandProfile.name || 'Our Brand'}
- Brand Tone: ${brandProfile.tone || 'Modern, direct, authoritative'}
- Product Photo Preserved: ${brief.preserveProductPhotoUnchanged ? 'YES (Product must remain original and untouched in composition)' : 'NO (AI re-imagined scene)'}

Generate exactly TWO contrasting creative directions:
Direction 1: "Problem-Agitation & Direct Benefit" (Bold, direct hook confronting the user's immediate struggle)
Direction 2: "Aspirational Transformation & Social Proof" (Lifestyle-centric, showing the payoff and elevated standard)

For each direction provide:
- directionTitle: Short name for the creative route
- hookHeadline: Punchy 4-8 word headline
- visualConcept: Concrete visual description of the hero image, placement-safe margins, and lighting
- supportingCopy: 1-2 sentence high-impact body copy
- callToAction: Clear, actionable 2-4 word CTA button copy
- recommendedColors: Array of 2-3 hex codes or color names matching the mood
- rationale: 1 sentence explaining why this direction converts for this audience`;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        directions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              directionTitle: { type: Type.STRING },
              hookHeadline: { type: Type.STRING },
              visualConcept: { type: Type.STRING },
              supportingCopy: { type: Type.STRING },
              callToAction: { type: Type.STRING },
              recommendedColors: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              rationale: { type: Type.STRING }
            },
            required: ['directionTitle', 'hookHeadline', 'visualConcept', 'supportingCopy', 'callToAction', 'recommendedColors', 'rationale']
          }
        }
      },
      required: ['directions']
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.7
      }
    });

    const parsed = JSON.parse(response.text || '{"directions": []}');
    const directions: CreativeDirection[] = (parsed.directions || []).map((dir: any, idx: number) => ({
      ...dir,
      id: dir.id || `dir_${Date.now()}_${idx + 1}`
    }));

    return res.json({ success: true, directions });
  } catch (err: any) {
    console.error('[AdWizard] propose directions error:', err);
    return res.status(500).json({ error: err.message || 'Failed to synthesize creative directions.' });
  }
}

// ---------------------------------------------------------------------------
// 2. GENERATE ACTUAL AD IMAGE VIA GEMINI 3.1 FLASH LITE IMAGE
// ---------------------------------------------------------------------------
export async function handleGenerateAd(req: AuthenticatedRequest, res: Response) {
  try {
    const brief: AdBriefQuestionnaire = req.body.brief;
    const direction: CreativeDirection = req.body.selectedDirection;
    const brandProfile = req.body.brandProfile || {};

    if (!brief || !direction) {
      return res.status(400).json({ error: 'Brief and selected creative direction are required.' });
    }

    const aspectRatio = mapPlacementToAspectRatio(brief.placement);

    // Build focused commercial image prompt
    const imagePrompt = `High-end commercial advertisement for ${brief.productOrService}.
Visual Concept: ${direction.visualConcept}.
Style: Professional commercial photography, ${brief.visualStyle.replace(/_/g, ' ')}, clean visual hierarchy.
Subject: Crisp, high-detail hero product presentation with safe placement margins for ad typography.
Lighting: Professional soft studio lighting, balanced contrast, premium finish.
Composition: Clean negative space reserved for typography headline "${direction.hookHeadline}" and CTA button "${direction.callToAction}".
Do NOT include messy gibberish text or watermarks in the background image.`;

    // Map to supported AspectRatio for Gemini image models: '1:1', '3:4', '4:3', '9:16', '16:9'
    let geminiRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '1:1';
    if (aspectRatio === '9:16') geminiRatio = '9:16';
    else if (aspectRatio === '16:9') geminiRatio = '16:9';
    else if (aspectRatio === '4:5') geminiRatio = '3:4';

    console.log(`[AdWizard] Generating commercial image with prompt: "${imagePrompt.slice(0, 100)}..." (Ratio: ${geminiRatio})`);

    const imageResponse = await ai.models.generateImages({
      model: 'gemini-3.1-flash-lite-image',
      prompt: imagePrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: geminiRatio
      }
    });

    const generatedBase64 = imageResponse.generatedImages?.[0]?.image?.imageBytes;
    if (!generatedBase64) {
      throw new Error('Image generation completed but no image bytes were returned by the provider.');
    }

    const imageUrl = `data:image/jpeg;base64,${generatedBase64}`;

    const adResult: GeneratedAdResult = {
      id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      imageUrl,
      creativeDirectionId: direction.id,
      directionTitle: direction.directionTitle,
      headline: direction.hookHeadline,
      supportingCopy: direction.supportingCopy,
      offerText: brief.offerAndPrice || '',
      ctaText: direction.callToAction,
      placement: brief.placement,
      aspectRatio,
      visualStyle: brief.visualStyle,
      headlineStyle: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: aspectRatio === '9:16' ? 36 : 28,
        color: '#FFFFFF',
        positionY: 18 // top 18%
      },
      ctaStyle: {
        backgroundColor: direction.recommendedColors?.[0] || '#7C3AED',
        textColor: '#FFFFFF',
        positionY: 82 // bottom 82%
      },
      preservedProduct: brief.preserveProductPhotoUnchanged,
      createdAt: new Date().toISOString()
    };

    return res.json({ success: true, ad: adResult });
  } catch (err: any) {
    console.error('[AdWizard] generate ad error:', err);
    return res.status(500).json({ 
      error: err.message || 'Image generation failed. Ensure your Gemini API key is configured with image generation quota.' 
    });
  }
}

// ---------------------------------------------------------------------------
// 3. GENERATE AD VARIATION OR ADAPT TO ANOTHER PLACEMENT
// ---------------------------------------------------------------------------
export async function handleGenerateVariation(req: AuthenticatedRequest, res: Response) {
  try {
    const { existingAd, targetPlacement, styleOverride, newHeadline } = req.body;

    if (!existingAd) {
      return res.status(400).json({ error: 'Existing ad data is required.' });
    }

    const newPlacement = targetPlacement || existingAd.placement;
    const aspectRatio = mapPlacementToAspectRatio(newPlacement);

    let geminiRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '1:1';
    if (aspectRatio === '9:16') geminiRatio = '9:16';
    else if (aspectRatio === '16:9') geminiRatio = '16:9';
    else if (aspectRatio === '4:5') geminiRatio = '3:4';

    const prompt = `Commercial product advertisement variation.
Title: ${existingAd.directionTitle}.
Headline: ${newHeadline || existingAd.headline}.
Style: ${styleOverride || existingAd.visualStyle}.
Clean placement-safe margins for ${newPlacement}. High-end commercial look.`;

    const imageResponse = await ai.models.generateImages({
      model: 'gemini-3.1-flash-lite-image',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: geminiRatio
      }
    });

    const generatedBase64 = imageResponse.generatedImages?.[0]?.image?.imageBytes;
    if (!generatedBase64) {
      throw new Error('Image variation completed but no image bytes were returned.');
    }

    const imageUrl = `data:image/jpeg;base64,${generatedBase64}`;

    const updatedAd: GeneratedAdResult = {
      ...existingAd,
      id: `ad_var_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      imageUrl,
      headline: newHeadline || existingAd.headline,
      placement: newPlacement,
      aspectRatio,
      visualStyle: styleOverride || existingAd.visualStyle,
      createdAt: new Date().toISOString()
    };

    return res.json({ success: true, ad: updatedAd });
  } catch (err: any) {
    console.error('[AdWizard] variation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate ad variation.' });
  }
}
