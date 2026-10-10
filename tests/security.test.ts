import { beforeEach, describe, expect, it, vi } from 'vitest';
const { verifyIdToken, getAdmin } = vi.hoisted(() => ({ verifyIdToken: vi.fn(), getAdmin: vi.fn() }));
vi.mock('../server/lib/firebaseAdmin', () => ({ adminAuth: () => ({ verifyIdToken }), adminDb: () => ({ collection: () => ({ doc: () => ({ get: getAdmin }) }) }) }));
import { optionalAuthToken, verifyAuthToken } from '../server/middleware/auth';

function context(token?: string) {
  const req: any = { headers: token ? { authorization: `Bearer ${token}` } : {}, body: { uid: 'victim' } };
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const next = vi.fn();
  return { req, res, next };
}
beforeEach(() => { vi.resetAllMocks(); getAdmin.mockResolvedValue({ exists: false, data: () => undefined }); });
describe('Firebase authentication boundary', () => {
  it('rejects missing login', async () => {
    const c = context(); await verifyAuthToken(c.req, c.res, c.next);
    expect(c.res.status).toHaveBeenCalledWith(401); expect(c.next).not.toHaveBeenCalled();
  });
  it('rejects forged JWT even when it contains an admin email', async () => {
    const c = context(`e30.${Buffer.from(JSON.stringify({ sub: 'victim', email: 'admin@example.com', admin: true })).toString('base64url')}.fake`);
    verifyIdToken.mockRejectedValue(new Error('invalid signature'));
    await verifyAuthToken(c.req, c.res, c.next);
    expect(c.res.status).toHaveBeenCalledWith(401); expect(c.next).not.toHaveBeenCalled();
  });
  it('requires verified tokens even in test mode', async () => {
    const c = context('test-admin-token'); verifyIdToken.mockRejectedValue(new Error('invalid'));
    await verifyAuthToken(c.req, c.res, c.next); expect(c.next).not.toHaveBeenCalled();
  });
  it('replaces the supplied UID and checks revocation', async () => {
    const c = context('valid'); verifyIdToken.mockResolvedValue({ uid: 'alice', email: 'admin@example.com' });
    await verifyAuthToken(c.req, c.res, c.next);
    expect(verifyIdToken).toHaveBeenCalledWith('valid', true); expect(c.req.body.uid).toBe('alice');
    expect(c.req.user.isAdmin).toBe(false); expect(c.next).toHaveBeenCalledOnce();
  });
  it('only grants administrator access from the trusted role store', async () => {
    const c = context('valid'); verifyIdToken.mockResolvedValue({ uid: 'owner' });
    getAdmin.mockResolvedValue({ exists: true, data: () => ({ role: 'superadmin' }) });
    await verifyAuthToken(c.req, c.res, c.next); expect(c.req.user.isSuperAdmin).toBe(true);
  });
  it('optional auth rejects an invalid supplied token', async () => {
    const c = context('expired'); verifyIdToken.mockRejectedValue(new Error('expired'));
    await optionalAuthToken(c.req, c.res, c.next); expect(c.res.status).toHaveBeenCalledWith(401);
  });
});
