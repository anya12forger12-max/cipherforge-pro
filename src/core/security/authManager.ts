/**
 * Local account storage, password derivation, and session handling for
 * CipherForge Pro.
 *
 * Placement note: the repository ships two byte-identical security trees
 * (`src/core/security` and `src/security`). Every application import resolves
 * to `src/core/security`, so this module lives there only; the duplicate tree
 * is left untouched to avoid a third copy drifting out of sync.
 *
 * Design rules:
 * - Nothing leaves the device. The only persistent secrets are salted password
 *   digests in this browser's local storage.
 * - The plaintext password is never stored, logged, or serialised.
 * - Key derivation prefers WebCrypto PBKDF2-HMAC-SHA256. `crypto.subtle` only
 *   exists in a secure context (https or localhost), so the app degrades to a
 *   single-pass SHA-256 when it is served over plain http (for example from a
 *   LAN IP in development). The digest that was actually used is recorded per
 *   account, so an account created over http still verifies over https.
 */

export const AUTH_STORAGE_KEYS = {
  users: 'cipherforge-users',
  session: 'cipherforge-login-session',
  legacyHash: 'cipherforge-login-hash',
  consent: 'cipherforge-consent'
} as const;

export const MIN_PASSWORD_LENGTH = 8;

/** Current OWASP recommendation for PBKDF2-HMAC-SHA256 password storage. */
export const PBKDF2_ITERATIONS = 150_000;

const SALT_BYTES = 16;
const DERIVED_BITS = 256;
/** Placeholder iteration count for the single-pass fallback digest. */
const FALLBACK_ITERATIONS = 1;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type KdfName = 'pbkdf2-sha256' | 'sha256-fallback';

export interface UserRecord {
  saltHex: string;
  hashHex: string;
  iterations: number;
  /**
   * Which digest produced `hashHex`. Optional so that records written by an
   * earlier build (always PBKDF2) keep verifying.
   */
  kdf?: KdfName;
}

export type AuthErrorCode =
  | 'invalid-email'
  | 'password-too-short'
  | 'email-exists'
  | 'invalid-credentials'
  | 'crypto-unavailable'
  | 'storage-unavailable';

/**
 * A single result shape rather than a discriminated union: the project compiles
 * without `strictNullChecks`, where a boolean literal discriminant does not
 * narrow, so `ok: boolean` keeps the call sites type-safe in this config.
 */
export interface AuthResult {
  ok: boolean;
  /** Normalized email address on success, an empty string on failure. */
  email: string;
  code: AuthErrorCode | null;
  /** Human-readable reason, an empty string on success. */
  message: string;
  created?: boolean;
  migrated?: boolean;
}

const INVALID_CREDENTIALS: AuthResult = {
  ok: false,
  email: '',
  code: 'invalid-credentials',
  message: 'Invalid email or password.'
};

function fail(code: AuthErrorCode, message: string): AuthResult {
  return { ok: false, email: '', code, message };
}

function succeed(email: string, extra?: { created?: boolean; migrated?: boolean }): AuthResult {
  return { ok: true, email, code: null, message: '', ...extra };
}

/* -------------------------------------------------------------------------- */
/* Email helpers                                                              */
/* -------------------------------------------------------------------------- */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/* -------------------------------------------------------------------------- */
/* Hex helpers                                                                */
/* -------------------------------------------------------------------------- */

function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function fromHex(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16) || 0;
  }
  return bytes;
}

/** Constant-time comparison so a wrong password cannot be probed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/* -------------------------------------------------------------------------- */
/* SHA-256 fallback                                                           */
/* -------------------------------------------------------------------------- */

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function rotr(value: number, bits: number): number {
  return ((value >>> bits) | (value << (32 - bits))) >>> 0;
}

/**
 * Single-pass SHA-256, used only when `crypto.subtle` is unavailable
 * (non-secure context). Verified against the NIST sample vectors in the tests.
 */
export function sha256Hex(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const blockCount = Math.floor((bytes.length + 8) / 64) + 1;
  const paddedLength = blockCount * 64;
  const buffer = new Uint8Array(paddedLength);
  buffer.set(bytes);
  buffer[bytes.length] = 0x80;

  const view = new DataView(buffer.buffer);
  const bitLengthHigh = Math.floor((bytes.length * 8) / 0x100000000);
  const bitLengthLow = (bytes.length * 8) >>> 0;
  view.setUint32(paddedLength - 8, bitLengthHigh, false);
  view.setUint32(paddedLength - 4, bitLengthLow, false);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]);
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = (rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
      const s1 = (rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h[0];
    let b = h[1];
    let c = h[2];
    let d = h[3];
    let e = h[4];
    let f = h[5];
    let g = h[6];
    let hh = h[7];

    for (let i = 0; i < 64; i++) {
      const s1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (hh + s1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const s0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (s0 + maj) >>> 0;

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + hh) >>> 0;
  }

  let hex = '';
  for (let i = 0; i < h.length; i++) {
    hex += h[i].toString(16).padStart(8, '0');
  }
  return hex;
}

/* -------------------------------------------------------------------------- */
/* Key derivation                                                             */
/* -------------------------------------------------------------------------- */

/** WebCrypto is only exposed in a secure context, so this is resolved per call. */
function getSubtleCrypto(): SubtleCrypto | null {
  const webCrypto = globalThis.crypto;
  if (!webCrypto) return null;
  return webCrypto.subtle ?? null;
}

function getRandomSaltHex(): string | null {
  const webCrypto = globalThis.crypto;
  if (!webCrypto || typeof webCrypto.getRandomValues !== 'function') return null;
  const salt = new Uint8Array(SALT_BYTES);
  webCrypto.getRandomValues(salt);
  return toHex(salt);
}

function selectKdf(): KdfName | null {
  return getSubtleCrypto() ? 'pbkdf2-sha256' : 'sha256-fallback';
}

async function deriveDigest(
  password: string,
  saltHex: string,
  iterations: number,
  kdf: KdfName
): Promise<string> {
  if (kdf === 'sha256-fallback') {
    return sha256Hex(`${saltHex}:${password}`);
  }

  const subtle = getSubtleCrypto();
  if (!subtle) {
    // The record was created with PBKDF2 but this context cannot verify it.
    // Surfacing a distinct digest here would be worse than failing loudly.
    throw new Error('Secure key derivation is unavailable in this context.');
  }

  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex), iterations, hash: 'SHA-256' },
    keyMaterial,
    DERIVED_BITS
  );
  return toHex(new Uint8Array(derived));
}

/* -------------------------------------------------------------------------- */
/* Account store                                                              */
/* -------------------------------------------------------------------------- */

function isUserRecord(value: unknown): value is UserRecord {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.saltHex === 'string' &&
    typeof candidate.hashHex === 'string' &&
    typeof candidate.iterations === 'number'
  );
}

function readUsers(): Record<string, UserRecord> {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.users);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const users: Record<string, UserRecord> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isUserRecord(value)) users[key] = value;
    }
    return users;
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, UserRecord>): boolean {
  try {
    localStorage.setItem(AUTH_STORAGE_KEYS.users, JSON.stringify(users));
    return true;
  } catch {
    return false;
  }
}

export function hasRegisteredUser(): boolean {
  return Object.keys(readUsers()).length > 0;
}

export function getSignedInEmail(): string | null {
  try {
    const email = localStorage.getItem(AUTH_STORAGE_KEYS.session);
    return email && email.trim() ? email : null;
  } catch {
    return null;
  }
}

function startSession(email: string): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEYS.session, email);
  } catch {
    // A session that cannot be persisted is still valid for this page load;
    // only the reload convenience is lost.
  }
}

export function signOut(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.session);
  } catch {
    // Nothing else to do: the account record is intentionally kept so the same
    // user can sign back in.
  }
}

/** Records that the user ticked the Privacy Policy consent box, on this device. */
export function recordConsent(email: string): void {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.consent);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const consents: Record<string, string> =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, string>)
        : {};
    consents[normalized] = new Date().toISOString();
    localStorage.setItem(AUTH_STORAGE_KEYS.consent, JSON.stringify(consents));
  } catch {
    // Consent is still enforced in the UI; failing to timestamp it is not fatal.
  }
}

/* -------------------------------------------------------------------------- */
/* Legacy migration                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The pre-account login screen stored a 32-bit rolling hash (the classic
 * `h * 31 + c` string hash) of `cipherforge_login:<email>:<password>`. It has to
 * be reproduced byte for byte to let existing installs sign in once before
 * being migrated to PBKDF2.
 */
export function legacyHash(email: string, password: string): string {
  let hash = 0;
  const salted = `cipherforge_login:${email}:${password}`;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

async function migrateLegacyAccount(
  legacyHashValue: string,
  candidates: string[],
  password: string,
  users: Record<string, UserRecord>
): Promise<AuthResult> {
  const matched = candidates.find(candidate => legacyHash(candidate, password) === legacyHashValue);
  if (!matched) return INVALID_CREDENTIALS;

  // The legacy digest cannot be inverted back to an address, so the email is
  // only known from what the user typed. Store it normalized so later sign-ins
  // look the account up with the same key.
  const email = normalizeEmail(matched);

  const kdf = selectKdf();
  if (!kdf) {
    return fail(
      'crypto-unavailable',
      'Secure password storage is unavailable in this browser, so the existing account cannot be upgraded.'
    );
  }

  const saltHex = getRandomSaltHex();
  if (!saltHex) {
    return fail(
      'crypto-unavailable',
      'Secure random numbers are unavailable in this browser, so the existing account cannot be upgraded.'
    );
  }

  const iterations = kdf === 'pbkdf2-sha256' ? PBKDF2_ITERATIONS : FALLBACK_ITERATIONS;
  let hashHex: string;
  try {
    hashHex = await deriveDigest(password, saltHex, iterations, kdf);
  } catch {
    return fail('crypto-unavailable', 'Secure key derivation is unavailable in this context.');
  }

  users[email] = {
    saltHex,
    hashHex,
    iterations,
    kdf
  };

  if (!writeUsers(users)) {
    return fail('storage-unavailable', 'This browser is blocking local storage, so the account cannot be saved.');
  }

  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.legacyHash);
  } catch {
    // The upgraded record takes precedence; a stale legacy key is harmless.
  }

  startSession(email);
  return succeed(email, { migrated: true });
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export async function registerUser(email: string, password: string): Promise<AuthResult> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return fail('invalid-email', 'Please enter a valid email address.');
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return fail('password-too-short', `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const users = readUsers();
  if (users[normalized]) {
    return fail('email-exists', 'An account with this email already exists. Please sign in.');
  }

  const kdf = selectKdf();
  if (!kdf) {
    return fail(
      'crypto-unavailable',
      'Secure password storage is unavailable in this browser, so the account cannot be created.'
    );
  }

  const saltHex = getRandomSaltHex();
  if (!saltHex) {
    return fail(
      'crypto-unavailable',
      'Secure random numbers are unavailable in this browser, so the account cannot be created.'
    );
  }

  const iterations = kdf === 'pbkdf2-sha256' ? PBKDF2_ITERATIONS : FALLBACK_ITERATIONS;
  let hashHex: string;
  try {
    hashHex = await deriveDigest(password, saltHex, iterations, kdf);
  } catch {
    return fail('crypto-unavailable', 'Secure key derivation is unavailable in this context.');
  }

  users[normalized] = { saltHex, hashHex, iterations, kdf };
  if (!writeUsers(users)) {
    return fail('storage-unavailable', 'This browser is blocking local storage, so the account cannot be saved.');
  }

  startSession(normalized);
  return succeed(normalized, { created: true });
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const normalized = normalizeEmail(email);
  const typed = email.trim();

  // A malformed address and an unknown account must be indistinguishable from a
  // wrong password so the form cannot be used to enumerate registered emails.
  if (!isValidEmail(normalized) || !password) {
    return INVALID_CREDENTIALS;
  }

  const users = readUsers();
  const record = users[normalized];

  if (record) {
    const kdf: KdfName = record.kdf ?? 'pbkdf2-sha256';
    let candidate: string;
    try {
      candidate = await deriveDigest(password, record.saltHex, record.iterations, kdf);
    } catch {
      return fail('crypto-unavailable', 'Secure key derivation is unavailable in this context.');
    }
    if (!safeEqual(candidate, record.hashHex)) {
      return INVALID_CREDENTIALS;
    }
    startSession(normalized);
    return succeed(normalized);
  }

  // Legacy single-hash installs, migrated on first successful sign-in.
  let legacyHashValue: string | null = null;
  try {
    legacyHashValue = localStorage.getItem(AUTH_STORAGE_KEYS.legacyHash);
  } catch {
    legacyHashValue = null;
  }
  if (!legacyHashValue || Object.keys(users).length > 0) {
    return INVALID_CREDENTIALS;
  }

  const candidates = normalized === typed ? [typed] : [normalized, typed];
  return migrateLegacyAccount(legacyHashValue, candidates, password, users);
}
