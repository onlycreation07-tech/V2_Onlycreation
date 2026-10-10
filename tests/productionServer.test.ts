import { expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import { createServer, AddressInfo } from 'node:net';

it('starts in production, rejects unauthenticated/unsafe flows, and survives missing backend credentials', async () => {
  const probe = createServer().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => probe.once('listening', resolve));
  const port = (probe.address() as AddressInfo).port;
  await new Promise<void>(resolve => probe.close(() => resolve()));
  const child = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), GEMINI_API_KEY: 'smoke-placeholder', MEDIA_SIGNING_SECRET: '0'.repeat(64), GOOGLE_APPLICATION_CREDENTIALS: '/nonexistent/test-credential.json' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let logs = '';
  child.stdout.on('data', data => { logs += data; }); child.stderr.on('data', data => { logs += data; });
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Production boot timed out: ${logs}`)), 20_000);
      child.stdout.on('data', () => { if (logs.includes('Running on')) { clearTimeout(timer); resolve(); } });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Production server exited (${code}): ${logs}`)); });
    });
    const request = (url: string, method = 'GET', authorization?: string) => fetch(`http://127.0.0.1:${port}${url}`, {
      method, headers: { Connection: 'close', ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}), ...(authorization ? { Authorization: authorization } : {}) },
      body: method === 'POST' ? JSON.stringify({ prompt: 'smoke test', uid: 'attacker', amount: 100, orderId: 'fake' }) : undefined,
      signal: AbortSignal.timeout(10_000)
    });
    expect((await request('/api/health')).status).toBe(200);
    expect((await request('/api/ai/image-generate', 'POST')).status).toBe(401);
    expect((await request('/api/ai/video-generate', 'POST')).status).toBe(401);
    expect((await request('/api/payments/verify', 'POST')).status).toBe(503);
    expect((await request('/api/Payments/verify', 'POST')).status).toBe(503);
    expect((await request('/api/wallet/payout', 'POST')).status).toBe(503);
    expect((await request('/api/ai/asset-stream?job=invalid')).status).toBe(401);
    expect((await request('/api/ready')).status).toBe(503);
    expect((await request('/api/ai/image-generate', 'POST', 'Bearer test-admin-token')).status).toBe(401);
    expect((await request('/api/health')).status).toBe(200);
  } finally { child.kill('SIGTERM'); }
}, 30_000);
