import { Router } from 'express';
import crypto from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { GoogleGenAI, GenerateVideosOperation, Modality } from '@google/genai';
import { adminDb, assetBucket } from '../lib/firebaseAdmin';
import { AuthenticatedRequest } from '../types';
import { imageSettings, MediaError, parseImage, promptText, sendMediaError, videoResult, videoSettings } from '../lib/media';

function signAsset(jobId: string) {
  const expires = Date.now() + 24 * 60 * 60 * 1000;
  const signature = crypto.createHmac('sha256', process.env.MEDIA_SIGNING_SECRET!).update(`${jobId}:${expires}`).digest('hex');
  return `/api/ai/asset-stream?job=${jobId}&expires=${expires}&signature=${signature}`;
}
export function validAssetTicket(job: unknown, expires: unknown, signature: unknown) {
  if (typeof job !== 'string' || !/^[a-f0-9-]{36}$/.test(job) || typeof expires !== 'string' || typeof signature !== 'string' || !/^[a-f0-9]{64}$/.test(signature) || !process.env.MEDIA_SIGNING_SECRET) return false;
  const expiry = Number(expires);
  if (!Number.isFinite(expiry) || expiry < Date.now() || expiry > Date.now() + 24 * 60 * 60 * 1000) return false;
  const expected = crypto.createHmac('sha256', process.env.MEDIA_SIGNING_SECRET).update(`${job}:${expires}`).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

export function mediaRouter(ai: GoogleGenAI) {
  const router = Router({ caseSensitive: true });
  const jobs = () => adminDb().collection('generationJobs');
  const userId = (req: any) => (req as AuthenticatedRequest).user!.uid;
  const ownedJob = async (req: any) => {
    const id = req.body.operationName;
    if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) throw new MediaError(400, 'INVALID_JOB', 'Invalid video job.');
    const ref = jobs().doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.userId !== userId(req)) throw new MediaError(404, 'JOB_NOT_FOUND', 'Video job not found.');
    return { ref, job: snap.data()! };
  };

  router.get('/jobs', async (req, res) => {
    try {
      const snapshots = await jobs().where('userId', '==', userId(req)).orderBy('createdAt', 'desc').limit(30).get();
      res.json({ jobs: snapshots.docs.map(snap => {
        const job = snap.data();
        return { id: snap.id, type: job.type, status: job.status, prompt: job.prompt, model: job.model, createdAt: job.createdAt, error: job.error, assetUrl: job.status === 'COMPLETED' ? signAsset(snap.id) : undefined };
      }) });
    } catch (error) { sendMediaError(res, error); }
  });

  for (const mode of ['generate', 'edit']) {
    router.post(`/image-${mode}`, async (req, res) => {
      try {
        const prompt = promptText(req.body.prompt);
        const settings = imageSettings(req.body);
        const parts: any[] = [{ text: prompt }];
        if (mode === 'edit') parts.unshift({ inlineData: parseImage(req.body.image) });
        const response = await ai.models.generateContent({
          model: settings.model,
          contents: { parts },
          config: { responseModalities: [Modality.TEXT, Modality.IMAGE], imageConfig: { aspectRatio: settings.aspectRatio, imageSize: settings.imageSize } },
        });
        const output = response.candidates?.[0]?.content?.parts || [];
        const image = output.find(part => part.inlineData?.data && part.inlineData?.mimeType?.startsWith('image/'))?.inlineData;
        if (!image?.data) throw new MediaError(422, 'NO_IMAGE', 'Google returned no image. Revise your prompt and try again.');
        const jobId = crypto.randomUUID();
        const assetPath = `generated/${userId(req)}/${jobId}/image`;
        await assetBucket().file(assetPath).save(Buffer.from(image.data, 'base64'), { resumable: false, contentType: image.mimeType || 'image/png' });
        await jobs().doc(jobId).set({ userId: userId(req), type: 'image', status: 'COMPLETED', assetPath, mimeType: image.mimeType || 'image/png', prompt, ...settings, createdAt: Date.now() });
        res.json({ success: true, jobId, imageUrl: `data:${image.mimeType};base64,${image.data}`, caption: output.filter(part => part.text).map(part => part.text).join('\n'), modelUsed: settings.model, ...settings });
      } catch (error) { sendMediaError(res, error); }
    });
  }

  router.post('/video-generate', async (req, res) => {
    let ref: ReturnType<ReturnType<typeof jobs>['doc']> | undefined;
    try {
      const prompt = promptText(req.body.prompt || (req.body.image ? 'Smooth cinematic camera movement with natural lighting.' : undefined));
      const settings = videoSettings(req.body);
      const image = req.body.image ? parseImage(req.body.image) : undefined;
      const idempotencyKey = req.get('Idempotency-Key');
      if (!idempotencyKey || !/^[a-f0-9-]{36}$/.test(idempotencyKey)) throw new MediaError(400, 'IDEMPOTENCY_REQUIRED', 'A unique request key is required.');
      const fingerprint = crypto.createHash('sha256').update(JSON.stringify({ prompt, settings, image })).digest('hex');
      const jobId = crypto.createHash('sha256').update(`${userId(req)}:${idempotencyKey}`).digest('hex');
      // UUID shape is deliberately opaque; clients never submit provider operation names.
      const publicId = `${jobId.slice(0,8)}-${jobId.slice(8,12)}-${jobId.slice(12,16)}-${jobId.slice(16,20)}-${jobId.slice(20,32)}`;
      ref = jobs().doc(publicId);
      const existing = await adminDb().runTransaction(async tx => {
        const snap = await tx.get(ref!);
        if (snap.exists) return snap.data();
        tx.create(ref!, { userId: userId(req), type: 'video', status: 'SUBMITTING', fingerprint, prompt, ...settings, createdAt: Date.now() });
        return null;
      });
      if (existing) {
        if (existing.fingerprint !== fingerprint) throw new MediaError(409, 'KEY_REUSED', 'This request key was already used for different settings.');
        return res.status(202).json({ success: true, operationName: publicId, model: existing.model, status: existing.status });
      }
      const { model, ...config } = settings;
      const operation = await ai.models.generateVideos({ model, prompt, config, ...(image ? { image: { imageBytes: image.data, mimeType: image.mimeType } } : {}) });
      if (!operation.name) throw new MediaError(502, 'NO_OPERATION', 'Google returned no video operation.');
      await ref.update({ providerOperation: operation.name, status: 'PROCESSING' });
      return res.status(202).json({ success: true, operationName: publicId, ...settings });
    } catch (error) {
      if (ref && !(error instanceof MediaError && error.status === 409)) await ref.update({ status: 'FAILED', error: 'Video submission failed. Check billing and model access before retrying.' }).catch(() => {});
      sendMediaError(res, error);
    }
  });

  router.post('/video-status', async (req, res) => {
    try {
      const { ref, job } = await ownedJob(req);
      if (job.status === 'FAILED') return res.json({ done: true, status: 'FAILED', error: job.error });
      if (job.status === 'COMPLETED') return res.json({ done: true, status: 'COMPLETED' });
      if (Date.now() - job.createdAt > 30 * 60 * 1000) {
        await ref.update({ status: 'FAILED', error: 'Video job timed out. Contact support before resubmitting.' });
        return res.json({ done: true, status: 'FAILED', error: 'Video job timed out.' });
      }
      if (!job.providerOperation) return res.json({ done: false, status: 'SUBMITTING' });
      const operation = new GenerateVideosOperation();
      operation.name = job.providerOperation;
      const updated = await ai.operations.getVideosOperation({ operation });
      let video;
      try { video = videoResult(updated); }
      catch (error: any) {
        await ref.update({ status: 'FAILED', error: error.message });
        return res.json({ done: true, status: 'FAILED', error: error.message });
      }
      if (!video) return res.json({ done: false, status: 'PROCESSING' });
      const acquired = await adminDb().runTransaction(async tx => {
        const latest = (await tx.get(ref)).data()!;
        if (latest.status === 'COMPLETED' || latest.downloadLeaseUntil > Date.now()) return false;
        tx.update(ref, { downloadLeaseUntil: Date.now() + 5 * 60 * 1000 });
        return true;
      });
      if (!acquired) return res.json({ done: false, status: 'SAVING' });
      const dir = await mkdtemp(path.join(os.tmpdir(), 'onlycreation-'));
      try {
        const localPath = path.join(dir, 'video.mp4');
        await ai.files.download({ file: video, downloadPath: localPath });
        const assetPath = `generated/${userId(req)}/${ref.id}/video.mp4`;
        await assetBucket().upload(localPath, { destination: assetPath, metadata: { contentType: 'video/mp4' } });
        await ref.update({ status: 'COMPLETED', assetPath, completedAt: Date.now(), downloadLeaseUntil: 0 });
        return res.json({ done: true, status: 'COMPLETED' });
      } catch (error) {
        await ref.update({ downloadLeaseUntil: 0 }).catch(() => {});
        throw error;
      } finally { await rm(dir, { recursive: true, force: true }); }
    } catch (error) { sendMediaError(res, error); }
  });

  router.post('/video-download', async (req, res) => {
    try {
      const { ref, job } = await ownedJob(req);
      if (job.status !== 'COMPLETED' || !job.assetPath) throw new MediaError(409, 'VIDEO_NOT_READY', 'The video is not ready to download.');
      res.json({ videoUrl: signAsset(ref.id), downloadType: 'private_asset', modelUsed: job.model });
    } catch (error) { sendMediaError(res, error); }
  });

  router.get(['/video-stream', '/asset-stream'], async (req, res) => {
    if (!validAssetTicket(req.query.job, req.query.expires, req.query.signature)) return res.status(401).json({ error: 'Invalid or expired asset link.' });
    try {
      const job = (await jobs().doc(String(req.query.job)).get()).data();
      if (job?.status !== 'COMPLETED' || !job.assetPath) return res.status(404).json({ error: 'Video not found.' });
      const file = assetBucket().file(job.assetPath);
      const [metadata] = await file.getMetadata();
      const size = Number(metadata.size);
      if (!Number.isSafeInteger(size) || size <= 0) throw new MediaError(502, 'EMPTY_ASSET', 'The saved asset is empty.');
      res.set({ 'Content-Type': job.mimeType || 'video/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'Content-Disposition': `inline; filename="onlycreation_${job.type === 'image' ? (job.mimeType === 'image/jpeg' ? 'image.jpg' : job.mimeType === 'image/webp' ? 'image.webp' : 'image.png') : 'video.mp4'}"` });
      let start = 0, end = size - 1;
      if (req.headers.range) {
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!range || (!range[1] && !range[2])) return res.status(416).set('Content-Range', `bytes */${size}`).end();
        start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
        end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
        if (start > end || start >= size) return res.status(416).set('Content-Range', `bytes */${size}`).end();
        res.status(206).set('Content-Range', `bytes ${start}-${end}/${size}`);
      }
      res.set('Content-Length', String(end - start + 1));
      await pipeline(file.createReadStream({ start, end }), res);
    } catch (error) { if (!res.headersSent) sendMediaError(res, error); else res.destroy(); }
  });
  return router;
}
