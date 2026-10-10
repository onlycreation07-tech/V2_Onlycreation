import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import { AddressInfo } from 'node:net';
const { records, save, upload } = vi.hoisted(() => ({ records: new Map<string, any>(), save: vi.fn(), upload: vi.fn() }));
vi.mock('../server/lib/firebaseAdmin', () => {
  const doc = (id: string) => ({
    id, get: async () => ({ exists: records.has(id), data: () => records.get(id) }),
    set: async (data: any) => records.set(id, data),
    update: async (data: any) => records.set(id, { ...records.get(id), ...data })
  });
  const db = { collection: () => ({ doc }), runTransaction: async (callback: any) => callback({
    get: (ref: any) => ref.get(), create: (ref: any, data: any) => ref.set(data), update: (ref: any, data: any) => ref.update(data)
  }) };
  return { adminDb: () => db, assetBucket: () => ({ file: () => ({ save }), upload }) };
});
import { mediaRouter, validAssetTicket } from '../server/controllers/mediaController';
import { parseImage, videoResult, videoSettings } from '../server/lib/media';
const png = 'data:image/png;base64,iVBORw0KGgo=';

async function withApi(ai: any, callback: (url: string) => Promise<void>) {
  const app = express(); app.use(express.json()); app.use((req: any, _res, next) => { req.user = { uid: 'alice' }; next(); });
  app.use('/api/ai', mediaRouter(ai)); const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try { await callback(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/ai`); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}
const post = (url: string, body: any, headers = {}) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
beforeEach(() => { records.clear(); vi.clearAllMocks(); process.env.MEDIA_SIGNING_SECRET = 'a'.repeat(64); });
describe('media provider contracts', () => {
  it('uses uploaded JPEG MIME type instead of falsely declaring PNG', () => {
    expect(parseImage({ data: 'data:image/jpeg;base64,/9j/AA==', mimeType: 'image/png' }).mimeType).toBe('image/jpeg');
  });
  it.each(['https://example.com/image.png', 'data:image/png;base64,not-a-real-image', 'AAAA'])('rejects malformed image %s', data => {
    expect(() => parseImage({ data, mimeType: 'image/png' })).toThrow();
  });
  it('does not interpret a failed operation as a completed video', () => {
    expect(() => videoResult({ done: true, error: { message: 'filtered' } })).toThrow('filtered');
    expect(() => videoResult({ done: true, response: {} })).toThrow('No video');
    expect(videoResult({ done: false })).toBeNull();
  });
  it('defaults to the quality Veo model and an 8-second duration', () => {
    expect(videoSettings({ resolution: '1080p' })).toMatchObject({ model: 'veo-3.1-generate-preview', durationSeconds: 8 });
  });
  it('rejects invalid asset tickets', () => {
    expect(validAssetTicket('unknown', '0', 'fake')).toBe(false);
  });
  it('returns a provider error without a stock image or a substitute model', async () => {
    const generateContent = vi.fn().mockRejectedValue({ status: 403 });
    await withApi({ models: { generateContent } }, async url => {
      const response = await post(`${url}/image-generate`, { prompt: 'a cat' }); const body = await response.json();
      expect(response.status).toBe(502); expect(body.success).toBe(false); expect(body.imageUrl).toBeUndefined(); expect(generateContent).toHaveBeenCalledTimes(1);
    });
  });
  it('keeps the selected edit model, source and aspect ratio', async () => {
    const generateContent = vi.fn().mockResolvedValue({ candidates: [{ content: { parts: [{ inlineData: { data: 'iVBORw0KGgo=', mimeType: 'image/png' } }] } }] });
    await withApi({ models: { generateContent } }, async url => {
      const response = await post(`${url}/image-edit`, { prompt: 'blue background', image: { data: png }, model: 'gemini-nano-banana-2.1', aspectRatio: '3:4', imageSize: '2K' });
      expect(response.status).toBe(200); expect(save).toHaveBeenCalledOnce();
      expect(generateContent.mock.calls[0][0]).toMatchObject({ model: 'gemini-nano-banana-2.1', config: { imageConfig: { aspectRatio: '3:4', imageSize: '2K' } } });
    });
  });
  it('does not create simulated video jobs on a generation error', async () => {
    const generateVideos = vi.fn().mockRejectedValue({ status: 429 });
    await withApi({ models: { generateVideos } }, async url => {
      const response = await post(`${url}/video-generate`, { prompt: 'a cat' }, { 'Idempotency-Key': crypto.randomUUID() });
      const body = await response.json(); expect(response.status).toBe(429); expect(body.operationName).toBeUndefined(); expect(body.isSimulated).toBeUndefined();
      expect([...records.values()][0].status).toBe('FAILED');
    });
  });
  it('deduplicates repeated video submissions and persists the operation', async () => {
    const generateVideos = vi.fn().mockResolvedValue({ name: 'models/veo/operations/real' });
    const headers = { 'Idempotency-Key': crypto.randomUUID() };
    await withApi({ models: { generateVideos } }, async url => {
      const first = await (await post(`${url}/video-generate`, { prompt: 'a cat' }, headers)).json();
      const second = await (await post(`${url}/video-generate`, { prompt: 'a cat' }, headers)).json();
      expect(first.operationName).toBe(second.operationName); expect(generateVideos).toHaveBeenCalledOnce();
      expect(records.get(first.operationName).providerOperation).toBe('models/veo/operations/real');
      expect((await post(`${url}/video-generate`, { prompt: 'different' }, headers)).status).toBe(409);
      expect(records.get(first.operationName).status).toBe('PROCESSING');
    });
  });
  it('does not reveal another user video', async () => {
    const id = crypto.randomUUID(); records.set(id, { userId: 'bob', status: 'COMPLETED', assetPath: 'private' });
    await withApi({}, async url => { expect((await post(`${url}/video-download`, { operationName: id })).status).toBe(404); });
  });
  it('surfaces failed operations and prevents download of unfinished jobs', async () => {
    const id = crypto.randomUUID(); records.set(id, { userId: 'alice', status: 'PROCESSING', providerOperation: 'real', createdAt: Date.now() });
    await withApi({ operations: { getVideosOperation: vi.fn().mockResolvedValue({ done: true, error: { message: 'filtered' } }) } }, async url => {
      const response = await (await post(`${url}/video-status`, { operationName: id })).json();
      expect(response).toMatchObject({ done: true, status: 'FAILED', error: 'filtered' });
      expect((await post(`${url}/video-download`, { operationName: id })).status).toBe(409);
    });
  });
});
