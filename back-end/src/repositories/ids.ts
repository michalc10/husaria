import crypto from 'crypto';

export const createObjectId = () => crypto.randomBytes(12).toString('hex');

export const createStableObjectId = (...parts: Array<string | number>) =>
  crypto.createHash('sha1').update(parts.join(':')).digest('hex').slice(0, 24);

