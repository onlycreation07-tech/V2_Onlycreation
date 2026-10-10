import { Request, Response } from 'express';
import { 
  StudioPricingRequest, 
  StudioPricingResponse, 
  DispatchPricingRequest, 
  DispatchPricingResponse 
} from '../types';

// Authoritative Studio Rate Catalog
export const STUDIO_CATALOG: Record<string, { name: string; pricePerHour: number; category: string }> = {
  'loft-daylight-bandra': { name: 'The Daylight Loft • Bandra', pricePerHour: 3500, category: 'photography' },
  'infinity-cove-andheri': { name: 'Infinity Cyclorama • Andheri', pricePerHour: 4500, category: 'video' },
  'audio-sanctuary-juhu': { name: 'Acoustic Soundstage • Juhu', pricePerHour: 2800, category: 'podcast' },
  'cyberpunk-neon-goregaon': { name: 'Cyberpunk Neon Studio • Goregaon', pricePerHour: 4000, category: 'music' },
  'editorial-minimal-worli': { name: 'Editorial Minimalist Loft • Worli', pricePerHour: 5000, category: 'photography' },
  'virtual-prod-stage': { name: 'LED Volume Virtual Stage • BKC', pricePerHour: 12000, category: 'video' }
};

// Authoritative Studio Addons
export const STUDIO_ADDONS: Record<string, number> = {
  'lighting_kit_pro': 1500,
  'camera_package_fx3': 3500,
  'sound_operator': 2000,
  'green_room_vanity': 1000,
  'high_speed_wifi_wired': 500
};

// Authoritative Dispatch Tier Rates
export const DISPATCH_TIERS: Record<string, { basePrice: number; hourlyRate: number; label: string }> = {
  'reel_creator': { basePrice: 2500, hourlyRate: 1000, label: 'iPhone 16 Pro Gimbal Creator' },
  'videographer': { basePrice: 6000, hourlyRate: 2500, label: 'Cinema Videographer (Sony FX3 / 4K)' },
  'video_editor': { basePrice: 3000, hourlyRate: 1200, label: 'Remote Fast-Turnaround Editor' },
  'agency_crew': { basePrice: 15000, hourlyRate: 5000, label: 'Full Commercial Production Crew' },
  'rental_express': { basePrice: 4000, hourlyRate: 1500, label: 'Camera & Lighting Express Van' }
};

export const DISPATCH_ADDONS: Record<string, number> = {
  'wireless_mic_duo': 800,
  'dji_drone_4k': 2500,
  'teleprompter_rig': 1200,
  'aputure_lighting_set': 1800,
  'same_day_delivery_rush': 2000
};

/**
 * Calculates authoritative price for a studio booking
 */
export function calculateStudioPrice(data: StudioPricingRequest): StudioPricingResponse {
  const { studioId, hours, addons = [] } = data;

  if (!studioId) throw new Error('studioId is required');
  const duration = Math.max(1, Math.min(24, Number(hours) || 1));

  // Lookup studio or use default standard rate
  const studio = STUDIO_CATALOG[studioId] || { name: 'Custom Studio Space', pricePerHour: 3500, category: 'video' };
  const pricePerHour = studio.pricePerHour;
  const basePrice = pricePerHour * duration;

  // Calculate Add-ons
  const resolvedAddons: Array<{ name: string; price: number }> = [];
  let addonPrice = 0;

  for (const addonKey of addons) {
    if (STUDIO_ADDONS[addonKey]) {
      resolvedAddons.push({ name: addonKey, price: STUDIO_ADDONS[addonKey] });
      addonPrice += STUDIO_ADDONS[addonKey];
    }
  }

  const subtotal = basePrice + addonPrice;
  const tax = Math.round(subtotal * 0.18); // 18% GST standard in India
  const totalPrice = subtotal + tax;

  return {
    studioId,
    hours: duration,
    pricePerHour,
    basePrice,
    addons: resolvedAddons,
    addonPrice,
    subtotal,
    tax,
    totalPrice,
    currency: 'INR'
  };
}

/**
 * Calculates authoritative price for a creator dispatch booking
 */
export function calculateDispatchPrice(data: DispatchPricingRequest): DispatchPricingResponse {
  const { creatorTier, durationHours, equipmentAddons = [] } = data;

  const tier = DISPATCH_TIERS[creatorTier] || DISPATCH_TIERS['reel_creator'];
  const duration = Math.max(1, Math.min(16, Number(durationHours) || 2));

  const basePrice = tier.basePrice;
  const hourlyRate = tier.hourlyRate;
  const hourlyTotal = hourlyRate * duration;

  let equipmentTotal = 0;
  for (const item of equipmentAddons) {
    if (DISPATCH_ADDONS[item]) {
      equipmentTotal += DISPATCH_ADDONS[item];
    }
  }

  const subtotal = basePrice + hourlyTotal + equipmentTotal;
  const platformFee = Math.round(subtotal * 0.10); // 10% platform protection & dispatch fee
  const totalPrice = subtotal + platformFee;

  return {
    creatorTier,
    durationHours: duration,
    basePrice,
    hourlyRate,
    hourlyTotal,
    equipmentTotal,
    subtotal,
    platformFee,
    totalPrice,
    currency: 'INR'
  };
}

/**
 * Express handler for POST /api/pricing/calculate-studio
 */
export function handleCalculateStudioPrice(req: Request, res: Response) {
  try {
    const result = calculateStudioPrice(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Price calculation failed' });
  }
}

/**
 * Express handler for POST /api/pricing/calculate-dispatch
 */
export function handleCalculateDispatchPrice(req: Request, res: Response) {
  try {
    const result = calculateDispatchPrice(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Dispatch price calculation failed' });
  }
}
