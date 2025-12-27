import axiosClient from './axiosClient';

export interface MessageResponse {
  id: string;
  senderUsername: string;
  encryptedContent: string;
  encryptedSessionKey: string;
  signature: string;
  iv: string;
  isRead: boolean;
  sentAt: string;
}

export interface MessageListItem {
  id: string;
  senderUsername: string;
  isRead: boolean;
  sentAt: string;
}

export interface SendMessageRequest {
  receiverName: string;
  encryptedContent: string;
  encryptedSessionKey: string;
  signature: string;
  iv: string;
}

export const messageApi = {
  getInbox: async (): Promise<MessageListItem[]> => {
    const response = await axiosClient.get<MessageListItem[]>('/message/inbox');
    return response.data;
  },

  getMessage: async (id: string): Promise<MessageResponse> => {
    const response = await axiosClient.get<MessageResponse>(`/message/${id}`);
    return response.data;
  },

  sendMessage: async (data: SendMessageRequest): Promise<void> => {
    await axiosClient.post('/message/send', data);
  },

  deleteMessage: async (id: string): Promise<void> => {
    await axiosClient.delete(`/message/${id}`);
  },
  
  markAsRead: async (id: string): Promise<void> => {
    await axiosClient.put(`/message/${id}/read`);
  }
};