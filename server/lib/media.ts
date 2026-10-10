export class MediaError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function parseImage(image: { data?: unknown; mimeType?: unknown }) {
  if (!image || typeof image.data !== 'string') throw new MediaError(400, 'INVALID_IMAGE', 'Upload a PNG, JPEG or WebP image.');
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s.exec(image.data);
  const data = match ? match[2] : image.data;
  const mimeType = match ? match[1] : image.mimeType;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(String(mimeType)) || !data || data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    throw new MediaError(400, 'INVALID_IMAGE', 'Image must contain valid PNG, JPEG or WebP base64 data.');
  }
  const bytes = Buffer.from(data, 'base64');
  const valid = mimeType === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    : mimeType === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!valid || bytes.length > 10 * 1024 * 1024) throw new MediaError(400, 'INVALID_IMAGE', 'Image format must match its content and be at most 10 MB.');
  return { data, mimeType: String(mimeType) };
}
export function promptText(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 8000) throw new MediaError(400, 'INVALID_PROMPT', 'Enter a prompt between 1 and 8,000 characters.');
  return value.trim();
}
export function imageSettings(body: any) {
  const model = body.model || 'gemini-nano-banana-2.1';
  const aspectRatio = body.aspectRatio || '1:1';
  const imageSize = body.imageSize || '1K';
  if (!['gemini-nano-banana-2.1', 'gemini-3.1-flash-lite-image', 'gemini-3-pro-image'].includes(model)) throw new MediaError(400, 'INVALID_MODEL', 'Choose a supported image model.');
  if (!['1:1', '9:16', '16:9', '4:3', '3:4'].includes(aspectRatio) || !['1K', '2K'].includes(imageSize)) throw new MediaError(400, 'INVALID_SETTINGS', 'Unsupported image aspect ratio or size.');
  return { model, aspectRatio, imageSize };
}
export function videoSettings(body: any) {
  const model = body.model || process.env.GEMINI_VIDEO_MODEL || 'veo-3.1-generate-preview';
  const aspectRatio = body.aspectRatio || '16:9';
  const resolution = body.resolution || '720p';
  if (!['veo-3.1-generate-preview', 'veo-3.1-fast-generate-preview', 'veo-3.1-lite-generate-preview'].includes(model)) throw new MediaError(400, 'INVALID_MODEL', 'Choose a supported Veo model.');
  if (!['16:9', '9:16'].includes(aspectRatio) || !['720p', '1080p'].includes(resolution)) throw new MediaError(400, 'INVALID_SETTINGS', 'Unsupported video aspect ratio or resolution.');
  return { model, aspectRatio, resolution, durationSeconds: 8, numberOfVideos: 1 };
}
export function videoResult(operation: any) {
  if (operation.error) throw new MediaError(422, 'GENERATION_FAILED', String(operation.error.message || 'Google could not generate this video.'));
  if (!operation.done) return null;
  const video = operation.response?.generatedVideos?.[0]?.video;
  if (!video?.uri) throw new MediaError(422, 'NO_VIDEO', 'No video returned. The request may have been filtered. Revise your prompt.');
  return video;
}
export function sendMediaError(res: any, error: any) {
  if (error instanceof MediaError) return res.status(error.status).json({ success: false, code: error.code, error: error.message });
  const status = Number(error?.status || error?.code);
  const message = status === 429 ? 'Google generation quota reached. Please try later.'
    : status === 401 || status === 403 ? 'Google API access denied. Check the server API key, billing and model permissions.'
    : status === 404 ? 'This model is unavailable for the configured Google project.'
    : 'Generation service failed. Please try again. No substitute asset was returned.';
  console.error('[Media] upstream failure', { status: Number.isFinite(status) ? status : undefined, name: error?.name });
  return res.status(status === 429 ? 429 : 502).json({ success: false, code: 'PROVIDER_ERROR', error: message });
}
