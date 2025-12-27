import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

export const Settings = () => {
  const [secret, setSecret] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<{ code: string }>();
  const { user, updateUser } = useAuth();

  const isEnabled = user?.isTwoFactorEnabled;

  const handleStartSetup = async () => {
    try {
      const secretKey = await authApi.setup2fa();
      setSecret(secretKey);
    } catch (error) {
      toast.error("Error generating 2FA secret.");
    }
  };

  const onConfirm = async (data: { code: string }) => {
    if (!user) return;
    try {
      const msg = await authApi.confirm2fa({ username: user.username, code: data.code });
      toast.success(msg);
      updateUser({ ...user, isTwoFactorEnabled: true });
      setSecret(null);
      reset();
    } catch (error: any) {
      toast.error(error.response?.data || "Code verification error.");
    }
  };

  const handleDisable = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to disable 2FA? This will reduce your account security.")) return;
    
    try {
      const msg = await authApi.disable2fa();
      toast.success(msg);
      updateUser({ ...user, isTwoFactorEnabled: false });
      setSecret(null);
    } catch (error: any) {
      toast.error("Error disabling 2FA.");
    }
  };

  // URL do QR kodu (standard otpauth)
  const otpUrl = secret ? `otpauth://totp/SecureChat:${user?.username}?secret=${secret}&issuer=SecureChat` : "";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-800">Security Settings</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your account security and two-factor authentication.</p>
        </div>

        <div className="p-8">
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 bg-teal-50 rounded-xl text-[#06807b]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Two-Factor Authentication (2FA)</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Add an extra layer of security to your account by requiring a code from your authenticator app (e.g., Google Authenticator) when logging in.
              </p>
            </div>
          </div>

          {!secret && !isEnabled && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 text-center">
              <p className="text-gray-600 mb-4">2FA is currently <span className="font-bold text-red-500">disabled</span>.</p>
              <button
                onClick={handleStartSetup}
                className="bg-[#06807b] hover:bg-[#056b67] text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all hover:shadow-lg flex items-center gap-2 mx-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                Configure 2FA
              </button>
            </div>
          )}

          {isEnabled && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <span className="text-emerald-800 font-medium">2FA is active on your account.</span>
              </div>
              <button
                onClick={handleDisable}
                className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Disable 2FA
              </button>
            </div>
          )}

          {secret && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h4 className="font-bold text-gray-800">Setup Instructions</h4>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <QRCodeSVG 
                      value={otpUrl} 
                      size={180}
                      level={"H"}
                      includeMargin={true}
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <span className="bg-teal-100 text-[#06807b] text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Step 1</span>
                      <p className="text-gray-700 mt-2">Scan the QR code with your authenticator app.</p>
                    </div>
                    <div>
                      <span className="bg-teal-100 text-[#06807b] text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Step 2</span>
                      <p className="text-gray-700 mt-2">Enter the 6-digit code from the app below to confirm.</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Secret Key</p>
                      <p className="font-mono text-gray-800 break-all">{secret}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <form onSubmit={handleSubmit(onConfirm)} className="flex gap-3 max-w-md mx-auto">
                    <input
                      {...register("code", { required: true })}
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] font-mono focus:border-[#06807b] focus:ring-2 focus:ring-[#06807b]/20 focus:outline-none transition-all"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <button
                      type="submit"
                      className="bg-[#06807b] hover:bg-[#056b67] text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all"
                    >
                      Verify
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
