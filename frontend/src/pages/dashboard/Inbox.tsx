import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { messageApi, type MessageListItem } from '../../api/messageApi';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { 
  decryptSessionKey, 
  decryptMessageContent, 
  verifySignature 
} from '../../crypto/cryptoService';
import clsx from 'clsx';

interface DecryptedMessage {
  id: string;
  text: string;
  attachment?: { name: string, data: string, type: string };
  isVerified: boolean;
}

export const Inbox = () => {
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, DecryptedMessage>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { privateKey } = useAuth();

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const data = await messageApi.getInbox();
      setMessages(data);
    } catch (error) {
      toast.error("Failed to fetch messages.");
    }
  };

  const handleDecrypt = async (listItem: MessageListItem) => {
    if (!privateKey) return;
    if (decryptedCache[listItem.id]) return; // Already decrypted

    setLoadingId(listItem.id);
    try {
      // 1. Fetch full message content (Lazy Loading)
      const msg = await messageApi.getMessage(listItem.id);

      // 2. Decrypt Session Key (RSA)
      const sessionKey = decryptSessionKey(msg.encryptedSessionKey, privateKey);

      // 3. Decrypt Content (AES)
      const contentJson = decryptMessageContent(msg.encryptedContent, sessionKey);
      const content = JSON.parse(contentJson);

      // 4. Verify Signature
      let isVerified = false;
      try {
        const senderKey = await userApi.getPublicKey(msg.senderUsername);
        isVerified = verifySignature(msg.encryptedContent, msg.signature, senderKey);
      } catch (e) {
        console.warn("Failed to fetch sender key for verification.");
      }

      // 5. Save to Cache
      setDecryptedCache(prev => ({
        ...prev,
        [msg.id]: {
          id: msg.id,
          text: content.text,
          attachment: content.attachment,
          isVerified
        }
      }));

      // 6. Mark as Read
      if (!msg.isRead) {
        await messageApi.markAsRead(msg.id);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      }

    } catch (error) {
      console.error(error);
      toast.error("Decryption error! Message might be corrupted or tampered with.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete?")) return;
    try {
      await messageApi.deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success("Deleted.");
    } catch (error) {
      toast.error("Deletion error.");
    }
  };

  const downloadAttachment = (attachment: { name: string, data: string, type: string }) => {
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Inbox</h2>
        <div className="text-sm text-gray-500">
          {messages.length} messages
        </div>
      </div>
      
      <div className="space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <p className="text-gray-500">No messages found.</p>
          </div>
        )}
        
        {messages.map(msg => {
          const decrypted = decryptedCache[msg.id];
          const isOpen = !!decrypted;

          return (
            <div 
              key={msg.id}
              onClick={() => !isOpen && handleDecrypt(msg)}
              className={clsx(
                "bg-white border rounded-xl p-6 transition-all cursor-pointer shadow-sm hover:shadow-md",
                isOpen ? "border-[#06807b] ring-1 ring-[#06807b]/20" : "border-gray-200 hover:border-[#06807b]/50",
                !msg.isRead && !isOpen && "border-l-4 border-l-[#06807b]"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-[#06807b] font-bold text-lg">
                    {msg.senderUsername.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{msg.senderUsername}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(msg.sentAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDelete(msg.id, e)}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                  title="Delete message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>

              {loadingId === msg.id ? (
                <div className="text-[#06807b] flex items-center gap-2 py-4 animate-pulse font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Decrypting message...
                </div>
              ) : isOpen ? (
                <div className="mt-4 animate-fade-in pl-13">
                  <div className="flex items-center gap-2 mb-4">
                    {decrypted.isVerified ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        Signature Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-600 text-xs font-medium bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                        Signature Verification Failed
                      </span>
                    )}
                  </div>
                  
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {decrypted.text}
                  </div>
                  
                  {decrypted.attachment && (
                    <div className="mt-4 pt-4">
                      {decrypted.attachment.type.startsWith('image/') ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            Image Attachment: {decrypted.attachment.name}
                          </p>
                          <img 
                            src={decrypted.attachment.data} 
                            alt="Attachment" 
                            className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm max-h-96 object-contain bg-gray-50"
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadAttachment(decrypted.attachment!); }}
                            className="text-sm text-[#06807b] hover:underline font-medium mt-1"
                          >
                            Download Original
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadAttachment(decrypted.attachment!); }}
                          className="text-sm bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-medium"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                          Download Attachment: {decrypted.attachment.name}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 flex items-center gap-2 py-2 pl-13">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span className="font-medium">Encrypted Message</span>
                  <span className="text-sm text-gray-400 font-normal">(Click to decrypt)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
