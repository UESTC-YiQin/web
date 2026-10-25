export const PREFIX = 'QQKEY1.';
export async function encryptSecret(secret, config) {
  secret = secret.trim();
  if (!secret || /\s/.test(secret) || new TextEncoder().encode(secret).length > 8192) throw new Error('请填写完整密钥，不要包含空格或换行。');
  if (!config?.jwk || !config?.kid) throw new Error('管理员尚未配置公钥，请联系管理员。');
  const c = globalThis.crypto;
  const publicKey = await c.subtle.importKey('jwk', config.jwk, {name:'RSA-OAEP',hash:'SHA-256'}, false, ['encrypt']);
  const aes = await c.subtle.generateKey({name:'AES-GCM',length:256}, true, ['encrypt']);
  const iv = c.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode('QQKEY1:' + config.kid);
  const data = await c.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128}, aes, new TextEncoder().encode(secret));
  const key = await c.subtle.encrypt({name:'RSA-OAEP',label:new TextEncoder().encode('QQKEY1')}, publicKey, await c.subtle.exportKey('raw',aes));
  const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  const envelope = {v:1,kid:config.kid,key:b64(key),iv:b64(iv),data:b64(data)};
  return PREFIX + b64(new TextEncoder().encode(JSON.stringify(envelope)));
}
