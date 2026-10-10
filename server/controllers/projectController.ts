import { Response } from 'express';
import crypto from 'crypto';
import { 
  AuthenticatedRequest, 
  ProjectPhase, 
  DeliverableVersion, 
  TimestampComment 
} from '../types';
import { creditWalletAndRecordLedgerServer } from './paymentController';

export interface ProductionProject {
  id: string;
  clientId: string;
  partnerId?: string;
  title: string;
  brandName: string;
  category: string;
  budgetInr: number;
  currentPhase: ProjectPhase;
  phaseHistory: Array<{ phase: ProjectPhase; transitionedAt: string; actor: string }>;
  deliverables: DeliverableVersion[];
  comments: TimestampComment[];
  escrowStatus: 'held_in_escrow' | 'partially_released' | 'fully_settled' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

const projectsStore = new Map<string, ProductionProject>();

// Seed a showcase project for demo / review
const seedProjectId = 'proj_showcase_master';
projectsStore.set(seedProjectId, {
  id: seedProjectId,
  clientId: 'client_brand_main',
  partnerId: 'partner_director_fx3',
  title: 'Cyberpunk Autumn High-Fashion Reel',
  brandName: 'NeoStreet India',
  category: 'Commercial / High Fashion',
  budgetInr: 35000,
  currentPhase: 'client_review',
  phaseHistory: [
    { phase: 'ideation', transitionedAt: '2026-09-28T10:00:00Z', actor: 'client' },
    { phase: 'pre_production', transitionedAt: '2026-09-29T14:30:00Z', actor: 'director' },
    { phase: 'production', transitionedAt: '2026-10-01T09:00:00Z', actor: 'director' },
    { phase: 'post_production', transitionedAt: '2026-10-02T12:00:00Z', actor: 'editor' },
    { phase: 'client_review', transitionedAt: '2026-10-02T20:00:00Z', actor: 'editor' }
  ],
  deliverables: [
    {
      versionId: 'deliv_v1',
      versionNumber: 'v1.0 (Rough Assembly)',
      title: 'First Edit Assembly with temp score',
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      uploadedAt: '2026-10-02T14:00:00Z',
      uploadedBy: 'partner_director_fx3',
      changelog: 'Initial synced cut of all 4 scenes with fast tempo.',
      status: 'revision_requested'
    },
    {
      versionId: 'deliv_v2',
      versionNumber: 'v2.0 (Color Graded & Sound Master)',
      title: '4K DCI Final Cut with Bass Drop sync',
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      uploadedAt: '2026-10-02T19:30:00Z',
      uploadedBy: 'partner_director_fx3',
      changelog: 'Applied teal & neon orange LUT, enhanced voiceover clarity.',
      status: 'pending_review'
    }
  ],
  comments: [
    {
      id: 'comm_1',
      userId: 'client_brand_main',
      authorName: 'Aditi (Brand Lead)',
      timestampSeconds: 4,
      comment: 'Opening hook looks breathtaking! Can we hold on the garment logo for 0.5s longer?',
      createdAt: '2026-10-02T20:15:00Z',
      resolved: false
    },
    {
      id: 'comm_2',
      userId: 'client_brand_main',
      authorName: 'Aditi (Brand Lead)',
      timestampSeconds: 12,
      comment: 'Audio punch here is perfect on headphones.',
      createdAt: '2026-10-02T20:18:00Z',
      resolved: true
    }
  ],
  escrowStatus: 'held_in_escrow',
  createdAt: '2026-09-28T10:00:00Z',
  updatedAt: '2026-10-02T20:18:00Z'
});

/**
 * Validates allowable state machine transitions
 */
const ALLOWED_TRANSITIONS: Record<ProjectPhase, ProjectPhase[]> = {
  ideation: ['pre_production'],
  pre_production: ['production', 'ideation'],
  production: ['post_production'],
  post_production: ['client_review'],
  client_review: ['post_production', 'approved'],
  approved: []
};

/**
 * Advance or transition project phase
 */
export function transitionProjectPhase(
  projectId: string, 
  targetPhase: ProjectPhase, 
  actorId: string
): ProductionProject {
  const project = projectsStore.get(projectId);
  if (!project) throw new Error('Project not found');

  const allowed = ALLOWED_TRANSITIONS[project.currentPhase];
  if (!allowed.includes(targetPhase)) {
    throw new Error(
      `INVALID_TRANSITION: Cannot transition from ${project.currentPhase} to ${targetPhase}. Allowed: [${allowed.join(', ')}]`
    );
  }

  const now = new Date().toISOString();
  project.currentPhase = targetPhase;
  project.phaseHistory.push({ phase: targetPhase, transitionedAt: now, actor: actorId });
  project.updatedAt = now;

  return project;
}

/**
 * Adds an immutable deliverable version
 */
export function addDeliverableVersion(
  projectId: string,
  data: Omit<DeliverableVersion, 'versionId' | 'uploadedAt' | 'status'>
): DeliverableVersion {
  const project = projectsStore.get(projectId);
  if (!project) throw new Error('Project not found');

  const versionId = `deliv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const newDeliverable: DeliverableVersion = {
    ...data,
    versionId,
    uploadedAt: new Date().toISOString(),
    status: 'pending_review'
  };

  project.deliverables.push(newDeliverable);
  project.currentPhase = 'client_review';
  project.updatedAt = new Date().toISOString();

  return newDeliverable;
}

/**
 * Express handler: GET /api/projects/:id
 */
export function handleGetProject(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const project = projectsStore.get(id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  return res.json({ project });
}

/**
 * Express handler: POST /api/projects/:id/transition-phase
 */
export function handleTransitionPhase(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { targetPhase } = req.body;
  const actorId = req.user?.uid || 'system_lead';

  if (!targetPhase) {
    return res.status(400).json({ error: 'targetPhase is required' });
  }

  try {
    const updated = transitionProjectPhase(id, targetPhase, actorId);
    return res.json({ success: true, project: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Express handler: POST /api/projects/:id/add-deliverable
 */
export function handleAddDeliverable(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { versionNumber, title, videoUrl, changelog } = req.body;
  const uploadedBy = req.user?.uid || 'director_lead';

  if (!videoUrl || !versionNumber) {
    return res.status(400).json({ error: 'videoUrl and versionNumber are required' });
  }

  try {
    const deliverable = addDeliverableVersion(id, {
      versionNumber,
      title: title || 'New Cut',
      videoUrl,
      changelog: changelog || 'New version upload',
      uploadedBy
    });
    return res.json({ success: true, deliverable });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Express handler: POST /api/projects/:id/add-comment
 */
export function handleAddTimestampComment(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { timestampSeconds, comment } = req.body;
  const userId = req.user?.uid || 'client_viewer';
  const authorName = req.user?.email?.split('@')[0] || 'Client Reviewer';

  const project = projectsStore.get(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const newComment: TimestampComment = {
    id: `comm_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    userId,
    authorName,
    timestampSeconds: Number(timestampSeconds) || 0,
    comment: String(comment || '').trim(),
    createdAt: new Date().toISOString(),
    resolved: false
  };

  project.comments.push(newComment);
  project.updatedAt = new Date().toISOString();

  return res.json({ success: true, comment: newComment });
}

/**
 * Express handler: POST /api/projects/:id/approve-deliverable
 * Triggered by Client: releases escrow settlement into the creator/partner's wallet!
 */
export function handleApproveAndReleaseEscrow(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const project = projectsStore.get(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (project.currentPhase !== 'client_review') {
    return res.status(400).json({ error: `Cannot approve deliverable when project is in phase "${project.currentPhase}". Must be in "client_review".` });
  }

  // 1. Mark phase approved
  const now = new Date().toISOString();
  project.currentPhase = 'approved';
  project.escrowStatus = 'fully_settled';
  project.phaseHistory.push({ phase: 'approved', transitionedAt: now, actor: req.user?.uid || 'client' });
  
  if (project.deliverables.length > 0) {
    project.deliverables[project.deliverables.length - 1].status = 'approved';
  }

  // 2. Authoritative Escrow Settlement: Credit Partner Wallet
  let settlement = null;
  if (project.partnerId && project.budgetInr > 0) {
    const creatorNetPayout = Math.round(project.budgetInr * 0.90); // 90% creator share
    settlement = creditWalletAndRecordLedgerServer({
      uid: project.partnerId,
      amount: creatorNetPayout,
      currency: 'INR',
      type: 'dispatch_payment',
      relatedOrderId: project.id,
      metadata: {
        projectId: project.id,
        projectTitle: project.title,
        settledBy: req.user?.uid || 'client'
      }
    });
  }

  return res.json({
    success: true,
    message: 'Deliverable approved! Project marked complete and escrow funds released to creator.',
    project,
    settlement
  });
}
