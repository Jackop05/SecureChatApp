export interface KeyPair {
    publicKey: string;
    privateKey: string;
}

export interface EncryptedPrivateKey {
    encryptedKey: string;
    salt: string;
    iv: string;
} 

export interface EncryptedMessage {
    encryptedContent: string;
    encryptedKey: string;
    signature: string;
    iv: string;
}