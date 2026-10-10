import { beforeEach, describe, expect, it, vi } from 'vitest';
const { counters, fail } = vi.hoisted(() => ({ counters: new Map<string, any>(), fail: { value: false } }));
vi.mock('../server/lib/firebaseAdmin', () => ({ adminDb: () => ({
  collection: () => ({ doc: (id: string) => ({ id }) }),
  runTransaction: async (callback: any) => {
    if (fail.value) throw new Error('offline');
    return callback({ get: async (ref: any) => ({ data: () => counters.get(ref.id) }), set: (ref: any, data: any) => counters.set(ref.id, data) });
  }
}) }));
import { enforceGenerationQuota } from '../server/middleware/quota';
const call = async (uid: string, path = '/ai/video-generate') => {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() }; const next = vi.fn();
  await enforceGenerationQuota({ method: 'POST', path, user: { uid } } as any, res, next);
  return { res, next };
};
beforeEach(() => { counters.clear(); fail.value = false; process.env.DAILY_VIDEO_LIMIT = '2'; process.env.PROJECT_DAILY_VIDEO_LIMIT = '3'; });
describe('durable generation limits', () => {
  it('denies a user after their shared daily allowance is consumed', async () => {
    expect((await call('alice')).next).toHaveBeenCalled(); expect((await call('alice')).next).toHaveBeenCalled();
    expect((await call('alice')).res.status).toHaveBeenCalledWith(429);
  });
  it('enforces a project cap across different authenticated users', async () => {
    await call('alice'); await call('bob'); await call('charlie');
    expect((await call('dave')).res.status).toHaveBeenCalledWith(429);
  });
  it('does not charge generation allowance for status polling', async () => {
    expect((await call('alice', '/ai/video-status')).next).toHaveBeenCalled(); expect(counters.size).toBe(0);
  });
  it('fails closed when quota storage is unavailable', async () => {
    fail.value = true; const c = await call('alice'); expect(c.res.status).toHaveBeenCalledWith(503); expect(c.next).not.toHaveBeenCalled();
  });
});
