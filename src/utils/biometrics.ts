/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const bufferToBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlToBuffer = (base64Url: string): Uint8Array<ArrayBuffer> => {
  const padded = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(padLen));
  const arrayBuffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export interface BiometricSupportInfo {
  supported: boolean;
  platformAuthenticator: boolean;
  deviceLabel: string;
}

export async function detectBiometricSupport(): Promise<BiometricSupportInfo> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let deviceLabel = 'Device Biometrics';
  if (/iPhone|iPad/i.test(ua)) deviceLabel = 'Face ID / Touch ID';
  else if (/Mac/i.test(ua)) deviceLabel = 'Mac Touch ID';
  else if (/Android/i.test(ua)) deviceLabel = 'Android Fingerprint / Face Unlock';
  else if (/Windows/i.test(ua)) deviceLabel = 'Windows Hello';

  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    !navigator.credentials
  ) {
    return { supported: false, platformAuthenticator: false, deviceLabel };
  }

  try {
    const available =
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return {
      supported: true,
      platformAuthenticator: available,
      deviceLabel,
    };
  } catch {
    return { supported: true, platformAuthenticator: false, deviceLabel };
  }
}

export interface BiometricEnrollResult {
  credentialId: string;
  deviceName: string;
}

export async function enrollDeviceBiometricPasskey(params: {
  uid: string;
  email: string;
  displayName: string;
}): Promise<BiometricEnrollResult> {
  const support = await detectBiometricSupport();
  if (!support.supported) {
    throw new Error(
      'This browser does not support WebAuthn biometrics. Install the app on a modern phone or desktop browser.',
    );
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const userIdBytes = new TextEncoder().encode(params.uid.slice(0, 64));

  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'Morning Bright Digital Banking',
      id: window.location.hostname,
    },
    user: {
      id: userIdBytes,
      name: params.email,
      displayName: params.displayName || params.email,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: support.platformAuthenticator ? 'platform' : undefined,
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: 60000,
    attestation: 'none',
  };

  const credential = (await navigator.credentials.create({
    publicKey: publicKeyOptions,
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Biometric enrollment was cancelled.');
  }

  const credentialId = bufferToBase64Url(credential.rawId);
  try {
    localStorage.setItem(`mb_webauthn_cred_${params.uid}`, credentialId);
  } catch {
    // ignore storage errors
  }

  return {
    credentialId,
    deviceName: support.deviceLabel,
  };
}

export async function verifyDeviceBiometricPasskey(
  uid: string,
  storedCredentialId?: string | null,
): Promise<boolean> {
  const support = await detectBiometricSupport();
  if (!support.supported) {
    throw new Error('Biometric authentication is not supported on this device.');
  }

  const localCred = (() => {
    try {
      return localStorage.getItem(`mb_webauthn_cred_${uid}`);
    } catch {
      return null;
    }
  })();

  const activeCredentialId = storedCredentialId || localCred;
  if (!activeCredentialId) {
    throw new Error('No biometric passkey is enrolled on this device yet.');
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const publicKeyOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: window.location.hostname,
    allowCredentials: [
      {
        id: base64UrlToBuffer(activeCredentialId),
        type: 'public-key',
        transports: ['internal', 'hybrid'],
      },
    ],
    userVerification: 'required',
    timeout: 60000,
  };

  const assertion = await navigator.credentials.get({
    publicKey: publicKeyOptions,
  });

  return Boolean(assertion);
}
