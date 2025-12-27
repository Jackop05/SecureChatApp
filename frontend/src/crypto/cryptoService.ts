import forge from 'node-forge';
import type { KeyPair, EncryptedPrivateKey } from './types.ts';

const RSA_KEY_SIZE = 2048;
const PBKDF2_ITERATIONS = 100000; // Duża liczba iteracji utrudnia brute-force hasła
const SALT_SIZE = 16;
const IV_SIZE = 12; // Standard dla AES-GCM
const AES_KEY_SIZE = 32; // 256 bitów

export const generateKeyPair = async (): Promise<KeyPair> => {
    return new Promise((resolve, reject) => {
        forge.pki.rsa.generateKeyPair({ bits: RSA_KEY_SIZE, workers: 2 }, (err, keypair) => {
            if (err) return reject(err);

            const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
            const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

            resolve({ publicKey: publicKeyPem, privateKey: privateKeyPem });
        });
    });
};

/**
 * Szyfruje Klucz Prywatny hasłem użytkownika.
 * Format wyjściowy (Base64): [IV (12 bytes)] + [Ciphertext] + [AuthTag (16 bytes)]
 */
export const encryptPrivateKey = async (privateKeyPem: string, password: string): Promise<EncryptedPrivateKey> => {
  // 1. Generuj losową sól i IV
  const salt = forge.random.getBytesSync(SALT_SIZE);
  const iv = forge.random.getBytesSync(IV_SIZE);
  
  // 2. Wyprowadź klucz szyfrujący z hasła (PBKDF2)
  const key = forge.pkcs5.pbkdf2(password, salt, PBKDF2_ITERATIONS, AES_KEY_SIZE);

  // 3. Szyfruj AES-GCM
  const cipher = forge.cipher.createCipher('AES-GCM', key);
  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(privateKeyPem));
  cipher.finish();

  const encrypted = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();

  // 4. Pakowanie: IV + Encrypted + Tag
  const combinedBuffer = forge.util.createBuffer();
  combinedBuffer.putBytes(iv);
  combinedBuffer.putBytes(encrypted);
  combinedBuffer.putBytes(tag);

  return {
    encryptedKey: forge.util.encode64(combinedBuffer.getBytes()),
    salt: forge.util.bytesToHex(salt),
    iv: "" // IV jest teraz wewnątrz encryptedKey, pole zostawiamy dla zgodności typów
  };
};

/**
 * Odszyfrowuje Klucz Prywatny hasłem użytkownika.
 * Oczekuje formatu: [IV] + [Ciphertext] + [Tag] w encryptedKey.
 */
export const decryptPrivateKey = async (encryptedData: EncryptedPrivateKey, password: string): Promise<string> => {
  const { encryptedKey, salt } = encryptedData;

  // 1. Dekoduj Base64
  const combinedBytes = forge.util.decode64(encryptedKey);
  
  // 2. Walidacja długości (IV + Tag = 28 bytes minimum)
  if (combinedBytes.length < IV_SIZE + 16) {
    throw new Error("Uszkodzony klucz prywatny (za krótki).");
  }

  // 3. Rozpakowanie: IV | Content | Tag
  const iv = combinedBytes.slice(0, IV_SIZE);
  const tagLength = 16;
  const encryptedContent = combinedBytes.slice(IV_SIZE, combinedBytes.length - tagLength);
  const tag = combinedBytes.slice(combinedBytes.length - tagLength);

  // 4. Wyprowadź klucz z hasła
  const saltBytes = forge.util.hexToBytes(salt);
  const key = forge.pkcs5.pbkdf2(password, saltBytes, PBKDF2_ITERATIONS, AES_KEY_SIZE);

  // 5. Deszyfruj
  const decipher = forge.cipher.createDecipher('AES-GCM', key);
  decipher.start({ iv: iv, tag: forge.util.createBuffer(tag) });
  decipher.update(forge.util.createBuffer(encryptedContent));
  const success = decipher.finish();

  if (!success) {
    throw new Error("Nieprawidłowe hasło lub uszkodzony klucz.");
  }

  return decipher.output.toString();
};

/**
 * Generuje losowy klucz sesji AES (32 bajty)
 */
export const generateSessionKey = (): string => {
  return forge.util.bytesToHex(forge.random.getBytesSync(32));
};

/**
 * Szyfruje treść (string) kluczem sesji AES-GCM.
 * Zwraca { encryptedContent, iv }
 */
export const encryptMessageContent = (content: string, sessionKeyHex: string) => {
  const key = forge.util.hexToBytes(sessionKeyHex);
  const iv = forge.random.getBytesSync(IV_SIZE);
  
  const cipher = forge.cipher.createCipher('AES-GCM', key);
  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(content, 'utf8'));
  cipher.finish();

  const encrypted = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();

  // Pakujemy: IV + Encrypted + Tag (podobnie jak przy kluczu prywatnym)
  const combined = iv + encrypted + tag;
  
  return forge.util.encode64(combined);
};

/**
 * Szyfruje klucz sesji (Hex) kluczem publicznym odbiorcy (RSA).
 */
export const encryptSessionKey = (sessionKeyHex: string, publicKeyPem: string): string => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  // RSA-OAEP jest bezpieczniejszy niż starsze PKCS#1 v1.5
  const encrypted = publicKey.encrypt(sessionKeyHex, 'RSA-OAEP');
  return forge.util.encode64(encrypted);
};

/**
 * Podpisuje dane kluczem prywatnym nadawcy (RSA-SHA256).
 */
export const signMessage = (dataToSign: string, privateKeyPem: string): string => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const md = forge.md.sha256.create();
  md.update(dataToSign, 'utf8');
  const signature = privateKey.sign(md);
  return forge.util.encode64(signature);
};

/**
 * Odszyfrowuje klucz sesji (RSA).
 * Używa klucza prywatnego odbiorcy.
 */
export const decryptSessionKey = (encryptedSessionKeyBase64: string, privateKeyPem: string): string => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const encrypted = forge.util.decode64(encryptedSessionKeyBase64);
  // RSA-OAEP
  return privateKey.decrypt(encrypted, 'RSA-OAEP');
};

/**
 * Odszyfrowuje treść wiadomości (AES-GCM).
 * Oczekuje formatu: [IV] + [Ciphertext] + [Tag] w encryptedContentBase64.
 */
export const decryptMessageContent = (encryptedContentBase64: string, sessionKeyHex: string): string => {
  const combinedBytes = forge.util.decode64(encryptedContentBase64);
  const key = forge.util.hexToBytes(sessionKeyHex);

  // Rozpakowanie: IV (12) | Content | Tag (16)
  const iv = combinedBytes.slice(0, IV_SIZE);
  const tagLength = 16;
  const encryptedContent = combinedBytes.slice(IV_SIZE, combinedBytes.length - tagLength);
  const tag = combinedBytes.slice(combinedBytes.length - tagLength);

  const decipher = forge.cipher.createDecipher('AES-GCM', key);
  decipher.start({ iv: iv, tag: forge.util.createBuffer(tag) });
  decipher.update(forge.util.createBuffer(encryptedContent));
  const success = decipher.finish();

  if (!success) {
    throw new Error("Błąd deszyfrowania treści (nieprawidłowy klucz lub uszkodzone dane).");
  }

  // Używamy TextDecoder zamiast forge.util.decodeUtf8, aby uniknąć błędów "URI malformed"
  const binaryString = decipher.output.getBytes();
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
};

/**
 * Weryfikuje podpis cyfrowy nadawcy.
 */
export const verifySignature = (
  dataToCheck: string, 
  signatureBase64: string, 
  senderPublicKeyPem: string
): boolean => {
  try {
    const publicKey = forge.pki.publicKeyFromPem(senderPublicKeyPem);
    const signature = forge.util.decode64(signatureBase64);
    const md = forge.md.sha256.create();
    md.update(dataToCheck, 'utf8');
    return publicKey.verify(md.digest().bytes(), signature);
  } catch (e) {
    console.error("Błąd weryfikacji podpisu:", e);
    return false;
  }
};