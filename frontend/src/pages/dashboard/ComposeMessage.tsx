import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { messageApi } from '../../api/messageApi';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageUtils';
import { 
  generateSessionKey, 
  encryptMessageContent, 
  encryptSessionKey, 
  signMessage 
} from '../../crypto/cryptoService';

interface ComposeForm {
  receiver: string;
  content: string;
  attachment?: FileList;
}

export const ComposeMessage = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ComposeForm>();
  const [isLoading, setIsLoading] = useState(false);
  const { privateKey } = useAuth();
  const navigate = useNavigate();

  const attachment = watch("attachment");

  const onSubmit = async (data: ComposeForm) => {
    if (!privateKey) {
      toast.error("Error: Missing private key. Please log in again.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Pobierz klucz publiczny odbiorcy
      toast.info(`Fetching public key for ${data.receiver}...`);
      let receiverPublicKey;
      try {
        receiverPublicKey = await userApi.getPublicKey(data.receiver);
      } catch (e) {
        toast.error("User not found.");
        setIsLoading(false);
        return;
      }

      // 2. Przygotuj treść (JSON z wiadomością i ewentualnym plikiem Base64)
      let payloadContent = {
        text: data.content,
        attachment: null as { name: string, data: string, type: string } | null
      };

      if (data.attachment && data.attachment.length > 0) {
        let file = data.attachment[0];

        // Image Compression
        if (file.type.startsWith('image/')) {
          try {
            toast.info("Compressing image...");
            const originalSize = file.size;
            file = await compressImage(file);
            toast.success(`Compressed: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(file.size / 1024 / 1024).toFixed(2)}MB`);
          } catch (e) {
            console.error("Compression failed", e);
            toast.warning("Image compression failed, sending original.");
          }
        }
        
        // File size validation (30MB limit)
        const MAX_SIZE = 30 * 1024 * 1024; // 30MB
        if (file.size > MAX_SIZE) {
          toast.error(`File is too large. Maximum size is 30MB. Your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
          setIsLoading(false);
          return;
        }

        const base64 = await convertFileToBase64(file);
        payloadContent.attachment = {
          name: file.name,
          type: file.type,
          data: base64
        };
      }

      const contentJson = JSON.stringify(payloadContent);

      // 3. Kryptografia (Hybrid Encryption)
      toast.info("Encrypting message...");
      
      // A. Generuj klucz sesji AES
      const sessionKey = generateSessionKey();

      // B. Szyfruj treść kluczem AES
      const encryptedContentBase64 = encryptMessageContent(contentJson, sessionKey);

      // C. Szyfruj klucz AES kluczem RSA odbiorcy
      const encryptedSessionKeyBase64 = encryptSessionKey(sessionKey, receiverPublicKey);

      // D. Podpisz zaszyfrowaną treść swoim kluczem prywatnym
      const signatureBase64 = signMessage(encryptedContentBase64, privateKey);

      // 4. Wyślij
      await messageApi.sendMessage({
        receiverName: data.receiver,
        encryptedContent: encryptedContentBase64,
        encryptedSessionKey: encryptedSessionKeyBase64,
        signature: signatureBase64,
        iv: "included_in_content" // Backend wymaga niepustego pola, ale my pakujemy IV w encryptedContent
      });

      toast.success("Message sent securely!");
      navigate('/dashboard');

    } catch (error) {
      console.error(error);
      toast.error("An error occurred while sending.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper do plików
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-800">Compose Message</h2>
          <p className="text-gray-500 text-sm mt-1">Send a secure, encrypted message to another user.</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">Recipient (Username)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <input
                {...register("receiver", { required: "Recipient is required" })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:border-[#06807b] focus:ring-2 focus:ring-[#06807b]/20 focus:outline-none transition-all"
                placeholder="e.g. john_doe"
              />
            </div>
            {errors.receiver && <p className="text-red-500 text-xs mt-1 ml-1">{errors.receiver.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">Message Content</label>
            <div className="relative">
              <textarea
                {...register("content", { required: "Message content is required" })}
                rows={8}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:border-[#06807b] focus:ring-2 focus:ring-[#06807b]/20 focus:outline-none transition-all resize-none"
                placeholder="Type your secret message here..."
              />
            </div>
            {errors.content && <p className="text-red-500 text-xs mt-1 ml-1">{errors.content.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">Attachment (Optional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors cursor-pointer relative group">
              <div className="space-y-1 text-center w-full">
                {attachment && attachment.length > 0 ? (
                  <div className="flex flex-col items-center animate-fade-in">
                    <div className="p-3 bg-teal-50 rounded-full mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#06807b]"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{attachment[0].name}</p>
                    <p className="text-xs text-gray-500 mb-3">{(attachment[0].size / 1024).toFixed(1)} KB</p>
                    <label htmlFor="file-upload" className="text-sm text-[#06807b] hover:text-[#056b67] cursor-pointer font-medium hover:underline">
                      Change file
                      <input id="file-upload" type="file" className="sr-only" {...register("attachment")} />
                    </label>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-[#06807b] transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-[#06807b] hover:text-[#056b67] focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id="file-upload" type="file" className="sr-only" {...register("attachment")} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">Images will be compressed. Max 30MB.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#06807b] hover:bg-[#056b67] hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Encrypting & Sending...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Send Secure Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
