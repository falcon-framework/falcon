const algorithm = {
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
} satisfies RsaHashedKeyGenParams;

function toBase64Pem(buffer: ArrayBuffer, label: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 = btoa(binary);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

function toEnvValue(pem: string): string {
  return JSON.stringify(pem.replace(/\n/g, "\\n"));
}

const keyPair = await crypto.subtle.generateKey(algorithm, true, ["sign", "verify"]);
const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);

const privatePem = toBase64Pem(pkcs8, "PRIVATE KEY");
const publicPem = toBase64Pem(spki, "PUBLIC KEY");

console.log("# Paste these into /Users/benn/Documents/Projects/dzwei/falcon/.env");
console.log(`CONNECT_JWT_PRIVATE_KEY=${toEnvValue(privatePem)}`);
console.log(`CONNECT_JWT_PUBLIC_KEY=${toEnvValue(publicPem)}`);
console.log("CONNECT_ACCESS_TOKEN_TTL_SECONDS=300");
