import React from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../api/authApi';
import { decryptPrivateKey } from '../../crypto/cryptoService';
import { useAuth } from '../../context/AuthContext';

export const Verify2FA = () => {
  const { register, handleSubmit } = useForm<{ code: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Dane przekazane z Login.tsx
  const { username, password } = location.state || {};

  if (!username || !password) {
    navigate('/login');
    return null;
  }

  const onSubmit = async (data: { code: string }) => {
    try {
      // 1. Weryfikacja kodu na backendzie
      const response = await authApi.verify2fa({ username, code: data.code });

      if (!response.encryptedPrivateKey || !response.keySalt) {
        throw new Error("Error: Missing keys in response.");
      }

      // 2. Odszyfrowanie klucza prywatnego (tak samo jak przy zwykłym logowaniu)
      const privateKey = await decryptPrivateKey(
        {
          encryptedKey: response.encryptedPrivateKey,
          salt: response.keySalt,
          iv: ""
        },
        password
      );

      // 3. Zalogowanie
      login(response.token, username, privateKey, true);
      toast.success("Logged in successfully!");
      navigate('/dashboard');

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data || "Invalid 2FA code.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#06807b] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Section */}
        <div className="px-8 pt-12 pb-8">
          <p className="text-teal-100/80 text-sm mb-1">Security</p>
          <h1 className="text-white text-3xl font-bold">Verify 2FA</h1>
        </div>

        {/* White Card Section */}
        <div className="bg-white rounded-t-[2.5rem] px-8 pt-10 pb-8 flex-1">
          <p className="text-gray-500 mb-6 text-center">Enter the code from your authenticator app.</p>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700 text-center">Authentication Code</label>
              <div className="relative">
                <input
                  {...register("code", { required: true })}
                  className="w-full border-b-2 border-gray-200 py-3 text-gray-800 text-center text-3xl tracking-[0.5em] placeholder-gray-300 focus:border-[#06807b] focus:outline-none transition-colors bg-transparent font-mono"
                  placeholder="000000"
                  autoFocus
                  maxLength={6}
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#06807b] text-white py-3.5 rounded-xl font-semibold shadow-lg hover:bg-[#056b67] transition-all mt-4"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
