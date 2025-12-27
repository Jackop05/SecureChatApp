import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../api/authApi';
import { decryptPrivateKey } from '../../crypto/cryptoService';
import { useAuth } from '../../context/AuthContext';
import type { LoginRequest } from '../../types/auth';

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      // 1. Strzał do API po token i zaszyfrowane klucze
      const response = await authApi.login(data);

      // OBSŁUGA 2FA
      if (response.isTwoFactorEnabled) {
        toast.info("Wymagane uwierzytelnienie dwuskładnikowe (2FA).");
        // Przekazujemy login i hasło do widoku weryfikacji, bo będą potrzebne do odszyfrowania klucza PO weryfikacji
        navigate('/verify-2fa', { state: { username: data.login, password: data.password } });
        return;
      }

      if (!response.encryptedPrivateKey || !response.keySalt) {
        throw new Error("Błąd serwera: Brak kluczy kryptograficznych w odpowiedzi.");
      }

      toast.info("Odszyfrowywanie klucza prywatnego...");

      // 2. Odszyfrowanie klucza prywatnego hasłem użytkownika (Client-side)
      const privateKey = await decryptPrivateKey(
        {
          encryptedKey: response.encryptedPrivateKey,
          salt: response.keySalt,
          iv: "" // IV jest zakodowane w encryptedKey w naszej implementacji cryptoService, więc tu puste lub ignorowane
        },
        data.password
      );

      // 3. Zapisanie stanu w Context (Token + Odszyfrowany Klucz)
      login(response.token, data.login, privateKey, response.isTwoFactorEnabled);
      
      toast.success("Zalogowano pomyślnie!");
      navigate('/dashboard'); // Przekierowanie do skrzynki odbiorczej

    } catch (error: any) {
      console.error(error);
      // Jeśli błąd pochodzi z decryptPrivateKey
      if (error.message === "Nieprawidłowe hasło lub uszkodzony klucz.") {
        toast.error("Nieprawidłowe hasło (nie udało się odszyfrować klucza).");
      } else {
        toast.error(error.response?.data || "Błąd logowania");
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#06807b] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Section */}
        <div className="px-8 pt-12 pb-8">
          <p className="text-teal-100/80 text-sm mb-1">Welcome</p>
          <h1 className="text-white text-3xl font-bold">Sign In</h1>
        </div>

        {/* White Card Section */}
        <div className="bg-white rounded-t-[2.5rem] px-8 pt-10 pb-8 flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Email</label>
              <div className="relative">
                <input
                  type="text"
                  {...register("login", { required: "Username or Email is required" })}
                  placeholder="urmail@gmail.com"
                  className="w-full border-b border-gray-200 py-2 text-gray-800 placeholder-gray-400 focus:border-[#06807b] focus:outline-none transition-colors bg-transparent"
                />
              </div>
              {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login.message}</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Password</label>
              <div className="relative">
                <input
                  type="password"
                  {...register("password", { required: "Password is required" })}
                  placeholder="Enter Password"
                  className="w-full border-b border-gray-200 py-2 text-gray-800 placeholder-gray-400 focus:border-[#06807b] focus:outline-none transition-colors bg-transparent"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Sign In Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#06807b] text-white py-3.5 rounded-xl font-semibold shadow-lg hover:bg-[#056b67] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Sign Up Link */}
            <div className="text-center text-sm text-gray-400">
              Don't have an account ?{" "}
              <Link to="/register" className="text-[#06807b] font-bold hover:underline">
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};