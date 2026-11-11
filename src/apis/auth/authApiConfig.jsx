import axios from "axios";
import { getStoredToken } from "@/lib/authStorage";

const BASE_URL = `${import.meta.env.VITE_APP_AUTH_URL}/api`;

const authApiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

authApiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default authApiClient;
