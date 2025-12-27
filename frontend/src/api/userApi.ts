import axiosClient from './axiosClient';

export const userApi = {
  getPublicKey: async (username: string): Promise<string> => {
    // Backend zwraca mapę { "publicKey": "..." } lub sam string?
    // Sprawdźmy UserController.java -> zwraca ResponseEntity<Map<String, String>>
    const response = await axiosClient.get<{ publicKey: string }>(`/users/${username}/public-key`);
    return response.data.publicKey;
  }
};