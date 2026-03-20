import { makeDb } from "@falcon-framework/db";
import * as schema from "@falcon-framework/db/schema/auth";
import { env } from "@falcon-framework/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { verifyPassword as verifyLegacyPassword } from "better-auth/crypto";
import { organization } from "better-auth/plugins";

type BetterAuthInstance = ReturnType<typeof betterAuth>;
type PasswordVerifyInput = {
  readonly hash: string;
  readonly password: string;
};

const PASSWORD_HASH_PREFIX = "pbkdf2_sha256";
const PASSWORD_SALT_LENGTH_BYTES = 16;
const PASSWORD_KEY_LENGTH_BITS = 256;
const PASSWORD_PBKDF2_ITERATIONS = 25_000;

const textEncoder = new TextEncoder();

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const hexToBytes = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex input length");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    const parsed = Number.parseInt(hex.slice(index, index + 2), 16);
    if (Number.isNaN(parsed)) {
      throw new Error("Invalid hex input");
    }
    bytes[index / 2] = parsed;
  }
  return bytes;
};

const constantTimeEqual = (left: Uint8Array, right: Uint8Array): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index]! ^ right[index]!;
  }
  return mismatch === 0;
};

const derivePbkdf2Key = async (
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> => {
  const normalizedPassword = textEncoder.encode(password.normalize("NFKC"));
  const baseKey = await crypto.subtle.importKey("raw", normalizedPassword, "PBKDF2", false, [
    "deriveBits",
  ]);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as BufferSource,
      iterations,
    },
    baseKey,
    PASSWORD_KEY_LENGTH_BITS,
  );
  return new Uint8Array(derivedBits);
};

const hashPasswordForWorkers = async (password: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_LENGTH_BYTES));
  const derived = await derivePbkdf2Key(password, salt, PASSWORD_PBKDF2_ITERATIONS);
  return `${PASSWORD_HASH_PREFIX}$${PASSWORD_PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(derived)}`;
};

const verifyPbkdf2Password = async ({ hash, password }: PasswordVerifyInput): Promise<boolean> => {
  try {
    const [prefix, iterationsString, saltHex, expectedHex] = hash.split("$");
    if (!prefix || !iterationsString || !saltHex || !expectedHex) {
      return false;
    }
    if (prefix !== PASSWORD_HASH_PREFIX) {
      return false;
    }

    const iterations = Number.parseInt(iterationsString, 10);
    if (!Number.isFinite(iterations) || iterations <= 0) {
      return false;
    }

    const salt = hexToBytes(saltHex);
    const expected = hexToBytes(expectedHex);
    const actual = await derivePbkdf2Key(password, salt, iterations);

    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
};

const verifyPasswordForWorkers = async (input: PasswordVerifyInput): Promise<boolean> => {
  if (input.hash.startsWith(`${PASSWORD_HASH_PREFIX}$`)) {
    return verifyPbkdf2Password(input);
  }

  // Backward compatibility for users created before PBKDF2 migration.
  return verifyLegacyPassword(input);
};

/**
 * Request-scoped Better Auth session.
 */
export interface AuthSession {
  readonly auth: BetterAuthInstance;
  close: () => Promise<void>;
}

export const auth = () => {
  return betterAuth({
    database: drizzleAdapter(makeDb(), {
      provider: "pg",
      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
      password: {
        hash: hashPasswordForWorkers,
        verify: verifyPasswordForWorkers,
      },
    },
    // uncomment cookieCache setting when ready to deploy to Cloudflare using *.workers.dev domains
    // session: {
    //   cookieCache: {
    //     enabled: true,
    //     maxAge: 60,
    //   },
    // },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
      // uncomment crossSubDomainCookies setting when ready to deploy and replace <your-workers-subdomain> with your actual workers subdomain
      // https://developers.cloudflare.com/workers/wrangler/configuration/#workersdev
      // crossSubDomainCookies: {
      //   enabled: true,
      //   domain: "<your-workers-subdomain>",
      // },
    },
    plugins: [organization()],
    logger: {
      level: "debug",
    },
  });
};

export * from "./permissions.js";
