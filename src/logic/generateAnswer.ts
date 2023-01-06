import { createHmac } from 'crypto';
import { env } from 'process';

export function generateAnswer(challenge: string): string {
  const username = env.TELNETUSERNAME;
  const password = env.TELNETPASSWORD;
  challenge = Buffer.from(challenge, 'base64').toString();
  const digest = createHmac('md5', password).update(challenge).digest('hex');
  const hash = Buffer.from(`${username} ${digest}`, 'binary').toString(
    'base64'
  );
  return hash;
}

