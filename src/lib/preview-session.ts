import {createHmac, timingSafeEqual} from 'node:crypto';

export const previewCookie = 'som_canet_preview';
export const previewLifetime = 3600;

function signature(expires: string, token: string) {
 return createHmac('sha256', token).update('som-canet/editor-preview/' + expires).digest('hex');
}

export function createPreviewSession(token: string) {
 const expires = String(Math.floor(Date.now() / 1000) + previewLifetime);
 return expires + '.' + signature(expires, token);
}

export function hasPreviewSession(value: string | undefined, token: string | undefined) {
 if (!value || !token || !/^\d{10}\.[0-9a-f]{64}$/.test(value)) return false;
 const [expires, digest] = value.split('.');
 return Number(expires) > Date.now() / 1000 &&
  timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature(expires, token), 'hex'));
}
