export type StakeholderRole = 
  | 'reel_creator' 
  | 'videographer' 
  | 'video_editor' 
  | 'studio_owner' 
  | 'rental_vendor' 
  | 'agency_owner';

export interface PartnerProfile {
  id: string;
  name: string;
  role: StakeholderRole;
  phone: string;
  email: string;
  avatar: string;
  rating: number;
  completedJobs: number;
  activeJobsCount: number;
  walletBalance: number;
  totalEarnings: number;
  equipmentSummary: string;
  city: string;
  isVerified: boolean;
  trainingProgressPct: number;
}

export type GigStatus = 
  | 'available' 
  | 'accepted' 
  | 'on_the_way' 
  | 'shooting' 
  | 'footage_uploaded' 
  | 'editing_in_progress' 
  | 'master_delivered' 
  | 'completed' 
  | 'cancelled';

export interface PartnerGig {
  id: string;
  title: string;
  clientName: string;
  clientHandle: string;
  location: string;
  roleRequired: StakeholderRole;
  payoutAmount: number;
  durationHours?: number;
  brief: string;
  status: GigStatus;
  urgency: 'instant' | 'scheduled' | 'express';
  createdAt: string;
  deadline: string;
  acceptedAt?: string;
  rawFootageUrl?: string;
  masterVideoUrl?: string;
  revisionsCount?: number;
  clientNotes?: string;
  videographerId?: string;
  editorId?: string;
}

export interface RentalGearItem {
  id: string;
  name: string;
  category: 'camera' | 'lens' | 'lighting' | 'audio' | 'drone' | 'grip';
  serialNumber: string;
  dailyRate: number;
  status: 'available' | 'on_rent' | 'returned_inspection' | 'maintenance' | 'overdue';
  borrowerName?: string;
  borrowerPhone?: string;
  rentedDate?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  depositAmount: number;
  conditionNotes?: string;
  imageUrl?: string;
}

export interface StudioBookingSlot {
  id: string;
  studioName: string;
  stageName: string;
  clientName: string;
  clientPhone: string;
  date: string;
  timeSlot: string;
  durationHours: number;
  amount: number;
  status: 'confirmed' | 'pending' | 'in_progress' | 'completed';
  gearIncluded: string[];
  depositReceived: boolean;
}

export interface PartnerPayout {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerRole: StakeholderRole;
  amount: number;
  upiId: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  requestedAt: string;
  paidAt?: string;
  transactionRef?: string;
  jobId?: string;
}

export interface TrainingReel {
  id: string;
  roleCategory: StakeholderRole;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  views: number;
  likes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Pro';
  mentorName: string;
  mentorHandle: string;
  mentorAvatar: string;
  proTips: string[];
  completed?: boolean;
}
