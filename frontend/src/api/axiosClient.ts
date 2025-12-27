import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api', // Dzięki proxy w vite.config.ts, to trafi do https://localhost/api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dodajemy interceptor, który automatycznie dokleja token do każdego zapytania
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;