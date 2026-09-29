import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import App from '../app/App';
import { LoginScreen } from '../app/components/LoginScreen';
import {
  AUTH_STORAGE_KEYS,
  MIN_PASSWORD_LENGTH,
  PBKDF2_ITERATIONS,
  getSignedInEmail,
  hasRegisteredUser,
  legacyHash,
  recordConsent,
  registerUser,
  sha256Hex,
  signIn,
  signOut
} from '../core/security/authManager';

const EMAIL = 'ada@example.com';
const PASSWORD = 'correct-horse-battery-staple';
const CONSENT = 'I explicitly accept the Privacy Policy to use CipherForge Pro.';

function getForm() {
  return screen.getByLabelText('Email').closest('form') as HTMLFormElement;
}

function fillEmail(value: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value } });
}

function fillPassword(value: string) {
  fireEvent.change(screen.getByLabelText('Password'), { target: { value } });
}

function fillConfirmPassword(value: string) {
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value } });
}

function tickConsent() {
  fireEvent.click(screen.getByLabelText(CONSENT));
}

function submit() {
  fireEvent.submit(getForm());
}

function readUsers(): Record<string, { saltHex: string; hashHex: string; iterations: number; kdf?: string }> {
  const raw = localStorage.getItem(AUTH_STORAGE_KEYS.users);
  return raw ? (JSON.parse(raw) as Record<string, { saltHex: string; hashHex: string; iterations: number; kdf?: string }>) : {};
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('LoginScreen account creation', () => {
  it('starts in create-account mode on a fresh device', () => {
    render(<LoginScreen onAuthenticated={() => {}} />);

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(screen.getByLabelText(CONSENT)).not.toBeChecked();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('rejects a mismatched password confirmation', async () => {
    const onAuthenticated = vi.fn();
    render(<LoginScreen onAuthenticated={onAuthenticated} />);

    fillEmail(EMAIL);
    fillPassword(PASSWORD);
    fillConfirmPassword(`${PASSWORD}-different`);
    tickConsent();
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match.');
    expect(hasRegisteredUser()).toBe(false);
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('blocks registration without consent using the exact policy message', async () => {
    const onAuthenticated = vi.fn();
    render(<LoginScreen onAuthenticated={onAuthenticated} />);

    fillEmail(EMAIL);
    fillPassword(PASSWORD);
    fillConfirmPassword(PASSWORD);
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You must explicitly accept the Privacy Policy to proceed.'
    );
    expect(hasRegisteredUser()).toBe(false);
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('rejects a password below the minimum length', async () => {
    render(<LoginScreen onAuthenticated={() => {}} />);

    fillEmail(EMAIL);
    fillPassword('a'.repeat(MIN_PASSWORD_LENGTH - 1));
    fillConfirmPassword('a'.repeat(MIN_PASSWORD_LENGTH - 1));
    tickConsent();
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    );
    expect(hasRegisteredUser()).toBe(false);
  });

  it('rejects a malformed email address', async () => {
    render(<LoginScreen onAuthenticated={() => {}} />);

    fillEmail('not-an-email');
    fillPassword(PASSWORD);
    fillConfirmPassword(PASSWORD);
    tickConsent();
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a valid email address.');
    expect(hasRegisteredUser()).toBe(false);
  });

  it('stores only a salted PBKDF2 digest, never the password', async () => {
    const onAuthenticated = vi.fn();
    render(<LoginScreen onAuthenticated={onAuthenticated} />);

    fillEmail(EMAIL);
    fillPassword(PASSWORD);
    fillConfirmPassword(PASSWORD);
    tickConsent();
    submit();

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));

    const users = readUsers();
    expect(Object.keys(users)).toEqual([EMAIL]);
    const record = users[EMAIL];
    expect(record.kdf).toBe('pbkdf2-sha256');
    expect(record.iterations).toBe(PBKDF2_ITERATIONS);
    expect(record.saltHex).toMatch(/^[0-9a-f]{32}$/);
    expect(record.hashHex).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(users)).not.toContain(PASSWORD);

    expect(getSignedInEmail()).toBe(EMAIL);
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.consent)).toContain(EMAIL);
  });

  it('rejects a duplicate email with a sign-in hint', async () => {
    await registerUser(EMAIL, PASSWORD);
    signOut();

    render(<LoginScreen onAuthenticated={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /^create account$/i }));

    fillEmail(EMAIL);
    fillPassword(PASSWORD);
    fillConfirmPassword(PASSWORD);
    tickConsent();
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists. Please sign in.'
    );
  });

  it('allows switching between create and sign-in modes', () => {
    render(<LoginScreen onAuthenticated={() => {}} />);
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /already have an account\? sign in/i }));
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^create account$/i }));
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });
});

describe('LoginScreen sign-in', () => {
  beforeEach(async () => {
    await registerUser(EMAIL, PASSWORD);
    signOut();
  });

  it('defaults to sign-in mode once an account exists', () => {
    render(<LoginScreen onAuthenticated={() => {}} />);

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();
    expect(screen.getByLabelText(CONSENT)).not.toBeChecked();
  });

  it('blocks sign-in without consent', async () => {
    const onAuthenticated = vi.fn();
    render(<LoginScreen onAuthenticated={onAuthenticated} />);

    fillEmail(EMAIL);
    fillPassword(PASSWORD);
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You must explicitly accept the Privacy Policy to proceed.'
    );
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(getSignedInEmail()).toBeNull();
  });

  it('rejects a wrong password with a uniform message', async () => {
    const onAuthenticated = vi.fn();
    render(<LoginScreen onAuthenticated={onAuthenticated} />);

    fillEmail(EMAIL);
    fillPassword('wrong-password-entirely');
    tickConsent();
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(getSignedInEmail()).toBeNull();
  });

  it('registers a user, signs out, then signs back in with the same credentials', async () => {
    localStorage.clear();
    const onAuthenticated = vi.fn();

    const first = render(<LoginScreen onAuthenticated={onAuthenticated} />);
    fillEmail(EMAIL);
    fillPassword(PASSWORD);
    fillConfirmPassword(PASSWORD);
    tickConsent();
    submit();
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
    expect(getSignedInEmail()).toBe(EMAIL);
    cleanup();

    // Signing out clears the session but keeps the account record.
    signOut();
    expect(getSignedInEmail()).toBeNull();
    expect(hasRegisteredUser()).toBe(true);

    const second = render(<LoginScreen onAuthenticated={onAuthenticated} />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    fillEmail(EMAIL);
    fillPassword(PASSWORD);
    tickConsent();
    submit();

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(2));
    expect(getSignedInEmail()).toBe(EMAIL);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    cleanup();
    first.unmount();
    second.unmount();
  });

  it('hides the login overlay on reload because the session is persisted', async () => {
    await signIn(EMAIL, PASSWORD);
    expect(getSignedInEmail()).toBe(EMAIL);

    // A fresh mount of the app gate reads the session from storage, which is how
    // the overlay stays hidden after a page reload.
    expect(getSignedInEmail()).not.toBeNull();
  });
});

describe('App session wiring', () => {
  it('shows the create-account overlay without a session and sign-out returns to sign-in', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    cleanup();

    await registerUser(EMAIL, PASSWORD);
    expect(getSignedInEmail()).toBe(EMAIL);

    // A reload: the session is read from storage, so the overlay stays hidden
    // and the header offers a real sign-out affordance.
    render(<App />);
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: /create your account/i })).not.toBeInTheDocument()
    );
    expect(screen.getByTitle(`Signed in as ${EMAIL}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(getSignedInEmail()).toBeNull();
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });
});

describe('authManager storage and migration', () => {
  it('normalises email addresses so casing cannot fork an account', async () => {
    const created = await registerUser('  Ada@Example.COM ', PASSWORD);
    expect(created).toMatchObject({ ok: true, email: 'ada@example.com' });

    const duplicate = await registerUser('ADA@example.com', PASSWORD);
    expect(duplicate).toMatchObject({ ok: false, code: 'email-exists' });

    const signedIn = await signIn('ada@EXAMPLE.com', PASSWORD);
    expect(signedIn).toMatchObject({ ok: true, email: 'ada@example.com' });
  });

  it('returns the same generic error for an unknown account and a wrong password', async () => {
    await registerUser(EMAIL, PASSWORD);
    const unknown = await signIn('nobody@example.com', PASSWORD);
    const wrong = await signIn(EMAIL, 'not-the-password');
    expect(unknown).toEqual(wrong);
    expect(unknown).toMatchObject({ ok: false, code: 'invalid-credentials' });
  });

  it('keeps the account record when signing out', async () => {
    await registerUser(EMAIL, PASSWORD);
    signOut();
    expect(getSignedInEmail()).toBeNull();
    expect(hasRegisteredUser()).toBe(true);
    expect(Object.keys(readUsers())).toEqual([EMAIL]);
  });

  it('migrates a legacy single-hash install to a PBKDF2 record on first sign-in', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.legacyHash, legacyHash('ada@example.com', 'legacy-pass-1'));

    const result = await signIn('ada@example.com', 'legacy-pass-1');
    expect(result).toMatchObject({ ok: true, email: 'ada@example.com', migrated: true });

    const users = readUsers();
    expect(users['ada@example.com'].kdf).toBe('pbkdf2-sha256');
    expect(users['ada@example.com'].iterations).toBe(PBKDF2_ITERATIONS);
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.legacyHash)).toBeNull();
    expect(getSignedInEmail()).toBe('ada@example.com');

    // The migrated account still verifies and the legacy key is not consulted.
    const again = await signIn('ada@example.com', 'legacy-pass-1');
    expect(again).toMatchObject({ ok: true });
    expect(await signIn('ada@example.com', 'legacy-pass-2')).toMatchObject({ ok: false });
  });

  it('migrates a legacy account whose email was typed with different casing', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.legacyHash, legacyHash('Ada@Example.com', 'legacy-pass-1'));

    const result = await signIn('Ada@Example.com', 'legacy-pass-1');
    expect(result).toMatchObject({ ok: true, email: 'ada@example.com', migrated: true });
    expect(Object.keys(readUsers())).toEqual(['ada@example.com']);

    // The stored key is normalized, so any casing signs in from now on.
    signOut();
    expect(await signIn('ADA@example.com', 'legacy-pass-1')).toMatchObject({
      ok: true,
      email: 'ada@example.com'
    });
  });

  it('does not fall back to the legacy hash when a real account already exists', async () => {
    await registerUser('ada@example.com', 'pbkdf2-password');
    signOut();
    localStorage.setItem(AUTH_STORAGE_KEYS.legacyHash, legacyHash('legacy@example.com', 'legacy-pass-1'));

    expect(await signIn('legacy@example.com', 'legacy-pass-1')).toMatchObject({ ok: false });
  });

  it('records consent timestamps per account', async () => {
    recordConsent('ada@example.com');
    const stored = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.consent) as string) as Record<string, string>;
    expect(Object.keys(stored)).toEqual(['ada@example.com']);
    expect(Number.isNaN(Date.parse(stored['ada@example.com']))).toBe(false);
  });

  it('ignores a corrupt account store instead of throwing', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.users, 'not-json{');
    expect(hasRegisteredUser()).toBe(false);
    const result = await signIn(EMAIL, PASSWORD);
    expect(result).toMatchObject({ ok: false, code: 'invalid-credentials' });
  });
});

describe('authManager key derivation fallback', () => {
  it('implements SHA-256 correctly (NIST sample vectors)', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
    );
  });

  it('falls back to SHA-256 when crypto.subtle is missing and still verifies the account', async () => {
    // crypto.subtle only exists in a secure context, so an app served over
    // http://<LAN-IP> in development must still be able to store an account.
    Object.defineProperty(globalThis.crypto, 'subtle', { value: undefined, configurable: true });

    try {
      const created = await registerUser(EMAIL, PASSWORD);
      expect(created).toMatchObject({ ok: true, email: EMAIL });
      expect(readUsers()[EMAIL].kdf).toBe('sha256-fallback');

      signOut();
      expect(await signIn(EMAIL, PASSWORD)).toMatchObject({ ok: true, email: EMAIL });
      expect(await signIn(EMAIL, 'wrong-password')).toMatchObject({ ok: false });
    } finally {
      delete (globalThis.crypto as unknown as Record<string, unknown>).subtle;
    }

    // The fallback record is still valid once WebCrypto is available again.
    signOut();
    expect(await signIn(EMAIL, PASSWORD)).toMatchObject({ ok: true, email: EMAIL });
  });
});
