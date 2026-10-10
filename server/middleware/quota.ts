import { NextFunction, Response } from 'express';
import { adminDb } from '../lib/firebaseAdmin';
import { AuthenticatedRequest } from '../types';

/** Durable per-user and project-wide quotas, shared by every server instance. */
export async function enforceGenerationQuota(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const generation = req.method === 'POST' && (/^\/ai\//.test(req.path) || /^\/(chat|creation-ai|agents)/.test(req.path));
  if (!generation || /video-(status|download)$/.test(req.path) || /notifications/.test(req.path)) return next();
  const category = req.path.endsWith('video-generate') ? 'video' : /image-(generate|edit)$/.test(req.path) ? 'image' : 'text';
  const dailyLimit = Number(process.env[`DAILY_${category.toUpperCase()}_LIMIT`] || ({ video: 3, image: 25, text: 100 }[category]));
  const projectLimit = Number(process.env[`PROJECT_DAILY_${category.toUpperCase()}_LIMIT`] || ({ video: 10, image: 100, text: 500 }[category]));
  if (![dailyLimit, projectLimit].every(limit => Number.isSafeInteger(limit) && limit > 0)) return res.status(503).json({ error: 'Generation limits are not configured correctly.' });
  const day = new Date().toISOString().slice(0, 10);
  const minute = Math.floor(Date.now() / 60000);
  try {
    const db = adminDb();
    const refs = [db.collection('generationQuotas').doc(`${req.user!.uid}_${category}_${day}`), db.collection('generationQuotas').doc(`project_${category}_${day}`)];
    const allowed = await db.runTransaction(async tx => {
      const snapshots = await Promise.all(refs.map(ref => tx.get(ref)));
      const values = snapshots.map(s => s.data() || {});
      if ((values[0].count || 0) >= dailyLimit || (values[1].count || 0) >= projectLimit || (values[0].minute === minute && values[0].minuteCount >= 15)) return false;
      refs.forEach((ref, i) => tx.set(ref, { count: (values[i].count || 0) + 1, minute, minuteCount: values[i].minute === minute ? (values[i].minuteCount || 0) + 1 : 1, expiresAt: new Date(Date.now() + 3 * 86400000) }));
      return true;
    });
    if (!allowed) return res.status(429).json({ error: 'Generation limit reached. Please try later.' });
    return next();
  } catch {
    return res.status(503).json({ error: 'Generation quota service unavailable. Please try later.' });
  }
}
