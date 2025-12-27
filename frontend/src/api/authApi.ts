import axiosClient from "./axiosClient";
import type { LoginRequest, LoginResponse, RegisterRequest, TotpVerificationRequest } from '../types/auth';

export const authApi = {

    // Rejestracja: Zwraca string (komunikat) lub pusty sukces
    register: async (data: RegisterRequest): Promise<void> => {
        await axiosClient.post<string>('/auth/register', data);
    },
    
    // Logowanie: Zwraca LoginResponse
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        // axios.post<T> mówi, że body odpowiedzi będzie typu T
        const response = await axiosClient.post<LoginResponse>('/auth/login', data);
        return response.data;
    },

    // Weryfikacja 2FA: Też zwraca LoginResponse (token + klucze)
    verify2fa: async (data: TotpVerificationRequest): Promise<LoginResponse> => {
        const response = await axiosClient.post<LoginResponse>('/auth/verify-2fa', data);
        return response.data;
    },

    // Setup 2FA: Zwraca sekret (string)
    setup2fa: async (): Promise<string> => {
        const response = await axiosClient.post<string>('/auth/2fa/setup');
        return response.data;
    },

    // Potwierdzenie 2FA: Zwraca komunikat (string)
    confirm2fa: async (data: TotpVerificationRequest): Promise<string> => {
        const response = await axiosClient.post<string>('/auth/2fa/confirm', data);
        return response.data;
    },

    // Wyłączenie 2FA
    disable2fa: async (): Promise<string> => {
        const response = await axiosClient.post<string>('/auth/2fa/disable');
        return response.data;
    }
}