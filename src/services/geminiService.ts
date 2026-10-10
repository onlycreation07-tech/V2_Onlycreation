import { apiFetch } from './apiClient';
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
      const res = await apiFetch('/api/ai/generate', {
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
        throw new Error(errorJson.error || 'Ad generation failed');
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
    } catch (error) {
      throw error;
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
    const res = await apiFetch('/api/ai/image-generate', {
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
    aspectRatio: '1:1' | '9:16' | '16:9' | '4:3' | '3:4' = '1:1',
    model: 'gemini-nano-banana-2.1' | 'gemini-3.1-flash-lite-image' = 'gemini-nano-banana-2.1',
    imageSize: '1K' | '2K' = '1K'
  ): Promise<{ imageUrl: string; caption?: string; modelUsed: string }> {
    const uid = auth.currentUser?.uid;
    const res = await apiFetch('/api/ai/image-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        image: { data: imageBase64, mimeType },
        aspectRatio,
        model,
        imageSize,
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
    model?: 'veo-3.1-generate-preview' | 'veo-3.1-fast-generate-preview' | 'veo-3.1-lite-generate-preview';
  }): Promise<{ operationName: string; model: string; aspectRatio: string }> {
    const uid = auth.currentUser?.uid;
    const res = await apiFetch('/api/ai/video-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ ...params, uid })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to initiate video generation');
    }

    return await res.json();
  },

  async checkVideoStatus(operationName: string): Promise<{ done: boolean; status: string; progress?: number; error?: string }> {
    const res = await apiFetch('/api/ai/video-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Could not check video status');
    }
    return await res.json();
  },

  async downloadVideo(operationName: string): Promise<string> {
    const res = await apiFetch('/api/ai/video-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName })
    });

    const data = await res.json();
    if (!res.ok || !data.videoUrl) throw new Error(data.error || 'Video is not ready');
    return data.videoUrl;
  },

  // 5. GOOGLE SEARCH GROUNDING (gemini-3.5-flash with googleSearch)
  async searchGrounding(query: string): Promise<{ answer: string; sources: GroundingSource[]; modelUsed: string }> {
    const uid = auth.currentUser?.uid;
    const res = await apiFetch('/api/ai/search-grounding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, uid })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI request failed');
    return {
      answer: data.answer || '',
      sources: data.sources || [],
      modelUsed: data.modelUsed || 'gemini-3.8-flash'
    };
  },

  // 6. GOOGLE MAPS GROUNDING (gemini-3.5-flash with googleMaps)
  async mapsGrounding(query: string, latLng?: { latitude: number; longitude: number }): Promise<{ answer: string; places: GroundingSource[]; modelUsed: string }> {
    const uid = auth.currentUser?.uid;
    const res = await apiFetch('/api/ai/maps-grounding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, latLng, uid })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI request failed');
    return {
      answer: data.answer || '',
      places: data.places || [],
      modelUsed: data.modelUsed || 'gemini-3.8-flash'
    };
  },

  // 7. GEMINI CHATBOT (gemini-3.1-pro-preview / gemini-3.5-flash / gemini-3.1-flash-lite)
  async chat(
    messages: Array<{ role: 'user' | 'model'; text: string }>,
    systemInstruction?: string,
    modelTier: 'complex' | 'general' | 'fast' = 'general'
  ): Promise<{ reply: string; modelUsed: string }> {
    const uid = auth.currentUser?.uid;
    const res = await apiFetch('/api/ai/chat', {
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
    const res = await apiFetch('/api/ai/transcribe', {
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
    const res = await apiFetch('/api/ai/generate-music', {
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

    const res = await apiFetch('/api/ai/analyze-health', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, uid })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Project analysis failed');
    return data.data;
  }
};
