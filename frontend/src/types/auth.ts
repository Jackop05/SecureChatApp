export interface User {
    username: string;
    email: string;
    publicKey: string;
    isTwoFactorEnabled: boolean;
}

export interface AuthState {
    user: User | null;
    privateKey: string | null; // Odszyfrowany klucz prywatny
    token: string | null;
    isAuthenticated: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  publicKey: string;
  encryptedPrivateKey: string;
  keySalt: string;
}

// POST /api/auth/login
export interface LoginRequest {
  login: string; // username lub email
  password: string;
}

// Response z /login oraz /verify-2fa
export interface LoginResponse {
  token: string;
  isTwoFactorEnabled: boolean;
  encryptedPrivateKey?: string; // Może być undefined jeśli 2FA jest wymagane, a jeszcze nie podano kodu (choć w naszej logice backend zwraca to dopiero po sukcesie)
  keySalt?: string;
}

// POST /api/auth/verify-2fa oraz /confirm
export interface TotpVerificationRequest {
  username: string;
  code: string;
}