import { Request } from 'express';

export interface AuthUser {
  uid: string;
  email?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  rawBody?: Buffer;
}

export interface StudioPricingRequest {
  studioId: string;
  hours: number;
  date: string;
  addons?: string[];
}

export interface StudioPricingResponse {
  studioId: string;
  hours: number;
  pricePerHour: number;
  basePrice: number;
  addons: Array<{ name: string; price: number }>;
  addonPrice: number;
  subtotal: number;
  tax: number;
  totalPrice: number;
  currency: string;
}

export interface DispatchPricingRequest {
  creatorTier: 'reel_creator' | 'videographer' | 'video_editor' | 'agency_crew' | 'rental_express';
  durationHours: number;
  equipmentAddons?: string[];
}

export interface DispatchPricingResponse {
  creatorTier: string;
  durationHours: number;
  basePrice: number;
  hourlyRate: number;
  hourlyTotal: number;
  equipmentTotal: number;
  subtotal: number;
  platformFee: number;
  totalPrice: number;
  currency: string;
}

export interface BookingLock {
  lockId: string;
  studioId: string;
  date: string;
  slotHour?: number;
  lockedBy: string;
  lockedAt: string;
  expiresAt: string;
  status: 'locked' | 'confirmed' | 'expired' | 'released';
}

export interface ProductionBrief {
  id: string;
  userId: string;
  title: string;
  logline: string;
  targetAudience: string;
  industry: string;
  visualStyle: {
    lighting: string;
    framing: string;
    cameraMovement: string;
    colorPalette: string[];
    pacing: string;
    mood: string;
  };
  extractedRequirements: {
    shootSetType: string;
    recommendedEquipment: string[];
    crewRoles: Array<{ role: string; count: number; description: string }>;
    estimatedDurationHours: number;
    budgetEstimateInr: number;
  };
  referenceVideoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectPhase = 
  | 'ideation' 
  | 'pre_production' 
  | 'production' 
  | 'post_production' 
  | 'client_review' 
  | 'approved';

export interface DeliverableVersion {
  versionId: string;
  versionNumber: string; // e.g. "v1.0", "v1.1", "v2.0 Final"
  title: string;
  videoUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  changelog: string;
  status: 'pending_review' | 'revision_requested' | 'approved';
}

export interface TimestampComment {
  id: string;
  userId: string;
  authorName: string;
  timestampSeconds: number;
  comment: string;
  createdAt: string;
  resolved: boolean;
}
