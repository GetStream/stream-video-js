import {encode} from 'js-base64';

export const generateToken = (userId: string, callId: string) => {
  const name = encodeURIComponent(userId);
  const claims = JSON.stringify({
    app_id: 42,
    call_id: callId,
    user: {
      id: userId,
      image_url: `https://getstream.io/random_png/?id=${name}&name=${name}`,
    },
    grants: {
      can_join_call: true,
      can_publish_video: true,
      can_publish_audio: true,
      can_screen_share: true,
      can_mute_video: true,
      can_mute_audio: true,
    },
    iss: 'dev-only.pubkey.ecdsa256',
    aud: ['localhost'],
  });

  const urlSafe = true;
  return [
    'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9',
    encode(claims, urlSafe).replace(/[=]/g, ''),
    'Qxta03Hncph0yoYy3hMxUc3dEhUjxckoRXo8VT-IefY6Lm3d7UUQDwld1zcpTz73GezmPLYKqo0oWsHZFOMVow',
  ].join('.');
};

export class User {
  name: string;
  token: string;

  constructor(name: string, token: string) {
    this.name = name;
    this.token = token;
  }
}
