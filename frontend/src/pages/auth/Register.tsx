import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../api/authApi';
import { generateKeyPair, encryptPrivateKey } from '../../crypto/cryptoService';
import type { RegisterRequest } from '../../types/auth';

export const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterRequest>();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      toast.info("Generating cryptographic keys... (this may take a moment)");
      
      // 1. Generowanie kluczy RSA (Client-side)
      const keyPair = await generateKeyPair();
      
      // 2. Szyfrowanie klucza prywatnego hasłem użytkownika
      const encryptedData = await encryptPrivateKey(keyPair.privateKey, data.password);

      // 3. Przygotowanie payloadu
      const payload: RegisterRequest = {
        username: data.username,
        email: data.email,
        password: data.password,
        publicKey: keyPair.publicKey,
        encryptedPrivateKey: encryptedData.encryptedKey,
        keySalt: encryptedData.salt
      };

      // 4. Wysłanie do API
      await authApi.register(payload);
      
      toast.success("Account created! You can now log in.");
      navigate('/login');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data || "Registration error");
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
          <h1 className="text-white text-3xl font-bold">Sign Up</h1>
        </div>

        {/* White Card Section */}
        <div className="bg-white rounded-t-[2.5rem] px-8 pt-10 pb-8 flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Username Input */}
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Username</label>
              <div className="relative">
                <input
                  {...register("username", { required: "Required", minLength: { value: 3, message: "Min. 3 characters" } })}
                  placeholder="Enter Username"
                  className="w-full border-b border-gray-200 py-2 text-gray-800 placeholder-gray-400 focus:border-[#06807b] focus:outline-none transition-colors bg-transparent"
                />
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Email</label>
              <div className="relative">
                <input
                  type="email"
                  {...register("email", { required: "Required" })}
                  placeholder="urmail@gmail.com"
                  className="w-full border-b border-gray-200 py-2 text-gray-800 placeholder-gray-400 focus:border-[#06807b] focus:outline-none transition-colors bg-transparent"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Password</label>
              <div className="relative">
                <input
                  type="password"
                  {...register("password", { 
                    required: "Required", 
                    minLength: { value: 12, message: "Min. 12 characters" },
                    pattern: {
                      value: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$/,
                      message: "Must contain an uppercase letter, a number, and a special character"
                    }
                  })}
                  placeholder="Enter Password"
                  className="w-full border-b border-gray-200 py-2 text-gray-800 placeholder-gray-400 focus:border-[#06807b] focus:outline-none transition-colors bg-transparent"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#06807b] text-white py-3.5 rounded-xl font-semibold shadow-lg hover:bg-[#056b67] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? 'Generowanie kluczy...' : 'Sign Up'}
            </button>

            {/* Sign In Link */}
            <div className="text-center text-sm text-gray-400">
              Already have an account ?{" "}
              <Link to="/login" className="text-[#06807b] font-bold hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};