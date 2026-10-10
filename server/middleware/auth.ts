import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { adminAuth, adminDb } from '../lib/firebaseAdmin';

export async function verifyAuthToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    // Verifies signature, issuer, audience, expiry and revocation. Never decode-only.
    const claims = await adminAuth().verifyIdToken(match[1], true);
    const admin = await adminDb().collection('admins').doc(claims.uid).get();
    req.user = {
      uid: claims.uid,
      email: claims.email,
      isAdmin: admin.exists,
      isSuperAdmin: admin.exists && admin.data()?.role === 'superadmin',
    };
    // Legacy handlers must receive the verified identity, never a client-supplied UID.
    if (req.body && typeof req.body === 'object') req.body.uid = claims.uid;
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });
  }
}

export async function optionalAuthToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
  if (!req.headers.authorization) return next();
  return verifyAuthToken(req, res, next);
}
