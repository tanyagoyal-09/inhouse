import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000/api";

export const TOKEN_KEY = "patentflow-token";
export const USER_KEY = "patentflow-user";
export const ROLE_KEY = "patentflow-role";

/**
 * Fired on `window` whenever the API answers 401 and the stored session has
 * been cleared, so the router/auth layer can send the user back to sign in
 * instead of leaving a stale, half-working screen on display.
 */
export const AUTH_EXPIRED_EVENT = "patentflow:auth-expired";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  // PatentFlow is the canonical auth storage.
  // The legacy IPForge token is accepted once for backwards compatibility
  // with an already-open browser session.
  const token =
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("ipforge-token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Axios must set multipart boundaries automatically for FormData.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem("ipforge-token");
      localStorage.removeItem("ipforge-user");
      localStorage.removeItem("ipforge-role");
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default api;
