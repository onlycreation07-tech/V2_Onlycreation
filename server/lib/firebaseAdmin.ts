import 'dotenv/config';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'node:fs';
import config from '../../firebase-applet-config.json' with { type: 'json' };

export function adminApp() {
  const existing = getApps().find(app => app.name === 'server');
  if (existing) return existing;
  // Validate file credentials synchronously before gRPC begins initializing.
  const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')))
    : applicationDefault();
  return initializeApp({
    credential,
    projectId: config.projectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || config.storageBucket,
  }, 'server');
}
export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp(), config.firestoreDatabaseId);
export const assetBucket = () => getStorage(adminApp()).bucket();

export async function verifyBackendCredentials() {
  await adminApp().options.credential!.getAccessToken();
}
