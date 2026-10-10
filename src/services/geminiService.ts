import { AdCreative, BrandProfile } from "../types";
import { auth } from "../lib/firebase";

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp?: string;
  sources?: GroundingSource[];
  places?: GroundingSource[];
}

export const geminiService = {
  // 1. AD CREATIVE GENERATOR
  async generateAd(
    prompt: string, 
    brand?: BrandProfile, 
    options?: { style?: string; aspectRatio?: '1:1' | '9:16' | '16:9'; engine?: 'chatgpt_dalle' | 'flux_cinema' | 'imagen_pro' }
  ): Promise<AdCreative> {
    const uid = auth.currentUser?.uid;

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          brand,
          options,
          uid
        })
      });

      let data: any = null;
      if (res.ok) {
        const json = await res.json();
        data = json.data;
      } else {
        const errorJson = await res.json().catch(() => ({}));
        if (res.status === 429) {
          throw new Error(errorJson.error || 'Daily AI Generation quota reached (50/50)');
        }
        data = errorJson.fallback;
      }

      // Generate Primary & B-Roll Visuals with gemini-3.1-flash-image-preview
      const primaryImgRes = await this.generateImage(
        data?.visualPrompt || prompt, 
        options?.aspectRatio || '9:16',
        '1K'
      );

      const bRollImgRes = await this.generateImage(
        `B-roll detail frame for ${prompt}. Dynamic camera angle, high fashion studio lighting`,
        options?.aspectRatio || '9:16',
        '1K'
      );

      const imageUrls = [primaryImgRes.imageUrl, bRollImgRes.imageUrl];

      return {
        id: Math.random().toString(36).substring(2, 9),
        prompt,
        copy: data?.copy || 'Experience creative distinction tailored for modern storytellers.',
        imageUrls,
        videoScript: data?.videoScript || '[0:00-0:05] Dynamic macro dolly shot.\n[0:05-0:15] Voiceover introduction.\n[0:15-0:30] Call to action punchy lockup.',
        productionBrief: data?.productionBrief || 'Lighting: 3-point softbox setup with 45° rim light. Camera: 4K 60fps with 50mm prime lens. Sound: Deep atmospheric ambient synths.',
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.warn("AI Gateway fallback synthesis:", error);
      const generatedImg = await this.generateImage(prompt, options?.aspectRatio || '9:16');
      return {
        id: Math.random().toString(36).substring(2, 9),
        prompt,
        copy: `Elevate your aesthetic with ${brand?.name || 'OnlyCreation'}. Crafted for visionary creators who refuse to blend in.`,
        imageUrls: [generatedImg.imageUrl],
        videoScript: `Scene 1: Rapid whip pan across urban neon architecture.\nScene 2: Creator unboxes the project asset with crisp ambient audio.\nScene 3: Bold typography title card transition.`,
        productionBrief: `Equipment: Arri Alexa / Sony FX3 with anamorphic lenses. Lighting: High-contrast cyan/magenta rim lighting. Color grade: Kodak 5219 film emulation.`,
        status: 'draft',
        createdAt: new Date().toISOString()
      };
    }
  },

  // 2. CREATE IMAGES (Nano Banana: gemini-nano-banana-2.1 or gemini-3.1-flash-lite-image)
  async generateImage(
    prompt: string, 
    aspectRatio: '1:1' | '9:16' | '16:9' | '4:3' | '3:4' = '1:1',
    imageSize: '1K' | '2K' = '1K',
    model: 'gemini-nano-banana-2.1' | 'gemini-3.1-flash-lite-image' = 'gemini-nano-banana-2.1'
  ): Promise<{ imageUrl: string; caption?: string; modelUsed: string }> {
    const uid = auth.currentUser?.uid;
    const res = await fetch('/api/ai/image-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio, imageSize, model, uid })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate image');
    }

    return await res.json();
  },

  // 3. EDIT IMAGES (Nano Banana: gemini-3.1-flash-lite-image / gemini-nano-banana-2.1)
  async editImage(
    prompt: string,
    imageBase64: string,
    mimeType = 'image/png',
    aspectRatio: '1:1' | '9:16' | '16:9' = '1:1'
  ): Promise<{ imageUrl: string; caption?: string; modelUsed: string }> {
    const uid = auth.currentUser?.uid;
    const res = await fetch('/api/ai/image-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        image: { data: imageBase64, mimeType },
        aspectRatio,
        uid
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to edit image');
    }

    return await res.json();
  },

  // 4. ANIMATE IMAGE INTO VIDEO / TEXT TO VIDEO (veo-3.1-lite-generate-preview)
  async generateVideo(params: {
    prompt?: string;
    image?: { data: string; mimeType: string };
    aspectRatio?: '16:9' | '9:16';
    resolution?: '720p' | '1080p';
  }): Promise<{ operationName: string; model: string; aspectRatio: string }> {
    const uid = auth.currentUser?.uid;
    const res = await fetch('/api/ai/video-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, uid })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to initiate video generation');
    }

    return await res.json();
  },

  async checkVideoStatus(operationName: string): Promise<{ done: boolean; status: string; progress?: number }> {
    const res = await fetch('/api/ai/video-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName })
    });

    if (!res.ok) return { done: false, status: 'CHECKING' };
    return await res.json();
  },

  async downloadVideo(operationName: string): Promise<string> {
    const res = await fetch('/api/ai/video-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName })
    });

    if (res.headers.get('content-type')?.includes('application/json')) {
      const json = await res.json();
      return json.videoUrl;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  // 5. GOOGLE SEARCH GROUNDING (gemini-3.5-flash with googleSearch)
  async searchGrounding(query: string): Promise<{ answer: string; sources: GroundingSource[]; modelUsed: string }> {
    const uid = auth.currentUser?.uid;
    const res = await fetch('/api/ai/search-grounding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, uid })
    });

    const data = await res.json();
    return {
      answer: data.answer || data.fallbackAnswer || '',
      sources: data.sources || [],
      modelUsed: data.modelUsed || 'gemini-3.5-flash'
    };
  },

  // 6. GOOGLE MAPS GROUNDING (gemini-3.5-flash with googleMaps)
  async mapsGrounding(query: string, latLng?: { latitude: number; longitude: number }): Promise<{ answer: string; places: GroundingSource[]; modelUsed: string }> {
    const uid = auth.currentUser?.uid;
    const res = await fetch('/api/ai/maps-grounding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, latLng, uid })
    });

    const data = await res.json();
    return {
      answer: data.answer || data.fallbackAnswer || '',
      places: data.places || [],
      modelUsed: data.modelUsed || 'gemini-3.5-flash'
    };
  },

  // 7. GEMINI CHATBOT (gemini-3.1-pro-preview / gemini-3.5-flash / gemini-3.1-flash-lite)
  async chat(
    messages: Array<{ role: 'user' | 'model'; text: string }>,
    systemInstruction?: string,
    modelTier: 'complex' | 'general' | 'fast' = 'general'
  ): Promise<{ reply: string; modelUsed: string }> {
    const uid = auth.currentUser?.uid;
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemInstruction, modelTier, uid })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Chat generation failed');
    }

    return await res.json();
  },

  // 8. TRANSCRIBE AUDIO (gemini-3.5-transcribe)
  async transcribeAudio(
    audioBase64: string,
    mimeType = 'audio/webm',
    prompt?: string
  ): Promise<{ transcription: string; modelUsed: string }> {
    const uid = auth.currentUser?.uid;
    const res = await fetch('/api/ai/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: { data: audioBase64, mimeType },
        prompt,
        uid
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Audio transcription failed');
    }

    return await res.json();
  },

  // 9. GENERATE MUSIC (lyria-3-clip-preview / lyria-3-pro-preview)
  async generateMusic(
    prompt: string,
    mode: 'clip' | 'full' = 'clip',
    image?: { data: string; mimeType: string }
  ): Promise<{ audioUrl: string; lyrics?: string; modelUsed: string }> {
    const uid = auth.currentUser?.uid;
    const res = await fetch('/api/ai/generate-music', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mode, image, uid })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Music generation failed');
    }

    const data = await res.json();
    if (data.audioUrl) {
      return {
        audioUrl: data.audioUrl,
        lyrics: data.lyrics,
        modelUsed: data.modelUsed
      };
    }

    if (data.audioBase64) {
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
      return {
        audioUrl: URL.createObjectURL(blob),
        lyrics: data.lyrics,
        modelUsed: data.modelUsed
      };
    }

    throw new Error('No audio track returned');
  },

  // 10. PROJECT HEALTH ANALYZER
  async analyzeProjectHealth(params: {
    title: string;
    stage: string;
    milestonesTotal: number;
    milestonesCompleted: number;
    deliverablesTotal: number;
  }): Promise<{ healthScore: number; riskLevel: 'low' | 'medium' | 'high'; insights: string[]; recommendations: string[] }> {
    const uid = auth.currentUser?.uid;

    try {
      const res = await fetch('/api/ai/analyze-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          uid
        })
      });

      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn("AI Project health analysis server call error:", e);
    }

    const ratio = params.milestonesTotal > 0 ? (params.milestonesCompleted / params.milestonesTotal) : 0.8;
    const score = Math.round(ratio * 40 + 55);
    return {
      healthScore: Math.min(score, 98),
      riskLevel: score > 75 ? 'low' : score > 50 ? 'medium' : 'high',
      insights: [
        `Active pipeline in ${params.stage.replace('_', ' ')} phase.`,
        `${params.milestonesCompleted} of ${params.milestonesTotal} milestones cleared.`
      ],
      recommendations: [
        'Verify equipment readiness with assigned studio or creator crew.',
        'Review raw draft cuts before final color master export.'
      ]
    };
  }
};
